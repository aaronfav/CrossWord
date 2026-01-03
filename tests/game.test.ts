import { describe, expect, it } from "vitest";
import { DIFFICULTY_CONFIG } from "../app/lib/gameConfig";
import {
  addUniqueWord,
  isDerivable,
  isValidDictionaryWord,
  normalizeWord,
} from "../app/lib/wordUtils";

describe("word derivation", () => {
  it("respects letter counts", () => {
    expect(isDerivable("tone", "stone")).toBe(true);
    expect(isDerivable("stone", "tone")).toBe(false);
    expect(isDerivable("soon", "stone")).toBe(false);
  });
});

describe("duplicate prevention", () => {
  it("keeps a single copy of a word", () => {
    const list = ["tone", "note"];
    const next = addUniqueWord(list, "tone");
    expect(next).toEqual(list);
  });
});

describe("dictionary validation wrapper", () => {
  it("validates against a dictionary set", () => {
    const dictionary = new Set(["tone", "note"]);
    expect(isValidDictionaryWord(normalizeWord("Tone"), dictionary)).toBe(true);
    expect(isValidDictionaryWord(normalizeWord("fake"), dictionary)).toBe(false);
  });
});

describe("difficulty config", () => {
  it("uses required defaults", () => {
    expect(DIFFICULTY_CONFIG.easy.durationSec).toBe(30);
    expect(DIFFICULTY_CONFIG.easy.requiredCount).toBe(3);
    expect(DIFFICULTY_CONFIG.medium.durationSec).toBe(25);
    expect(DIFFICULTY_CONFIG.medium.requiredCount).toBe(4);
    expect(DIFFICULTY_CONFIG.hard.requiredCount).toBe(4);
  });
});
