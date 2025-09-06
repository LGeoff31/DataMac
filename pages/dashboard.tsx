import React, { useEffect, useState } from "react";
import { createClient, User } from "@supabase/supabase-js";
import { useRouter } from "next/router";

const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

const LineChart = ({ data }: { data: { date: string; score: number }[] }) => {
  if (data.length === 0) return null;

  const maxScore = Math.max(...data.map((d) => d.score));
  const minScore = Math.min(...data.map((d) => d.score));
  const scoreRange = maxScore - minScore || 1;

  const chartWidth = Math.max(600, data.length * 80);
  const chartHeight = 300;
  const padding = 60;
  const graphWidth = chartWidth - padding * 2;
  const graphHeight = chartHeight - padding * 2;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-6 mb-8">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Score Progress</h3>
      <div className="relative h-80 overflow-x-auto">
        <svg
          className="w-full h-full min-w-full"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          style={{ minWidth: `${chartWidth}px` }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={i}
              x1={padding}
              y1={padding + (i * graphHeight) / 4}
              x2={chartWidth - padding}
              y2={padding + (i * graphHeight) / 4}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}

          {[0, 1, 2, 3, 4].map((i) => {
            const scoreValue = minScore + (scoreRange * i) / 4;
            return (
              <g key={i}>
                <line
                  x1={padding}
                  y1={padding + (i * graphHeight) / 4}
                  x2={padding - 5}
                  y2={padding + (i * graphHeight) / 4}
                  stroke="#9ca3af"
                  strokeWidth="1"
                />
                <text
                  x={padding - 10}
                  y={padding + (i * graphHeight) / 4 + 4}
                  textAnchor="end"
                  className="text-xs fill-gray-600"
                >
                  {Math.round(scoreValue)}
                </text>
              </g>
            );
          })}

          <line
            x1={padding}
            y1={chartHeight - padding}
            x2={chartWidth - padding}
            y2={chartHeight - padding}
            stroke="#9ca3af"
            strokeWidth="2"
          />

          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={chartHeight - padding}
            stroke="#9ca3af"
            strokeWidth="2"
          />

          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={data
              .map((d, i) => {
                const x = padding + (i * graphWidth) / (data.length - 1);
                const y =
                  padding +
                  graphHeight -
                  ((d.score - minScore) / scoreRange) * graphHeight;
                return `${x},${y}`;
              })
              .join(" ")}
          />

          {data.map((d, i) => {
            const x = padding + (i * graphWidth) / (data.length - 1);
            const y =
              padding +
              graphHeight -
              ((d.score - minScore) / scoreRange) * graphHeight;
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth="2"
                />
                <text
                  x={x}
                  y={y - 10}
                  textAnchor="middle"
                  className="text-xs fill-gray-700 font-medium"
                >
                  {d.score}
                </text>
              </g>
            );
          })}

          {data.map((d, i) => {
            const x = padding + (i * graphWidth) / (data.length - 1);
            return (
              <g key={i}>
                <line
                  x1={x}
                  y1={chartHeight - padding}
                  x2={x}
                  y2={chartHeight - padding + 5}
                  stroke="#9ca3af"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={chartHeight - padding + 20}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                  transform={`rotate(-45 ${x} ${chartHeight - padding + 20})`}
                >
                  {d.date}
                </text>
              </g>
            );
          })}

          <text
            x={chartWidth / 2}
            y={chartHeight - 10}
            textAnchor="middle"
            className="text-sm fill-gray-700 font-medium"
          >
            Date
          </text>
          <text
            x={10}
            y={chartHeight / 2}
            textAnchor="middle"
            className="text-sm fill-gray-700 font-medium"
            transform={`rotate(-90 10 ${chartHeight / 2})`}
          >
            Score
          </text>
        </svg>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (!user) {
        router.push("/");
        return;
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          router.push("/");
        }
      }
    );
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    const fetchScores = async () => {
      if (!user) return;

      const supabase = createSupabaseClient();
      try {
        const { data, error } = await supabase
          .from("scores")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Error fetching scores:", error);
        } else {
          setScores(data || []);
        }
      } catch (error) {
        console.error("Error fetching scores:", error);
      }
    };

    if (user) {
      fetchScores();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const averageScore =
    scores.length > 0
      ? scores.reduce((sum, score) => sum + score.value, 0) / scores.length
      : 0;

  const chartData = scores.map((score) => ({
    date: new Date(score.created_at).toLocaleDateString(),
    score: score.value,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 min-h-screen p-4">
        <div className="flex justify-center items-center mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-3 hover:bg-white/90 transition-all duration-200"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-6 mb-8">
          <div className="flex items-center gap-4">
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Profile"
                className="w-16 h-16 rounded-full ring-4 ring-blue-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center ring-4 ring-blue-200">
                <span className="text-white font-bold text-2xl">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {user.user_metadata?.full_name ||
                  user.user_metadata?.name ||
                  user.email?.split("@")[0]}
              </h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Games</p>
                <p className="text-3xl font-bold text-gray-800">
                  {scores.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🎮</span>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Average Score
                </p>
                <p className="text-3xl font-bold text-gray-800">
                  {averageScore.toFixed(0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Best Score</p>
                <p className="text-3xl font-bold text-gray-800">
                  {scores.length > 0
                    ? Math.max(...scores.map((s) => s.value))
                    : 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🏆</span>
              </div>
            </div>
          </div>
        </div>

        {scores.length > 0 && <LineChart data={chartData} />}

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">All Games</h3>
          {scores.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-gray-600 text-lg">No games played yet</p>
              <button
                onClick={() => router.push("/")}
                className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Play Your First Game
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {scores.map((score, index) => (
                <div
                  key={score.id || index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">
                        #{index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        Score: {score.value}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(score.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-800">
                      {score.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
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
        .animate-blob {
          animation: blob 7s infinite;
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
};

export default Dashboard;
