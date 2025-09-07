import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { createClient, User } from "@supabase/supabase-js";
import { UserMetadata } from "../types";

const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

const defaultConfig = {
  addition: {
    enabled: true,
    range1: { min: 2, max: 100 },
    range2: { min: 2, max: 100 },
  },
  subtraction: {
    enabled: true,
    range1: { min: 2, max: 100 },
    range2: { min: 2, max: 100 },
  },
  multiplication: {
    enabled: true,
    range1: { min: 2, max: 12 },
    range2: { min: 2, max: 100 },
  },
  division: {
    enabled: true,
    range1: { min: 2, max: 12 },
    range2: { min: 2, max: 100 },
  },
  duration: 120,
};

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
      }
    );
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    const supabase = createSupabaseClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });

    if (error) {
      console.error("Sign in error:", error);
    }
  };

  const signOut = async () => {
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    setUser(null);
  };

  const startGame = () => {
    const params = new URLSearchParams({
      addEnabled: defaultConfig.addition.enabled ? "1" : "0",
      addMin1: defaultConfig.addition.range1.min.toString(),
      addMax1: defaultConfig.addition.range1.max.toString(),
      addMin2: defaultConfig.addition.range2?.min.toString() || "",
      addMax2: defaultConfig.addition.range2?.max.toString() || "",
      subEnabled: defaultConfig.subtraction.enabled ? "1" : "0",
      subMin: defaultConfig.subtraction.range1.min.toString(),
      subMax: defaultConfig.subtraction.range1.max.toString(),
      subMin2: defaultConfig.subtraction.range2?.min.toString() || "",
      subMax2: defaultConfig.subtraction.range2?.max.toString() || "",
      mulEnabled: defaultConfig.multiplication.enabled ? "1" : "0",
      mulMin1: defaultConfig.multiplication.range1.min.toString(),
      mulMax1: defaultConfig.multiplication.range1.max.toString(),
      mulMin2: defaultConfig.multiplication.range2?.min.toString() || "",
      mulMax2: defaultConfig.multiplication.range2?.max.toString() || "",
      divEnabled: defaultConfig.division.enabled ? "1" : "0",
      divMin: defaultConfig.division.range1.min.toString(),
      divMax: defaultConfig.division.range1.max.toString(),
      divMin2: defaultConfig.division.range2?.min.toString() || "",
      divMax2: defaultConfig.division.range2?.max.toString() || "",
      duration: defaultConfig.duration.toString(),
    });
    router.push(`/game?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white relative overflow-hidden">
      <div className="absolute top-6 right-6 z-20">
        {user ? (
          <div className="flex items-center space-x-2 bg-slate-800 rounded-lg p-2 hover:bg-slate-700 transition-colors">
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Profile"
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <button
              onClick={signOut}
              className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-400/10 transition-colors"
              title="Sign out"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={signInWithGoogle}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 hover:from-blue-600 hover:via-purple-600 hover:to-cyan-600 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-3 border border-slate-600/50 hover:border-slate-500/50 backdrop-blur-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent font-bold">
              Sign in
            </span>
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-6 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero section */}
          <div className="text-center mb-16">
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-bounce-in">
              DataMac
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto animate-slide-in-up" style={{ animationDelay: "0.3s" }}>
              Speed, precision, and intelligence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
           
              <button
                onClick={() => router.push("/leaderboard")}
                className="px-7 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold text-lg transition-all duration-200 border border-slate-600 hover:border-slate-500 animate-zoom-in hover-pulse-glow"
                style={{ animationDelay: "0.8s" }}
              >
                <span className="flex items-center gap-2">
                  <span className="animate-sparkle">🏆</span>
                   Leaderboard
                </span>
              </button>
              {user && (
                <button
                  onClick={() => router.push("/dashboard")}
                  className="px-8 py-4 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold text-lg transition-all duration-200 border border-slate-500 hover:border-slate-400 flex items-center justify-center gap-2 animate-zoom-in hover-float"
                  style={{ animationDelay: "1s" }}
                >
                  <svg className="w-5 h-5 animate-rotate-in" style={{ animationDelay: "1.2s" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Dashboard
                </button>
              )}
            </div>
          </div>

          {/* Features grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 hover:border-blue-500/50 transition-all duration-200 animate-slide-in-left hover-bounce group" style={{ animationDelay: "0.2s" }}>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:animate-morph">
                <span className="text-2xl animate-pulse">➕</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:animate-shake">Addition</h3>
              <p className="text-slate-400 text-sm">Master basic arithmetic with timed challenges</p>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 hover:border-red-500/50 transition-all duration-200 animate-slide-in-up hover-bounce group" style={{ animationDelay: "0.4s" }}>
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:animate-morph">
                <span className="text-2xl animate-pulse">➖</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:animate-shake">Subtraction</h3>
              <p className="text-slate-400 text-sm">Build confidence with subtraction problems</p>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 hover:border-green-500/50 transition-all duration-200 animate-slide-in-down hover-bounce group" style={{ animationDelay: "0.6s" }}>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:animate-morph">
                <span className="text-2xl animate-pulse">✖️</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:animate-shake">Multiplication</h3>
              <p className="text-slate-400 text-sm">Speed up your multiplication skills</p>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 hover:border-purple-500/50 transition-all duration-200 animate-slide-in-right hover-bounce group" style={{ animationDelay: "0.8s" }}>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:animate-morph">
                <span className="text-2xl animate-pulse">➗</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:animate-shake">Division</h3>
              <p className="text-slate-400 text-sm">Tackle complex division challenges</p>
            </div>
          </div>

          {/* Stats section */}
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 animate-scale-in" style={{ animationDelay: "1.2s" }}>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="animate-zoom-in hover-pulse-glow" style={{ animationDelay: "1.4s" }}>
                <div className="text-3xl font-bold text-blue-400 mb-2 animate-pulse">2 min</div>
                <div className="text-slate-400">Session Duration</div>
              </div>
              <div className="animate-zoom-in hover-pulse-glow" style={{ animationDelay: "1.6s" }}>
                <div className="text-3xl font-bold text-purple-400 mb-2 animate-pulse">Voice</div>
                <div className="text-slate-400">Recognition</div>
              </div>
              <div className="animate-zoom-in hover-pulse-glow" style={{ animationDelay: "1.8s" }}>
                <div className="text-3xl font-bold text-cyan-400 mb-2 animate-pulse">Real-time</div>
                <div className="text-slate-400">Progress Tracking</div>
              </div>
            </div>
          </div>

          {/* Start Game Button */}
          <div className="text-center mt-8">
            <button
              onClick={startGame}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl animate-zoom-in hover-bounce"
              style={{ animationDelay: "2s" }}
            >
              <span className="flex items-center gap-2">
                <span className="animate-pulse">🎮</span>
                Start Game
              </span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
