"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Sparkles, CheckCircle, AlertCircle, X } from "lucide-react";
import { submitIdea } from "./actions";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// YouTube Icon
function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

// TikTok Icon
function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.97a8.24 8.24 0 0 0 4.82 1.55V7.07a4.85 4.85 0 0 1-1.05-.38z"/>
    </svg>
  );
}

// Instagram Icon
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

type PublishState = "idle" | "selecting" | "uploading" | "done" | "error";

function DashboardInner() {
  const searchParams = useSearchParams();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [submittedTopic, setSubmittedTopic] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [publishState, setPublishState] = useState<PublishState>("idle");
  const [publishMessage, setPublishMessage] = useState("");
  const [showPlatformModal, setShowPlatformModal] = useState(false);

  // Mark as mounted (client-only) to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Restore video state from sessionStorage after OAuth redirect
  useEffect(() => {
    if (!mounted) return;

    const savedVideoUrl = sessionStorage.getItem("pendingVideoUrl");
    const savedTopic = sessionStorage.getItem("pendingTopic");
    if (savedVideoUrl && savedTopic) {
      setVideoUrl(savedVideoUrl);
      setSubmittedTopic(savedTopic);
    }

    // Handle OAuth success/error redirects from YouTube
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "youtube") {
      const videoId = searchParams.get("videoId");
      setPublishState("done");
      setPublishMessage(`✅ Uploaded to YouTube! Video ID: ${videoId}. It's set to private — check YouTube Studio.`);
      sessionStorage.removeItem("pendingVideoUrl");
      sessionStorage.removeItem("pendingTopic");
    } else if (success === "instagram") {
      const mediaId = searchParams.get("mediaId");
      setPublishState("done");
      setPublishMessage(`✅ Published to Instagram! Media ID: ${mediaId}. Check your Instagram profile.`);
      sessionStorage.removeItem("pendingVideoUrl");
      sessionStorage.removeItem("pendingTopic");
    } else if (error) {
      setPublishState("error");
      setPublishMessage(`❌ Upload failed: ${error.replace(/_/g, " ")}`);
    }
  }, [mounted, searchParams]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email ?? null);
      }
    });
  }, []);

  // Poll server-side API for video_url by topic when a submission is processing
  useEffect(() => {
    if (!submittedTopic || videoUrl) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/submission-status?topic=${encodeURIComponent(submittedTopic)}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data && data.video_url) {
          setVideoUrl(data.video_url);
          setIsProcessing(false);
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [submittedTopic, videoUrl]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorInfo("");
    setPublishState("idle");
    setPublishMessage("");

    const formData = new FormData(e.currentTarget);
    const topic = formData.get("topic") as string;
    if (userId) formData.append("userId", userId);
    if (userEmail) formData.append("userEmail", userEmail);

    const result = await submitIdea(formData);

    if (result.error) {
      setErrorInfo(result.error);
      setLoading(false);
    } else {
      setSubmittedTopic(topic);
      setIsProcessing(true);
      (e.target as HTMLFormElement).reset();
      setLoading(false);
    }
  }

  async function handleYouTubePublish() {
    if (!videoUrl || !userId || !submittedTopic) return;
    // Save state to sessionStorage so it survives the OAuth redirect
    sessionStorage.setItem("pendingVideoUrl", videoUrl);
    sessionStorage.setItem("pendingTopic", submittedTopic);
    setShowPlatformModal(false);
    // Redirect to YouTube OAuth
    window.location.href = `/api/auth/youtube?userId=${encodeURIComponent(userId)}&videoUrl=${encodeURIComponent(videoUrl)}&topic=${encodeURIComponent(submittedTopic)}`;
  }

  async function handleInstagramPublish() {
    if (!videoUrl || !userId || !submittedTopic) return;
    // Save state to sessionStorage so it survives the OAuth redirect
    sessionStorage.setItem("pendingVideoUrl", videoUrl);
    sessionStorage.setItem("pendingTopic", submittedTopic);
    setShowPlatformModal(false);
    // Redirect to Instagram (Facebook Login) OAuth
    window.location.href = `/api/auth/instagram?userId=${encodeURIComponent(userId)}&videoUrl=${encodeURIComponent(videoUrl)}&topic=${encodeURIComponent(submittedTopic)}`;
  }

  function handleReset() {
    setVideoUrl(null);
    setSubmittedTopic(null);
    setIsProcessing(false);
    setPublishState("idle");
    setPublishMessage("");
    setShowPlatformModal(false);
    sessionStorage.removeItem("pendingVideoUrl");
    sessionStorage.removeItem("pendingTopic");
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black font-sans text-slate-900 dark:text-slate-100 selection:bg-purple-200">

      {/* Platform Selection Modal */}
      {showPlatformModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPlatformModal(false)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-8 w-full max-w-sm animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowPlatformModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Publish to Platform
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Select where you want to post your video
              </p>
            </div>

            <div className="space-y-3">
              {/* YouTube */}
              <button
                onClick={handleYouTubePublish}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                  <YouTubeIcon />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-slate-900 dark:text-white">YouTube Shorts</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Sign in with Google & upload</div>
                </div>
                <ArrowLeft className="w-4 h-4 ml-auto rotate-180 text-slate-400 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
              </button>

              {/* TikTok — coming soon */}
              <button
                disabled
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 opacity-50 cursor-not-allowed"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white">
                  <TikTokIcon />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-slate-900 dark:text-white">TikTok</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Coming soon</div>
                </div>
              </button>

              {/* Instagram */}
              <button
                onClick={handleInstagramPublish}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-950/50 flex items-center justify-center text-pink-600 group-hover:scale-110 transition-transform">
                  <InstagramIcon />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-slate-900 dark:text-white">Instagram Reels</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Sign in with Facebook & publish</div>
                </div>
                <ArrowLeft className="w-4 h-4 ml-auto rotate-180 text-slate-400 group-hover:text-pink-500 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            SocialFlow Dashboard
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Home
            </Link>
            <div className="flex items-center gap-4 border-l border-slate-200 dark:border-slate-800 pl-6">
              {userEmail && (
                <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  {userEmail}
                </span>
              )}
              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/";
                }}
                className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-xl mx-auto">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Create New Content</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Submit your idea and our AI engine will generate everything you need.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            {errorInfo && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/30 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Failed to submit idea</h3>
                  <p className="text-sm mt-1 opacity-90">{errorInfo}</p>
                </div>
              </div>
            )}

            {videoUrl ? (
              <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                {/* 9:16 Video Player */}
                <div className="mx-auto rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg bg-black relative" style={{ maxWidth: "340px", aspectRatio: "9/16" }}>
                  <video
                    src={videoUrl}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    playsInline
                    controls
                    controlsList="nodownload noplaybackrate"
                    disablePictureInPicture
                    onContextMenu={(e) => e.preventDefault()}
                  />
                </div>

                {/* Publish status message */}
                {publishMessage && (
                  <div className={`p-4 rounded-2xl text-sm font-medium border ${
                    publishState === "done"
                      ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/30"
                      : publishState === "error"
                      ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/30"
                      : "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/30"
                  }`}>
                    {publishMessage}
                  </div>
                )}

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowPlatformModal(true)}
                    disabled={publishState === "uploading"}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {publishState === "uploading" ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Publish
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/20 font-semibold transition-colors border border-red-500/20"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : isProcessing ? (
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-500">
                <div className="w-20 h-20 relative">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
                </div>
                <div className="space-y-2 max-w-sm mx-auto">
                  <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Generating Your Video</h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    Our AI is rendering the video based on your strategy. This process can take up to 10 minutes. Please keep this page open.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="topic" className="block text-sm font-medium text-slate-900 dark:text-slate-200">
                    Topic <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="topic"
                    name="topic"
                    required
                    placeholder="e.g. Top 5 Real Estate Marketing Tips"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all dark:placeholder-slate-600"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="targetPlatform" className="block text-sm font-medium text-slate-900 dark:text-slate-200">
                    Target Platform <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="targetPlatform"
                      name="targetPlatform"
                      required
                      defaultValue=""
                      className="appearance-none w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all cursor-pointer"
                    >
                      <option value="" disabled>Select a platform</option>
                      <option value="YouTube Shorts">YouTube Shorts</option>
                      <option value="TikTok">TikTok</option>
                      <option value="Instagram">Instagram</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                      <svg className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="tone" className="block text-sm font-medium text-slate-900 dark:text-slate-200 flex items-center justify-between">
                    <span>Tone</span>
                    <span className="text-xs text-slate-400 font-normal">Optional</span>
                  </label>
                  <input
                    id="tone"
                    name="tone"
                    placeholder="e.g. Professional, Humorous, Energetic"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all dark:placeholder-slate-600"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="targetAudience" className="block text-sm font-medium text-slate-900 dark:text-slate-200 flex items-center justify-between">
                    <span>Target Audience</span>
                    <span className="text-xs text-slate-400 font-normal">Optional</span>
                  </label>
                  <input
                    id="targetAudience"
                    name="targetAudience"
                    placeholder="e.g. First-time homebuyers, tech enthusiasts"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all dark:placeholder-slate-600"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full group flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      <>
                        Generate Content Strategy
                        <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black">
        <div className="w-10 h-10 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
      </div>
    }>
      <DashboardInner />
    </Suspense>
  );
}
