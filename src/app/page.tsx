"use client";

import Link from "next/link";
import { ArrowRight, BarChart, Sparkles, Video, PlaySquare, CheckCircle, UploadCloud, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const features = [
    {
      title: "Client Input (Topic + Platform)",
      description: "Provide the base concept and select your target platform. We'll handle the rest seamlessly.",
      icon: <FileText className="w-6 h-6 text-purple-600" />
    },
    {
      title: "Trend Discovery Engine",
      description: "Our AI researches the platform to align your topic with current viral trends and high-engagement formats.",
      icon: <BarChart className="w-6 h-6 text-indigo-600" />
    },
    {
      title: "AI Ideation Engine",
      description: "Generate complete scripts and production plans tailored for your audience.",
      icon: <Sparkles className="w-6 h-6 text-pink-600" />
    },
    {
      title: "AI Video & Audio Generation",
      description: "Turn scripts into high-quality videos and voiceovers using advanced AI models.",
      icon: <Video className="w-6 h-6 text-blue-600" />
    },
    {
      title: "Secure Preview Player",
      description: "Review generated content directly in our secure web player without needing any downloads.",
      icon: <PlaySquare className="w-6 h-6 text-teal-600" />
    },
    {
      title: "Approval Workflow",
      description: "Collaborate and manage feedback with our built-in robust approval workflow.",
      icon: <CheckCircle className="w-6 h-6 text-green-600" />
    },
    {
      title: "Auto Publishing Engine",
      description: "Publish seamlessly and directly to your target platforms once approved.",
      icon: <UploadCloud className="w-6 h-6 text-orange-600" />
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black font-sans text-slate-900 dark:text-slate-100 selection:bg-purple-200">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            SocialFlow AI
          </div>
          <Link
            href={isLoggedIn ? "/dashboard" : "/auth"}
            className="text-sm font-medium bg-slate-900 dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-full hover:scale-105 transition-transform"
          >
            {isLoggedIn ? "Dashboard" : "Sign In"}
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8 mt-12">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance">
            Automate Your Social Media With{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
              Intelligent AI
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            From idea to published video in minutes. Let our AI handle the research, creation, and distribution while you focus on the vision.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link
              href={isLoggedIn ? "/dashboard" : "/auth"}
              className="group flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all"
            >
              {isLoggedIn ? "Go to Dashboard" : "Get Started Free"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-white dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-balance">
              The Complete Content Pipeline
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              A comprehensive system designed to scale your social media presence without increasing your workload.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div 
                key={i} 
                className="group p-8 rounded-3xl bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 hover:border-purple-500/30 hover:shadow-xl hover:shadow-purple-500/10 transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 dark:border-slate-800 text-center text-slate-500">
        <p>© {new Date().getFullYear()} SocialFlow AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
