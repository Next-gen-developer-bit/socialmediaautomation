"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, CheckCircle, AlertCircle } from "lucide-react";
import { submitIdea } from "./actions";
import { createClient } from "@supabase/supabase-js";

// Initialize a client just to grab the session data on the client side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorInfo, setErrorInfo] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Grab the current logged in user from local storage session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email ?? null);
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setErrorInfo("");

    const formData = new FormData(e.currentTarget);
    // Append the user info if we have it
    if (userId) formData.append("userId", userId);
    if (userEmail) formData.append("userEmail", userEmail);

    const result = await submitIdea(formData);

    if (result.error) {
      setErrorInfo(result.error);
    } else {
      setSuccess(true);
      (e.target as HTMLFormElement).reset();
    }
    
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black font-sans text-slate-900 dark:text-slate-100 selection:bg-purple-200">
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
            {success && (
              <div className="mb-6 p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/30 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Idea submitted successfully!</h3>
                  <p className="text-sm mt-1 opacity-90">Our AI is now working on analyzing trends and generating content drafts.</p>
                </div>
              </div>
            )}

            {errorInfo && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/30 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Failed to submit idea</h3>
                  <p className="text-sm mt-1 opacity-90">{errorInfo}</p>
                </div>
              </div>
            )}

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
                    className="appearance-none w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all cursor-pointer"
                  >
                    <option value="" disabled selected>Select a platform</option>
                    <option value="YouTube Shorts">YouTube Shorts</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook Reels">Facebook Reels</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
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
          </div>
        </div>
      </main>
    </div>
  );
}
