export type Difficulty = "easy" | "medium" | "hard";

export const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { durationSec: number; requiredCount: number }
> = {
  easy: { durationSec: 30, requiredCount: 3 },
  medium: { durationSec: 25, requiredCount: 4 },
  hard: { durationSec: 20, requiredCount: 4 },
};
