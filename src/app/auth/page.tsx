"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, AlertCircle, Mail, Lock, User } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AuthPage() {
  const router = useRouter();
  const [view, setView] = useState<"signin" | "signup" | "forgot_password">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (view === "signup") {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        });
        if (signUpError) throw signUpError;
        
        // Manually push to public.users just in case database triggers aren't firing
        if (signUpData?.user) {
          await supabase.from('users').upsert({
            id: signUpData.user.id,
            full_name: fullName,
            email: email,
          });
        }
        
        // After successful sign up, automatically log them in or redirect
        router.push("/dashboard");
      } else if (view === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        
        router.push("/dashboard");
      } else if (view === "forgot_password") {
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to reset password.");
        }
        
        // Sign in immediately after password reset
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black font-sans text-slate-900 dark:text-slate-100 selection:bg-purple-200">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tighter hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            SocialFlow AI
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="pt-32 pb-20 px-6 flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-purple-500/5">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold tracking-tight mb-2">
                {view === "signup" 
                  ? "Create an account" 
                  : view === "forgot_password" 
                  ? "Reset Password" 
                  : "Welcome back"}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                {view === "signup"
                  ? "Sign up to start automating your social media."
                  : view === "forgot_password"
                  ? "Set a new password directly below."
                  : "Sign in to access your SocialFlow dashboard."}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/30 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                <p className="text-sm mt-0.5">{error}</p>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-5">
              {view === "signup" && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-200">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required={view === "signup"}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all dark:placeholder-slate-600"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-200">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all dark:placeholder-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-200">
                  {view === "forgot_password" ? "New Password" : "Password"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all dark:placeholder-slate-600"
                  />
                </div>
              </div>

              <div className="pt-2">
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
                      {view === "signup" ? "Creating account..." : view === "forgot_password" ? "Resetting..." : "Signing in..."}
                    </span>
                  ) : (
                    <>{view === "signup" ? "Create Account" : view === "forgot_password" ? "Reset Password" : "Sign In"}</>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center space-y-3">
              {view !== "forgot_password" && (
                <>
                  <p className="text-slate-600 dark:text-slate-400">
                    {view === "signup" ? "Already have an account?" : "Don't have an account yet?"}{" "}
                    <button
                      type="button"
                      onClick={() => setView(view === "signup" ? "signin" : "signup")}
                      className="text-purple-600 dark:text-purple-400 font-semibold hover:underline"
                    >
                      {view === "signup" ? "Sign In" : "Sign Up"}
                    </button>
                  </p>
                  {view === "signin" && (
                    <button
                      type="button"
                      onClick={() => setView("forgot_password")}
                      className="text-sm text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    >
                      Forgot your password?
                    </button>
                  )}
                </>
              )}

              {view === "forgot_password" && (
                <button
                  type="button"
                  onClick={() => setView("signin")}
                  className="text-sm text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 rounded-md"
                >
                  Back to Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
