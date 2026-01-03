import { NextRequest, NextResponse } from "next/server";
import { DIFFICULTY_CONFIG, Difficulty } from "../../lib/gameConfig";
import { pickRootWord } from "../../lib/serverGame";

export const runtime = "nodejs";

const difficulties: Difficulty[] = ["easy", "medium", "hard"];

export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const difficultyParam = searchParams.get("difficulty")?.toLowerCase();
  if (!difficultyParam || !difficulties.includes(difficultyParam as Difficulty)) {
    return NextResponse.json(
      { error: "Invalid difficulty." },
      { status: 400 },
    );
  }

  const difficulty = difficultyParam as Difficulty;
  const rootWord = pickRootWord(difficulty);
  if (!rootWord) {
    return NextResponse.json(
      { error: "No eligible root words available." },
      { status: 500 },
    );
  }

  const config = DIFFICULTY_CONFIG[difficulty];
  return NextResponse.json({
    rootWord,
    durationSec: config.durationSec,
    requiredCount: config.requiredCount,
  });
}
