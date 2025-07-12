export interface Range {
  min: number;
  max: number;
}

export interface OperationConfig {
  enabled: boolean;
  range1: Range;
  range2: Range;
}

export interface GameConfig {
  addition: OperationConfig;
  subtraction: OperationConfig;
  multiplication: OperationConfig;
  division: OperationConfig;
  duration: number;
}

export type OperationKey =
  | "addition"
  | "subtraction"
  | "multiplication"
  | "division";

export interface UserMetadata {
  avatar_url?: string;
  email?: string;
  name?: string;
}
