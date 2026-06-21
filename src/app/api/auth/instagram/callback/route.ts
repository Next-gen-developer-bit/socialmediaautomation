import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const GRAPH_VERSION = process.env.FACEBOOK_GRAPH_VERSION || "v24.0";
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const stateParam = request.nextUrl.searchParams.get("state");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (!code || !stateParam) {
    return NextResponse.redirect(`${appUrl}/dashboard?error=oauth_failed`);
  }

  let state: { userId: string; videoUrl: string; topic: string };
  try {
    state = JSON.parse(Buffer.from(stateParam, "base64url").toString());
  } catch {
    return NextResponse.redirect(`${appUrl}/dashboard?error=invalid_state`);
  }

  const appId = process.env.FACEBOOK_APP_ID!;
  const appSecret = process.env.FACEBOOK_APP_SECRET!;
  const redirectUri = `${appUrl}/api/auth/instagram/callback`;

  try {
    // 1. Exchange authorization code for a short-lived user access token
    const tokenUrl = new URL(`${GRAPH}/oauth/access_token`);
    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error("IG token exchange failed:", tokenData);
      return NextResponse.redirect(`${appUrl}/dashboard?error=token_failed`);
    }

    // 2. Exchange short-lived token for a long-lived token (~60 days)
    const longUrl = new URL(`${GRAPH}/oauth/access_token`);
    longUrl.searchParams.set("grant_type", "fb_exchange_token");
    longUrl.searchParams.set("client_id", appId);
    longUrl.searchParams.set("client_secret", appSecret);
    longUrl.searchParams.set("fb_exchange_token", tokenData.access_token);

    const longRes = await fetch(longUrl.toString());
    const longData = await longRes.json();
    const accessToken: string = longData.access_token || tokenData.access_token;
    const expiresIn: number | undefined = longData.expires_in;

    // 3. Find the Facebook Page(s) the user manages
    const pagesRes = await fetch(
      `${GRAPH}/me/accounts?fields=id,name,instagram_business_account&access_token=${accessToken}`
    );
    const pagesData = await pagesRes.json();
    const pages: Array<{
      id: string;
      name: string;
      instagram_business_account?: { id: string };
    }> = pagesData.data ?? [];

    // 4. Pick the first Page that has an Instagram Business account linked
    const pageWithIg = pages.find((p) => p.instagram_business_account?.id);
    if (!pageWithIg?.instagram_business_account) {
      console.error("No linked Instagram Business account found:", pagesData);
      return NextResponse.redirect(`${appUrl}/dashboard?error=no_instagram_account`);
    }

    const igUserId = pageWithIg.instagram_business_account.id;

    // Get the IG account username for display
    const igInfoRes = await fetch(
      `${GRAPH}/${igUserId}?fields=username&access_token=${accessToken}`
    );
    const igInfo = await igInfoRes.json();
    const accountName = igInfo.username ? `@${igInfo.username}` : "Instagram Account";

    // 5. Persist the token so future publishes can skip re-auth
    await supabase.from("social_accounts").upsert(
      {
        user_id: state.userId,
        platform: "instagram",
        access_token: accessToken,
        refresh_token: null,
        expires_at: expiresIn
          ? new Date(Date.now() + expiresIn * 1000).toISOString()
          : null,
        account_name: accountName,
      },
      { onConflict: "user_id,platform" }
    );

    // 6. Create a Reels media container pointing at the public video URL
    const caption = `${state.topic}\n\n#reels #ai`;
    const createUrl = new URL(`${GRAPH}/${igUserId}/media`);
    createUrl.searchParams.set("media_type", "REELS");
    createUrl.searchParams.set("video_url", state.videoUrl);
    createUrl.searchParams.set("caption", caption);
    createUrl.searchParams.set("access_token", accessToken);

    const createRes = await fetch(createUrl.toString(), { method: "POST" });
    const createData = await createRes.json();
    if (!createData.id) {
      console.error("IG container creation failed:", createData);
      return NextResponse.redirect(`${appUrl}/dashboard?error=upload_failed`);
    }
    const containerId = createData.id;

    // 7. Poll until Instagram finishes processing the video
    const ready = await waitForContainer(containerId, accessToken);
    if (!ready) {
      return NextResponse.redirect(`${appUrl}/dashboard?error=processing_timeout`);
    }

    // 8. Publish the processed container
    const publishUrl = new URL(`${GRAPH}/${igUserId}/media_publish`);
    publishUrl.searchParams.set("creation_id", containerId);
    publishUrl.searchParams.set("access_token", accessToken);

    const publishRes = await fetch(publishUrl.toString(), { method: "POST" });
    const publishData = await publishRes.json();
    if (!publishData.id) {
      console.error("IG publish failed:", publishData);
      return NextResponse.redirect(`${appUrl}/dashboard?error=publish_failed`);
    }

    return NextResponse.redirect(
      `${appUrl}/dashboard?success=instagram&mediaId=${publishData.id}`
    );
  } catch (err) {
    console.error("Instagram publish exception:", err);
    return NextResponse.redirect(`${appUrl}/dashboard?error=upload_exception`);
  }
}

// Reels are processed asynchronously. Poll the container's status_code until
// it reports FINISHED (or fail fast on ERROR / timeout).
async function waitForContainer(
  containerId: string,
  accessToken: string,
  maxAttempts = 30,
  delayMs = 4000
): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await fetch(
      `${GRAPH}/${containerId}?fields=status_code,status&access_token=${accessToken}`
    );
    const data = await res.json();
    if (data.status_code === "FINISHED") return true;
    if (data.status_code === "ERROR" || data.status_code === "EXPIRED") {
      console.error("IG container processing failed:", data);
      return false;
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}
