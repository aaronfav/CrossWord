import fs from "fs";
import wordListPath from "word-list";

let cachedDictionary: Set<string> | null = null;

export function loadDictionary(): Set<string> {
  if (cachedDictionary) return cachedDictionary;
  const content = fs.readFileSync(wordListPath, "utf8");
  const words = content
    .split("\n")
    .map((word) => word.trim().toLowerCase())
    .filter((word) => word.length >= 3);
  cachedDictionary = new Set(words);
  return cachedDictionary;
}
