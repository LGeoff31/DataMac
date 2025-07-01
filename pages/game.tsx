import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Geist, Geist_Mono } from "next/font/google";

const geist = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });

interface Range {
  min: number;
  max: number;
}

interface OperationConfig {
  enabled: boolean;
  range1: Range;
  range2: Range;
}

interface GameConfig {
  addition: OperationConfig;
  subtraction: OperationConfig;
  multiplication: OperationConfig;
  division: OperationConfig;
  duration: number;
}

interface Problem {
  lhs: number;
  rhs: number;
  operation: string;
  answer: number;
}

export default function Game() {
  const router = useRouter();
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [totalProblems, setTotalProblems] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [gameActive, setGameActive] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  useEffect(() => {
    if (router.isReady) {
      const config: GameConfig = {
        addition: {
          enabled: router.query.addEnabled === "1",
          range1: {
            min: parseInt(router.query.addMin1 as string) || 2,
            max: parseInt(router.query.addMax1 as string) || 100,
          },
          range2: {
            min: parseInt(router.query.addMin2 as string) || 2,
            max: parseInt(router.query.addMax2 as string) || 100,
          },
        },
        subtraction: {
          enabled: router.query.subEnabled === "1",
          range1: {
            min: parseInt(router.query.subMin as string) || 2,
            max: parseInt(router.query.subMax as string) || 100,
          },
          range2: {
            min: parseInt(router.query.subMin as string) || 2,
            max: parseInt(router.query.subMax as string) || 100,
          },
        },
        multiplication: {
          enabled: router.query.mulEnabled === "1",
          range1: {
            min: parseInt(router.query.mulMin1 as string) || 2,
            max: parseInt(router.query.mulMax1 as string) || 12,
          },
          range2: {
            min: parseInt(router.query.mulMin2 as string) || 2,
            max: parseInt(router.query.mulMax2 as string) || 100,
          },
        },
        division: {
          enabled: router.query.divEnabled === "1",
          range1: {
            min: parseInt(router.query.divMin as string) || 2,
            max: parseInt(router.query.divMax as string) || 12,
          },
          range2: {
            min: parseInt(router.query.divMin2 as string) || 2,
            max: parseInt(router.query.divMax2 as string) || 100,
          },
        },
        duration: parseInt(router.query.duration as string) || 60,
      };
      setGameConfig(config);
      startGame(config, config.duration);
    }
  }, [router.isReady, router.query]);

  function getEnabledOps(config: GameConfig) {
    const ops = [];
    if (config.addition.enabled) ops.push("addition");
    if (config.subtraction.enabled) ops.push("subtraction");
    if (config.multiplication.enabled) ops.push("multiplication");
    if (config.division.enabled) ops.push("division");
    return ops;
  }

  function randomInRange(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  const generateProblem = (config: GameConfig): Problem => {
    const enabledOps = getEnabledOps(config);
    const opName = enabledOps[Math.floor(Math.random() * enabledOps.length)];
    let lhs, rhs, answer, symbol;

    if (opName === "addition") {
      lhs = randomInRange(
        config.addition.range1.min,
        config.addition.range1.max
      );
      rhs = randomInRange(
        config.addition.range2!.min,
        config.addition.range2!.max
      );
      answer = lhs + rhs;
      symbol = "+";
    } else if (opName === "subtraction") {
      // Subtraction: Addition in reverse
      rhs = randomInRange(
        config.subtraction.range1.min,
        config.subtraction.range1.max
      );
      answer = randomInRange(
        config.subtraction.range2.min,
        config.subtraction.range2.max
      );
      lhs = rhs + answer;
      symbol = "−";
    } else if (opName === "multiplication") {
      lhs = randomInRange(
        config.multiplication.range1.min,
        config.multiplication.range1.max
      );
      rhs = randomInRange(
        config.multiplication.range2!.min,
        config.multiplication.range2!.max
      );
      answer = lhs * rhs;
      symbol = "×";
    } else if (opName === "division") {
      // Division: Multiplication in reverse
      rhs = randomInRange(
        config.division.range1.min,
        config.division.range1.max
      );
      answer = randomInRange(
        config.division.range2!.min,
        config.division.range2!.max
      );
      lhs = rhs * answer;
      symbol = "÷";
    }
    return { lhs, rhs, operation: symbol, answer } as Problem;
  };

  const startGame = (config: GameConfig, duration: number) => {
    setGameActive(true);
    setScore(0);
    setTotalProblems(0);
    setCorrectAnswers(0);
    setTimeLeft(duration);
    setCurrentProblem(generateProblem(config));
    setUserAnswer("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProblem || !gameActive || !gameConfig) return;

    const answer = parseInt(userAnswer);
    if (answer === currentProblem.answer) {
      setScore(score + 1);
      setCorrectAnswers(correctAnswers + 1);
    }

    setTotalProblems(totalProblems + 1);
    setCurrentProblem(generateProblem(gameConfig));
    setUserAnswer("");
  };

  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/[^0-9]/g, "");
    setUserAnswer(newValue);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameActive && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && gameActive) {
      setGameActive(false);
    }
    return () => clearTimeout(timer);
  }, [gameActive, timeLeft]);

  // Auto-advance on correct answer
  useEffect(() => {
    if (!currentProblem || !gameActive || !gameConfig) return;
    const answer = parseInt(userAnswer);
    if (answer === currentProblem.answer) {
      setScore((s) => s + 1);
      setCorrectAnswers((c) => c + 1);
      setTotalProblems((t) => t + 1);
      setCurrentProblem(generateProblem(gameConfig));
      setUserAnswer("");
    }
  }, [userAnswer]);

  if (!gameConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${geist.className}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="text-2xl font-bold text-gray-800 mb-2">
                Time: {timeLeft}s
              </div>
              <div className="text-lg text-gray-600">Score: {score}</div>
            </div>

            {gameActive && currentProblem ? (
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-gray-800 mb-4">
                  {currentProblem.lhs} {currentProblem.operation}{" "}
                  {currentProblem.rhs} = ?
                </div>

                <form onSubmit={handleSubmit}>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={userAnswer}
                    onChange={handleAnswerChange}
                    className={`w-full text-center text-3xl font-bold py-4 px-6 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 ${geistMono.className}`}
                    autoFocus
                  />
                </form>
              </div>
            ) : (
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Game Over!
                </h2>
                <div className="text-lg text-gray-600 mb-4">
                  Final Score: {score}
                </div>
                <button
                  onClick={() => router.push("/")}
                  className="bg-blue-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Back
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
