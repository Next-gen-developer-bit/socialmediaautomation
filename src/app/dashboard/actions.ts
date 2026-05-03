"use server";

import { supabase } from "@/lib/supabase";

export async function submitIdea(formData: FormData) {
  const topic = formData.get("topic") as string;
  const targetPlatform = formData.get("targetPlatform") as string;
  const tone = formData.get("tone") as string | null;
  const targetAudience = formData.get("targetAudience") as string | null;
  const userId = formData.get("userId") as string | null;
  const userEmail = formData.get("userEmail") as string | null;

  if (!topic || !targetPlatform) {
    return { error: "Topic and Target Platform are required." };
  }

  const { error } = await supabase
    .from("submissions")
    .insert([{
      topic,
      target_platform: targetPlatform,
      tone: tone || null,
      target_audience: targetAudience || null,
    }]);

  if (error) {
    console.error("Supabase insert error:", error);
    return { error: error.message };
  }

  // Trigger n8n webhook (POST method)
  try {
    const webhookUrl = "https://babbudev123321.app.n8n.cloud/webhook/a1fb8388-2139-4df1-8bb5-59cb846fe691";
    
    const webhookRes = await fetch(webhookUrl, {
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
      }),
    });
    
    if (!webhookRes.ok) {
      const errorText = await webhookRes.text().catch(() => "");
      console.error("Webhook responded with non-ok status:", webhookRes.status, errorText);
      return { error: `Webhook error ${webhookRes.status}: ${errorText}` };
    }
  } catch (webhookError: any) {
    console.error("Webhook trigger error:", webhookError);
    return { error: `Webhook fetch failed: ${webhookError.message}` };
  }

  return { success: true };
}
