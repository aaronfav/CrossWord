import { NextRequest, NextResponse } from "next/server";
import { DIFFICULTY_CONFIG, Difficulty } from "../../lib/gameConfig";
import { pickRootWord } from "../../lib/serverGame";
import { getWordListPath } from "../../lib/dictionary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const difficulties: Difficulty[] = ["easy", "medium", "hard"];

export function GET(request: NextRequest) {
  let difficultyParam: string | null = null;
  try {
    difficultyParam = request.nextUrl.searchParams
      .get("difficulty")
      ?.toLowerCase() ?? null;

    if (!difficultyParam || !difficulties.includes(difficultyParam as Difficulty)) {
      return NextResponse.json(
        { error: "INVALID_DIFFICULTY", message: "Invalid difficulty." },
        { status: 400 }
      );
    }

    const difficulty = difficultyParam as Difficulty;
    console.log("[new-game] request", {
      difficulty,
      cwd: process.cwd(),
      wordListPath: getWordListPath(),
    });

    let rootWord: string | null = null;
    try {
      rootWord = pickRootWord(difficulty);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.startsWith("WORDLIST_MISSING")) {
        return NextResponse.json(
          {
            error: "WORDLIST_MISSING",
            message:
              "Word list file is missing in the server bundle. Check outputFileTracingIncludes.",
            details: msg,
          },
          { status: 500 }
        );
      }
      if (msg.startsWith("WORDLIST_EMPTY")) {
        return NextResponse.json(
          {
            error: "WORDLIST_EMPTY",
            message:
              "Word list file is empty in the server bundle. Check outputFileTracingIncludes.",
            details: msg,
          },
          { status: 500 }
        );
      }
      console.error("[new-game] pickRootWord failed", {
        difficulty,
        err,
      });
      return NextResponse.json(
        {
          error: "ROOTWORD_PICK_FAILED",
          message: "Failed to pick a root word.",
          details: msg,
        },
        { status: 500 }
      );
    }

    if (!rootWord) {
      return NextResponse.json(
        {
          error: "NO_ELIGIBLE_ROOT_WORDS",
          message: "No eligible root words available.",
        },
        { status: 500 }
      );
    }

    const config = DIFFICULTY_CONFIG[difficulty];
    return NextResponse.json({
      rootWord,
      durationSec: config.durationSec,
      requiredCount: config.requiredCount,
    });
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err);
    console.error("[new-game] route error", {
      err,
      cwd: process.cwd(),
      wordListPath: getWordListPath(),
      difficulty: difficultyParam,
    });
    return NextResponse.json(
      { error: "NEW_GAME_ROUTE_FAILED", message: "Failed to start a new game", details },
      { status: 500 }
    );
  }
}
