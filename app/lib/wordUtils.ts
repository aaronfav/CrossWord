export type LetterCount = Record<string, number>;

export function countLetters(word: string): LetterCount {
  const counts: LetterCount = {};
  for (const char of word) {
    counts[char] = (counts[char] ?? 0) + 1;
  }
  return counts;
}

export function isDerivable(candidate: string, root: string): boolean {
  const rootCounts = countLetters(root);
  for (const char of candidate) {
    const available = rootCounts[char] ?? 0;
    if (available <= 0) return false;
    rootCounts[char] = available - 1;
  }
  return true;
}

export function normalizeWord(word: string): string {
  return word.trim().toLowerCase();
}

export function isValidDictionaryWord(
  word: string,
  dictionary: Set<string>,
): boolean {
  return dictionary.has(word);
}

export function isValidSubmission({
  word,
  rootWord,
  dictionary,
}: {
  word: string;
  rootWord: string;
  dictionary: Set<string>;
}): { valid: boolean; reason?: string } {
  if (word.length < 3) {
    return { valid: false, reason: "Use at least 3 letters." };
  }
  if (word === rootWord) {
    return { valid: false, reason: "Root word is not allowed." };
  }
  if (!isValidDictionaryWord(word, dictionary)) {
    return { valid: false, reason: "Not in dictionary." };
  }
  if (!isDerivable(word, rootWord)) {
    return { valid: false, reason: "Letters must come from the root word." };
  }
  return { valid: true };
}

export function addUniqueWord(list: string[], word: string): string[] {
  if (list.includes(word)) return list;
  return [...list, word];
}
