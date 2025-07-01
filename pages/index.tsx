import React, { useState } from "react";
import { useRouter } from "next/router";
import OperationConfigSection from "./components/OperationConfigSection";
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

type OperationKey = "addition" | "subtraction" | "multiplication" | "division";

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
      <div className="w-full max-w-xl bg-white rounded-xl shadow-lg p-8">
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
    </div>
  );
}
