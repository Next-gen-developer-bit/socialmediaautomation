import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  const videoUrl = request.nextUrl.searchParams.get("videoUrl");
  const topic = request.nextUrl.searchParams.get("topic");

  if (!userId || !videoUrl || !topic) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const redirectUri = `${appUrl}/api/auth/youtube/callback`;

  // Store state so callback knows what to do after OAuth
  const state = Buffer.from(JSON.stringify({ userId, videoUrl, topic })).toString("base64url");

  const scope = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
  ].join(" ");

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl.toString());
}
