import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const stateParam = request.nextUrl.searchParams.get("state");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (!code || !stateParam) {
    return NextResponse.redirect(`${appUrl}/dashboard?error=oauth_failed`);
  }

  // Decode state — contains userId, videoUrl, topic
  let state: { userId: string; videoUrl: string; topic: string };
  try {
    state = JSON.parse(Buffer.from(stateParam, "base64url").toString());
  } catch {
    return NextResponse.redirect(`${appUrl}/dashboard?error=invalid_state`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = `${appUrl}/api/auth/youtube/callback`;

  // Exchange authorization code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokens = await tokenRes.json();

  if (!tokens.access_token) {
    console.error("Token exchange failed:", tokens);
    return NextResponse.redirect(`${appUrl}/dashboard?error=token_failed`);
  }

  // Get YouTube channel info
  const channelRes = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    { headers: { Authorization: `Bearer ${tokens.access_token}` } }
  );
  const channelData = await channelRes.json();
  const channelName = channelData.items?.[0]?.snippet?.title ?? "YouTube Account";

  // Store tokens in Supabase social_accounts table
  await supabase.from("social_accounts").upsert(
    {
      user_id: state.userId,
      platform: "youtube",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      expires_at: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
      account_name: channelName,
    },
    { onConflict: "user_id,platform" }
  );

  // Upload the video directly here (avoids internal fetch issues)
  try {
    const videoRes = await fetch(state.videoUrl);
    if (!videoRes.ok) throw new Error("Failed to fetch video");
    const videoBuffer = await videoRes.arrayBuffer();
    const videoSize = videoBuffer.byteLength;

    // Initialize resumable upload session
    const initRes = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          "Content-Type": "application/json",
          "X-Upload-Content-Type": "video/mp4",
          "X-Upload-Content-Length": videoSize.toString(),
        },
        body: JSON.stringify({
          snippet: {
            title: state.topic,
            description: `AI-generated video about: ${state.topic}`,
            tags: [state.topic, "AI", "shorts"],
            categoryId: "22",
          },
          status: {
            privacyStatus: "private",
            selfDeclaredMadeForKids: false,
          },
        }),
      }
    );

    if (!initRes.ok) {
      const err = await initRes.json();
      console.error("YouTube init upload error:", err);
      return NextResponse.redirect(`${appUrl}/dashboard?error=upload_failed`);
    }

    const uploadSessionUrl = initRes.headers.get("Location");
    if (!uploadSessionUrl) {
      return NextResponse.redirect(`${appUrl}/dashboard?error=no_session_url`);
    }

    // Upload the video bytes
    const uploadRes = await fetch(uploadSessionUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": videoSize.toString(),
      },
      body: videoBuffer,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json();
      console.error("YouTube upload error:", err);
      return NextResponse.redirect(`${appUrl}/dashboard?error=upload_failed`);
    }

    const uploadData = await uploadRes.json();
    return NextResponse.redirect(
      `${appUrl}/dashboard?success=youtube&videoId=${uploadData.id}`
    );
  } catch (err) {
    console.error("Upload exception:", err);
    return NextResponse.redirect(`${appUrl}/dashboard?error=upload_exception`);
  }
}
