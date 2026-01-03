import { DIFFICULTY_CONFIG, Difficulty } from "./gameConfig";
import { ROOT_WORDS } from "./rootWords";
import { loadDictionary } from "./dictionary";
import { isDerivable, normalizeWord } from "./wordUtils";

const possibleWordsCache = new Map<string, string[]>();
const eligibleRootsCache = new Map<Difficulty, string[]>();

export function getPossibleSubwords(rootWord: string): string[] {
  const normalizedRoot = normalizeWord(rootWord);
  const cached = possibleWordsCache.get(normalizedRoot);
  if (cached) return cached;

  const dictionary = loadDictionary();
  const possible = Array.from(dictionary).filter(
    (word) =>
      word.length >= 3 &&
      word !== normalizedRoot &&
      word.length <= normalizedRoot.length &&
      isDerivable(word, normalizedRoot),
  );

  possibleWordsCache.set(normalizedRoot, possible);
  return possible;
}

export function getEligibleRootWords(difficulty: Difficulty): string[] {
  const cached = eligibleRootsCache.get(difficulty);
  if (cached) return cached;

  const { requiredCount } = DIFFICULTY_CONFIG[difficulty];
  const eligible = ROOT_WORDS[difficulty]
    .map((word) => normalizeWord(word))
    .filter((word) => getPossibleSubwords(word).length >= requiredCount);

  eligibleRootsCache.set(difficulty, eligible);
  return eligible;
}

export function pickRootWord(difficulty: Difficulty): string | null {
  const eligible = getEligibleRootWords(difficulty);
  if (eligible.length === 0) return null;
  const index = Math.floor(Math.random() * eligible.length);
  return eligible[index] ?? null;
}
