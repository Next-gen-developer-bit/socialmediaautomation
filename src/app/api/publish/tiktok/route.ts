import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { videoUrl, topic, userId } = await request.json();

  if (!videoUrl || !topic) {
    return NextResponse.json({ error: "Missing videoUrl or topic" }, { status: 400 });
  }

  const webhookUrl = process.env.TIKTOK_N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json({ error: "TikTok webhook not configured" }, { status: 500 });
  }

  // Send video URL and metadata to n8n — n8n handles TikTok OAuth and upload
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ videoUrl, topic, userId }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("n8n TikTok webhook error:", text);
    return NextResponse.json({ error: "n8n webhook failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Sent to n8n for TikTok upload" });
}
