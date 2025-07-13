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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 min-h-screen p-4">
        <div className="absolute top-4 right-4 z-20">
          {user ? (
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-3">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Profile"
                  className="w-8 h-8 rounded-full ring-2 ring-blue-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center ring-2 ring-blue-200">
                  <span className="text-white font-bold text-sm">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-sm font-medium text-gray-800">
                {user.user_metadata?.full_name ||
                  user.user_metadata?.name ||
                  user.email?.split("@")[0]}
              </span>
              <button
                onClick={signOut}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-medium transition-all duration-200 transform hover:scale-105"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in
            </button>
          )}
        </div>

        <div className="flex items-center justify-center min-h-screen">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-12 animate-fade-in">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 animate-slide-down">
                DataMac
              </h1>
              <p className="text-xl text-gray-600 animate-slide-up">
                Master your math skills with speed and precision
              </p>
            </div>

            <div className="text-center mb-8 animate-fade-in animation-delay-450">
              <button
                onClick={() => router.push("/leaderboard")}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2 mx-auto"
              >
                <span className="text-xl">🏆</span>
                View Leaderboard
              </button>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 mb-8 animate-fade-in animation-delay-600">
              <h3 className="text-2xl font-bold text-center mb-6 text-gray-800">
                Game Settings
              </h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl p-4 transform hover:scale-105 transition-all duration-200">
                  <div className="text-2xl mb-2">➕</div>
                  <div className="font-semibold text-blue-800">Addition</div>
                  <div className="text-sm text-blue-600">Numbers 2-100</div>
                </div>
                <div className="bg-gradient-to-br from-red-100 to-red-200 rounded-xl p-4 transform hover:scale-105 transition-all duration-200">
                  <div className="text-2xl mb-2">➖</div>
                  <div className="font-semibold text-red-800">Subtraction</div>
                  <div className="text-sm text-red-600">Numbers 2-100</div>
                </div>
                <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl p-4 transform hover:scale-105 transition-all duration-200">
                  <div className="text-2xl mb-2">✖️</div>
                  <div className="font-semibold text-green-800">
                    Multiplication
                  </div>
                  <div className="text-sm text-green-600">2-12 × 2-100</div>
                </div>
                <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl p-4 transform hover:scale-105 transition-all duration-200">
                  <div className="text-2xl mb-2">➗</div>
                  <div className="font-semibold text-purple-800">Division</div>
                  <div className="text-sm text-purple-600">2-12 ÷ 2-100</div>
                </div>
              </div>
              <div className="text-center mt-6">
                <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg">
                  <span className="text-lg">⏱️</span>
                  <span className="font-semibold">Duration: 2 minutes</span>
                </div>
              </div>
            </div>

            <div className="text-center animate-fade-in animation-delay-900">
              <button
                onClick={startGame}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-12 rounded-2xl font-bold text-xl transition-all duration-300 transform hover:scale-110 shadow-2xl hover:shadow-3xl"
              >
                🚀 Start Game
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        .animate-slide-down {
          animation: slide-down 0.8s ease-out forwards;
        }
        .animate-slide-up {
          animation: slide-up 0.8s ease-out forwards;
        }
        .animation-delay-300 {
          animation-delay: 0.3s;
        }
        .animation-delay-450 {
          animation-delay: 0.45s;
        }
        .animation-delay-600 {
          animation-delay: 0.6s;
        }
        .animation-delay-900 {
          animation-delay: 0.9s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
