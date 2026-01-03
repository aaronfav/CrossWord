import { NextResponse } from "next/server";
import { loadDictionary } from "../../lib/dictionary";
import { isValidSubmission, normalizeWord } from "../../lib/wordUtils";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.word || !body?.rootWord) {
    return NextResponse.json(
      { valid: false, reason: "Missing word or root word." },
      { status: 400 },
    );
  }

  const rootWord = normalizeWord(String(body.rootWord));
  const word = normalizeWord(String(body.word));
  const dictionary = loadDictionary();
  const result = isValidSubmission({ word, rootWord, dictionary });

  return NextResponse.json(result);
}
