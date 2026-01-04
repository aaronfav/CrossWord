import fs from "fs";
import path from "path";
import wordListPath from "word-list";

let cachedDictionary: Set<string> | null = null;

export function getWordListPath(): string {
  const vendoredPath = path.join(
    process.cwd(),
    "app",
    "assets",
    "word-list",
    "words.txt",
  );
  if (fs.existsSync(vendoredPath)) {
    return vendoredPath;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(`WORDLIST_MISSING: ${vendoredPath} (cwd: ${process.cwd()})`);
  }
  return wordListPath;
}

export function loadDictionary(): Set<string> {
  if (cachedDictionary) return cachedDictionary;
  const fullPath = getWordListPath();
  const cwd = process.cwd();
  if (!fs.existsSync(fullPath)) {
    throw new Error(`WORDLIST_MISSING: ${fullPath} (cwd: ${cwd})`);
  }
  const content = fs.readFileSync(fullPath, "utf8");
  if (!content.trim()) {
    throw new Error(`WORDLIST_EMPTY: ${fullPath} (cwd: ${cwd})`);
  }
  const words = content
    .split("\n")
    .map((word) => word.trim().toLowerCase())
    .filter((word) => word.length >= 3);
  if (words.length === 0) {
    throw new Error(`WORDLIST_EMPTY: ${fullPath} (cwd: ${cwd})`);
  }
  cachedDictionary = new Set(words);
  return cachedDictionary;
}
