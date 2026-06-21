import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const topic = request.nextUrl.searchParams.get("topic");

  if (!topic) {
    return NextResponse.json({ error: "Missing topic parameter" }, { status: 400 });
  }

  // Find the most recent submission with this topic that has a video_url
  // n8n creates its own row with the video_url, so we look for that row
  const { data, error } = await supabase
    .from("submissions")
    .select("id, status, video_url")
    .eq("topic", topic)
    .not("video_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    // No matching row with video_url found yet — still processing
    return NextResponse.json({ status: "processing", video_url: null });
  }

  return NextResponse.json({
    id: data.id,
    status: data.status,
    video_url: data.video_url,
  });
}
