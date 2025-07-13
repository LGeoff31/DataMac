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

export default function Leaderboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [leaderboard, setLeaderboard] = useState<
    {
      user_id: string;
      avg: number;
      highScore: number;
      avatar_url: string;
    }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    // Fetch leaderboard data
    const fetchLeaderboard = async () => {
      const { data, error } = await supabase.from("scores").select(`
        user_id, 
        value,
        avatar_url
      `);

      if (!data || error) {
        setIsLoading(false);
        return;
      }

      // Calculate averages
      const userScores: Record<
        string,
        {
          total: number;
          count: number;
          highScore: number;
          avatar_url: string;
        }
      > = {};

      for (const row of data) {
        if (!userScores[row.user_id]) {
          userScores[row.user_id] = {
            total: 0,
            count: 0,
            highScore: 0,
            avatar_url: row.avatar_url,
          };
        }
        userScores[row.user_id].total += row.value;
        userScores[row.user_id].count += 1;
        userScores[row.user_id].highScore = Math.max(
          userScores[row.user_id].highScore,
          row.value
        );
      }

      const leaderboardArr = Object.entries(userScores)
        .map(([user_id, { total, count, highScore, avatar_url }]) => ({
          user_id,
          avg: total / count,
          highScore,
          avatar_url,
        }))
        .sort((a, b) => b.highScore - a.highScore);

      setLeaderboard(leaderboardArr);
      setIsLoading(false);
    };

    fetchLeaderboard();

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);
  console.log("leaderboard", leaderboard);

  const signOut = async () => {
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    setUser(null);
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
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 animate-slide-down">
              🏆 Leaderboard
            </h1>
            <p className="text-xl text-gray-600 animate-slide-up">
              Top math masters ranked by highest score
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-6 mb-8 animate-fade-in animation-delay-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {user ? (
                  <>
                    {user.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt="Profile"
                        className="w-12 h-12 rounded-full ring-4 ring-blue-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center ring-4 ring-blue-200">
                        <span className="text-white font-bold text-lg">
                          {user.email?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-lg font-semibold text-gray-800">
                      {user.user_metadata?.full_name ||
                        user.user_metadata?.name ||
                        user.email?.split("@")[0]}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-600">Not signed in</span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push("/")}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  ← Back to Game
                </button>
                {user && (
                  <button
                    onClick={signOut}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Sign out
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 animate-fade-in animation-delay-600">
            {leaderboard.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  No scores yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Be the first to play and set a record!
                </p>
                <button
                  onClick={() => router.push("/")}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-8 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Start Playing
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
                    Top Performers
                  </h2>
                  <p className="text-center text-gray-600">
                    {leaderboard.length} player
                    {leaderboard.length !== 1 ? "s" : ""} • High scores
                  </p>
                </div>

                <div className="space-y-4">
                  {leaderboard.map((row, index) => (
                    <div
                      key={row.user_id}
                      className={`bg-gradient-to-r rounded-xl p-6 transform hover:scale-105 transition-all duration-300 animate-fade-in`}
                      style={{
                        animationDelay: `${(index + 1) * 0.1}s`,
                        background:
                          index === 0
                            ? "linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)"
                            : index === 1
                            ? "linear-gradient(135deg, #c0c0c0 0%, #e5e5e5 100%)"
                            : index === 2
                            ? "linear-gradient(135deg, #cd7f32 0%, #daa520 100%)"
                            : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center font-bold text-lg shadow-lg">
                              {index === 0
                                ? "🥇"
                                : index === 1
                                ? "🥈"
                                : index === 2
                                ? "🥉"
                                : `#${index + 1}`}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                {row.avatar_url ? (
                                  <img
                                    src={row.avatar_url}
                                    alt="Avatar"
                                    className="w-8 h-8 rounded-full object-cover border-2 border-blue-200"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">
                                      {row.user_id.slice(0, 2).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-gray-800">
                            {row.highScore.toFixed(0)}
                          </div>
                          <div className="text-sm text-gray-600">
                            high score
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 text-center">
                  <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-6 py-3 rounded-xl">
                    <span className="text-lg">📈</span>
                    <span className="font-semibold">
                      {leaderboard.length} total player
                      {leaderboard.length !== 1 ? "s" : ""} • Best high score:{" "}
                      {leaderboard[0]?.highScore.toFixed(0) || "0"}
                    </span>
                  </div>
                </div>
              </>
            )}
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
        .animation-delay-600 {
          animation-delay: 0.6s;
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
