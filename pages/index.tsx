import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import OperationConfigSection from "../components/OperationConfigSection";
import { createClient, User } from "@supabase/supabase-js";
import {
  Range,
  OperationConfig,
  GameConfig,
  OperationKey,
  UserMetadata,
} from "../types";

// Create Supabase client function to ensure environment variables are loaded
const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

const defaultConfig: GameConfig = {
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

const operationSymbols: Record<string, string> = {
  addition: "+",
  subtraction: "−",
  multiplication: "×",
  division: "÷",
};

const operationNames: Record<string, string> = {
  addition: "Addition",
  subtraction: "Subtraction",
  multiplication: "Multiplication",
  division: "Division",
};

export default function Home() {
  const router = useRouter();
  const [config, setConfig] = useState<GameConfig>(defaultConfig);
  const [user, setUser] = useState<User | null>(null);
  const [leaderboard, setLeaderboard] = useState<
    { user_id: string; avg: number; user_metadata?: UserMetadata }[]
  >([]);

  useEffect(() => {
    const supabase = createSupabaseClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
    // Listen for login/logout
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    (async () => {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from("scores")
        .select("user_id, value");
      if (!data || error) return;
      const userScores: Record<string, { total: number; count: number }> = {};
      for (const row of data) {
        if (!userScores[row.user_id]) {
          userScores[row.user_id] = { total: 0, count: 0 };
        }
        userScores[row.user_id].total += row.value;
        userScores[row.user_id].count += 1;
      }

      // For now, we'll just use the user IDs since we can't easily access user metadata
      // In a real app, you might want to store user profiles in a separate table
      const leaderboardArr = Object.entries(userScores)
        .map(([user_id, { total, count }]) => ({
          user_id,
          avg: total / count,
          user_metadata: undefined, // We'll show initials instead
        }))
        .sort((a, b) => b.avg - a.avg);
      setLeaderboard(leaderboardArr);
    })();
  }, []);

  const signInWithGoogle = async () => {
    const supabase = createSupabaseClient();
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };

  const signOut = async () => {
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleCheckbox = (op: OperationKey) => {
    setConfig((prev) => ({
      ...prev,
      [op]: { ...prev[op], enabled: !prev[op].enabled },
    }));
  };

  const handleRange = (
    op: OperationKey,
    which: "range1" | "range2",
    field: "min" | "max",
    value: number
  ) => {
    setConfig((prev) => ({
      ...prev,
      [op]: {
        ...prev[op],
        [which]: {
          ...((prev[op] as OperationConfig)[which] || {}),
          [field]: value,
        },
      },
    }));
  };

  const handleDuration = (value: number) => {
    console.log("handleDuration", value);
    setConfig((prev) => ({ ...prev, duration: value }));
  };

  const startGame = () => {
    const supabase = createSupabaseClient();
    const params = new URLSearchParams({
      addEnabled: config.addition.enabled ? "1" : "0",
      addMin1: config.addition.range1.min.toString(),
      addMax1: config.addition.range1.max.toString(),
      addMin2: config.addition.range2?.min.toString() || "",
      addMax2: config.addition.range2?.max.toString() || "",
      subEnabled: config.subtraction.enabled ? "1" : "0",
      subMin: config.subtraction.range1.min.toString(),
      subMax: config.subtraction.range1.max.toString(),
      subMin2: config.subtraction.range2?.min.toString() || "",
      subMax2: config.subtraction.range2?.max.toString() || "",
      mulEnabled: config.multiplication.enabled ? "1" : "0",
      mulMin1: config.multiplication.range1.min.toString(),
      mulMax1: config.multiplication.range1.max.toString(),
      mulMin2: config.multiplication.range2?.min.toString() || "",
      mulMax2: config.multiplication.range2?.max.toString() || "",
      divEnabled: config.division.enabled ? "1" : "0",
      divMin: config.division.range1.min.toString(),
      divMax: config.division.range1.max.toString(),
      divMin2: config.division.range2?.min.toString() || "",
      divMax2: config.division.range2?.max.toString() || "",
      duration: config.duration.toString(),
    });
    router.push(`/game?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl flex gap-8">
        {/* Settings/Config Column */}
        <div className="flex-1 bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6 text-center">
            {user ? (
              <>
                <div className="mb-2 flex items-center justify-center gap-3">
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="Profile"
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-600 text-sm">
                        {user.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={signOut}
                  className="bg-red-500 text-white px-4 py-2 rounded"
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Sign in with Google
              </button>
            )}
          </div>
          <h1 className="text-3xl font-bold text-center mb-8">DataMac</h1>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              startGame();
            }}
          >
            <div className="space-y-6">
              <OperationConfigSection
                id="addition"
                label={operationNames.addition}
                symbol={operationSymbols.addition}
                config={config.addition}
                showRange2={true}
                onEnableChange={() => handleCheckbox("addition")}
                onRangeChange={(which, field, value) =>
                  handleRange("addition", which, field, value)
                }
              />
              <OperationConfigSection
                id="subtraction"
                label={operationNames.subtraction}
                symbol={operationSymbols.subtraction}
                config={config.subtraction}
                showRange2={false}
                onEnableChange={() => handleCheckbox("subtraction")}
                onRangeChange={(which, field, value) =>
                  handleRange("subtraction", which, field, value)
                }
              />
              <OperationConfigSection
                id="multiplication"
                label={operationNames.multiplication}
                symbol={operationSymbols.multiplication}
                config={config.multiplication}
                showRange2={true}
                onEnableChange={() => handleCheckbox("multiplication")}
                onRangeChange={(which, field, value) =>
                  handleRange("multiplication", which, field, value)
                }
              />
              <OperationConfigSection
                id="division"
                label={operationNames.division}
                symbol={operationSymbols.division}
                config={config.division}
                showRange2={true}
                onEnableChange={() => handleCheckbox("division")}
                onRangeChange={(which, field, value) =>
                  handleRange("division", which, field, value)
                }
              />
            </div>
            <div className="flex items-center gap-3 mt-4">
              <label className="font-medium text-lg" htmlFor="duration">
                Duration:
              </label>
              <select
                id="duration"
                className="border rounded px-2 py-1 text-lg"
                value={config.duration}
                onChange={(e) => handleDuration(parseInt(e.target.value))}
              >
                <option value={30}>30 seconds</option>
                <option value={60}>60 seconds</option>
                <option value={90}>90 seconds</option>
                <option value={120}>120 seconds</option>
                <option value={180}>180 seconds</option>
              </select>
            </div>
            <div className="mt-8 text-center">
              <button
                type="submit"
                className="bg-blue-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-lg shadow"
              >
                Start Game
              </button>
            </div>
          </form>
        </div>
        {/* Leaderboard Column */}
        <div className="w-96 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Leaderboard</h2>
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="pb-2">User</th>
                <th className="pb-2 text-right">Avg Score</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row, i) => (
                <tr
                  key={row.user_id}
                  className={i % 2 === 0 ? "bg-gray-50" : ""}
                >
                  <td className="py-1 pr-2">
                    <div className="flex items-center gap-2">
                      {row.user_metadata?.avatar_url ? (
                        <img
                          src={row.user_metadata.avatar_url}
                          alt="Profile"
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-gray-600 text-xs">
                            {row.user_id.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-1 text-right font-mono">
                    {row.avg.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
