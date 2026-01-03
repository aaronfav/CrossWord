import { NextResponse } from "next/server";
import { getPossibleSubwords } from "../../lib/serverGame";
import { normalizeWord } from "../../lib/wordUtils";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.rootWord) {
    return NextResponse.json(
      { error: "Missing root word." },
      { status: 400 },
    );
  }

  const rootWord = normalizeWord(String(body.rootWord));
  const possibleWords = getPossibleSubwords(rootWord);
  return NextResponse.json({ possibleWords });
}
