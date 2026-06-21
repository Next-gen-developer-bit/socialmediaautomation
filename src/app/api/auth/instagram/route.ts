import { NextRequest, NextResponse } from "next/server";

// Starts the Facebook/Instagram OAuth flow.
// Instagram content publishing uses Facebook Login: the user must have an
// Instagram Business/Creator account linked to a Facebook Page.
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  const videoUrl = request.nextUrl.searchParams.get("videoUrl");
  const topic = request.nextUrl.searchParams.get("topic");

  if (!userId || !videoUrl || !topic) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  const appId = process.env.FACEBOOK_APP_ID!;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const graphVersion = process.env.FACEBOOK_GRAPH_VERSION || "v24.0";
  const redirectUri = `${appUrl}/api/auth/instagram/callback`;

  // Carry context through the redirect so the callback can publish afterwards
  const state = Buffer.from(JSON.stringify({ userId, videoUrl, topic })).toString("base64url");

  // Permissions required to find the linked IG account and publish content
  const scope = [
    "instagram_basic",
    "instagram_content_publish",
    "pages_show_list",
    "pages_read_engagement",
    "business_management",
  ].join(",");

  const authUrl = new URL(`https://www.facebook.com/${graphVersion}/dialog/oauth`);
  authUrl.searchParams.set("client_id", appId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl.toString());
}
