import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const { topic } = await request.json();

  if (!topic) {
    return NextResponse.json({ error: "Missing topic" }, { status: 400 });
  }

  // Update the submission status to "published"
  const { data, error } = await supabase
    .from("submissions")
    .update({ status: "published" })
    .eq("topic", topic)
    .not("video_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .select()
    .single();

  if (error) {
    console.error("Publish error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data.id });
}
