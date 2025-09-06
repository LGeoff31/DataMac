import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Geist, Geist_Mono } from "next/font/google";
import { createClient } from "@supabase/supabase-js";
import { Range, OperationConfig, GameConfig, SpeechRecognition } from "../types";

const geist = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });

const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

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
  
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [lastVoiceResult, setLastVoiceResult] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  const currentProblemRef = useRef<Problem | null>(null);
  const gameActiveRef = useRef<boolean>(false);
  const gameConfigRef = useRef<GameConfig | null>(null);
  const scoreRef = useRef<number>(0);
  const correctAnswersRef = useRef<number>(0);
  const totalProblemsRef = useRef<number>(0);
  const isListeningRef = useRef<boolean>(false);

  const parseSpokenNumber = (text: string, isInterim: boolean = false): number | null => {
    const normalized = text.toLowerCase()
      .replace(/\b(and|the|a|an)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    const directNumber = parseInt(normalized.replace(/[^0-9]/g, ''));
    if (!isNaN(directNumber)) {
      return directNumber;
    }
    
    const numberWords: { [key: string]: number } = {
      'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
      'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
      'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
      'eighty': 80, 'ninety': 90, 'hundred': 100, 'thousand': 1000
    };
    
    if (isInterim) {
      for (const [word, value] of Object.entries(numberWords)) {
        if (normalized.includes(word) || word.startsWith(normalized) || normalized.startsWith(word)) {
          return value;
        }
      }
    } else {
      for (const [word, value] of Object.entries(numberWords)) {
        if (normalized.includes(word)) {
          return value;
        }
      }
    }
    
    return null;
  };

  useEffect(() => {
    currentProblemRef.current = currentProblem;
    gameActiveRef.current = gameActive;
    gameConfigRef.current = gameConfig;
    scoreRef.current = score;
    correctAnswersRef.current = correctAnswers;
    totalProblemsRef.current = totalProblems;
    isListeningRef.current = isListening;
  }, [currentProblem, gameActive, gameConfig, score, correctAnswers, totalProblems, isListening]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onend = () => {
        setIsListening(false);
        if (voiceEnabled && gameActiveRef.current) {
          setTimeout(() => {
            if (voiceEnabled && gameActiveRef.current && !isListeningRef.current) {
              try {
                recognition.start();
              } catch (error) {
                console.log('Auto-restart speech recognition error:', error);
              }
            }
          }, 50);
        }
      };
      
      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript.trim();
          
          const spokenNumber = parseSpokenNumber(transcript, !result.isFinal);
          
          if (result.isFinal) {
            setLastVoiceResult(transcript);
            
            console.log('Voice recognition result (FINAL):', {
              transcript,
              spokenNumber,
              currentAnswer: currentProblemRef.current?.answer,
              gameActive: gameActiveRef.current,
              voiceEnabled
            });
          } else {
            setLastVoiceResult(transcript + '...');
            
            console.log('Voice recognition result (INTERIM):', {
              transcript,
              spokenNumber,
              currentAnswer: currentProblemRef.current?.answer
            });
          }
          
          if (spokenNumber !== null && currentProblemRef.current && gameActiveRef.current) {
            if (spokenNumber === currentProblemRef.current.answer) {
              console.log('Correct answer detected via voice!', result.isFinal ? '(FINAL)' : '(INTERIM)');
              setScore(scoreRef.current + 1);
              setCorrectAnswers(correctAnswersRef.current + 1);
              setTotalProblems(totalProblemsRef.current + 1);
              if (gameConfigRef.current) {
                setCurrentProblem(generateProblem(gameConfigRef.current));
              }
              setUserAnswer("");
              return;
            }
          }
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    if (!recognitionRef.current) return;
    
    if (voiceEnabled && gameActive && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.log('Speech recognition already started or error:', error);
      }
    } else if (!voiceEnabled || !gameActive) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (error) {
        console.log('Speech recognition stop error:', error);
      }
    }
  }, [voiceEnabled, gameActive, isListening]);

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

  const toggleVoiceRecognition = () => {
    if (!recognitionRef.current) return;
    
    if (voiceEnabled) {
      recognitionRef.current.stop();
      setVoiceEnabled(false);
      setIsListening(false);
    } else {
      setVoiceEnabled(true);
      if (gameActive) {
        recognitionRef.current.start();
      }
    }
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
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setVoiceEnabled(false);
      setIsListening(false);
      (async () => {
        console.log("Saving score to Supabase");
        const supabase = createSupabaseClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        console.log("user", user?.user_metadata?.avatar_url, score);
        if (user) {
          await supabase.from("scores").insert([
            {
              user_id: user.id,
              value: score,
              avatar_url: user.user_metadata?.avatar_url,
            },
          ]);
        }
      })();
    }
    return () => clearTimeout(timer);
  }, [gameActive, timeLeft]);

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
              <div className="text-lg text-gray-600 mb-4">Score: {score}</div>
              
              <div className="flex items-center justify-center gap-4 mb-4">
                <button
                  onClick={toggleVoiceRecognition}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-2 ${
                    voiceEnabled
                      ? isListening
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-500 hover:bg-gray-600 text-white'
                  }`}
                >
                  <span className="text-lg">
                    {voiceEnabled ? (isListening ? '🎤' : '🔇') : '🎤'}
                  </span>
                  {voiceEnabled ? (isListening ? 'Listening...' : 'Voice On') : 'Voice Off'}
                </button>
                
                {lastVoiceResult && (
                  <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded">
                    Heard: "{lastVoiceResult}"
                  </div>
                )}
              </div>
              
              <div className="text-sm text-gray-500 mb-2">
                {voiceEnabled 
                  ? "Speak the answer to automatically advance!" 
                  : "Click the microphone to enable voice recognition"
                }
              </div>
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
