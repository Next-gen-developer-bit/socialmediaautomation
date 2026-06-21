"use server";

import { supabase } from "@/lib/supabase";

export async function submitIdea(formData: FormData): Promise<{ error?: string; success?: boolean; submissionId?: string }> {
  const topic = formData.get("topic") as string;
  const targetPlatform = formData.get("targetPlatform") as string;
  const tone = formData.get("tone") as string | null;
  const targetAudience = formData.get("targetAudience") as string | null;
  const userId = formData.get("userId") as string | null;
  const userEmail = formData.get("userEmail") as string | null;

  if (!topic || !targetPlatform) {
    return { error: "Topic and Target Platform are required." };
  }

  const { data, error } = await supabase
    .from("submissions")
    .insert([{
      topic,
      target_platform: targetPlatform,
      tone: tone || null,
      target_audience: targetAudience || null,
      status: "processing",
    }])
    .select()
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    return { error: error.message };
  }

  const submissionId = data.id;

  // Trigger n8n webhook asynchronously (fire-and-forget to avoid 10 min timeout)
  const webhookUrl = "https://avital1.app.n8n.cloud/webhook/a1fb8388-2139-4df1-8bb5-59cb846fe691";

  fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic,
      targetPlatform,
      tone: tone || null,
      targetAudience: targetAudience || null,
      userEmail: userEmail || null,
      userId: userId || null,
      submissionId, // Pass ID to n8n so it can update the record later
    }),
  }).catch((webhookError) => {
    console.error("Webhook trigger connection error:", webhookError);
  });

  return { success: true, submissionId };
}
