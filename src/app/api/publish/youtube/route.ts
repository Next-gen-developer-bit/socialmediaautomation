import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  const videoUrl = request.nextUrl.searchParams.get("videoUrl");
  const topic = request.nextUrl.searchParams.get("topic");
  const accessToken = request.nextUrl.searchParams.get("accessToken");

  if (!userId || !videoUrl || !topic || !accessToken) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  try {
    // Step 1: Fetch the video as a stream from the Shotstack S3 URL
    const videoRes = await fetch(videoUrl);
    if (!videoRes.ok) {
      return NextResponse.json({ error: "Failed to fetch video from URL" }, { status: 500 });
    }
    const videoBuffer = await videoRes.arrayBuffer();
    const videoSize = videoBuffer.byteLength;

    // Step 2: Initialize resumable upload session
    const initRes = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Upload-Content-Type": "video/mp4",
          "X-Upload-Content-Length": videoSize.toString(),
        },
        body: JSON.stringify({
          snippet: {
            title: topic,
            description: `AI-generated video about: ${topic}`,
            tags: [topic, "AI", "shorts"],
            categoryId: "22", // People & Blogs
          },
          status: {
            privacyStatus: "private", // Start as private, user can publish publicly from YT Studio
            selfDeclaredMadeForKids: false,
          },
        }),
      }
    );

    if (!initRes.ok) {
      const err = await initRes.json();
      console.error("YouTube init upload error:", err);
      return NextResponse.json({ error: "Failed to initialize upload", details: err }, { status: 500 });
    }

    const uploadSessionUrl = initRes.headers.get("Location");
    if (!uploadSessionUrl) {
      return NextResponse.json({ error: "No upload session URL returned" }, { status: 500 });
    }

    // Step 3: Upload the video bytes
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
      return NextResponse.json({ error: "Upload failed", details: err }, { status: 500 });
    }

    const uploadData = await uploadRes.json();
    return NextResponse.json({ success: true, videoId: uploadData.id });

  } catch (err) {
    console.error("YouTube upload exception:", err);
    return NextResponse.json({ error: "Upload exception" }, { status: 500 });
  }
}
