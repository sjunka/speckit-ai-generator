import { describe, it, expect } from "vitest";
import { EMOTIONS, LEVELS, LEVELLED, buildHint } from "./emotions.js";

// The seven strings the provider can ever receive. An eighth is unreachable
// (SC-003), and the case below that enumerates every valid combination is what
// proves it.
const HINTS = {
  happy: "I am feeling happy 😊",
  "a bit angry": "I am feeling a bit angry 😠",
  "quite angry": "I am feeling quite angry 😠",
  "very angry": "I am feeling very angry 😠",
  "a bit sad": "I am feeling a bit sad 😢",
  "quite sad": "I am feeling quite sad 😢",
  "very sad": "I am feeling very sad 😢",
};

describe("lib/emotions.js", () => {
  it("offers three emotions in render order", () => {
    expect(EMOTIONS).toEqual(["happy", "angry", "sad"]);
  });

  it("offers three levels in render order", () => {
    expect(LEVELS).toEqual(["a bit", "quite", "very"]);
  });

  it("marks only angry and sad as taking a level", () => {
    expect(LEVELLED).toEqual(["angry", "sad"]);
  });

  it("composes happy's hint with and without an explicit undefined level", () => {
    expect(buildHint("happy")).toBe(HINTS.happy);
    expect(buildHint("happy", undefined)).toBe(HINTS.happy);
  });

  it("composes every levelled hint character for character", () => {
    for (const emotion of LEVELLED) {
      for (const level of LEVELS) {
        expect(buildHint(emotion, level)).toBe(HINTS[`${level} ${emotion}`]);
      }
    }
  });

  it("reaches exactly seven hints and no eighth", () => {
    const reachable = new Set([buildHint("happy")]);
    for (const emotion of LEVELLED) {
      for (const level of LEVELS) reachable.add(buildHint(emotion, level));
    }

    expect(reachable.size).toBe(7);
    expect([...reachable].sort()).toEqual(Object.values(HINTS).sort());
  });

  it("rejects an emotion outside the three", () => {
    for (const emotion of ["excited", "HAPPY", "", undefined, null]) {
      expect(() => buildHint(emotion, "quite")).toThrowError("Unknown emotion");
    }

    try {
      buildHint("excited");
      expect.unreachable();
    } catch (error) {
      expect(error.message).toBe("Unknown emotion");
      expect(error.status).toBe(400);
    }
  });

  it("rejects a levelled emotion whose level is unknown or absent", () => {
    for (const emotion of LEVELLED) {
      for (const level of ["a lot", "QUITE", "", undefined, null]) {
        try {
          buildHint(emotion, level);
          expect.unreachable();
        } catch (error) {
          expect(error.message).toBe("Unknown level");
          expect(error.status).toBe(400);
        }
      }
    }
  });

  it("rejects a level on happy, valid or not", () => {
    for (const level of ["quite", "a bit", "very", "a lot", null]) {
      try {
        buildHint("happy", level);
        expect.unreachable();
      } catch (error) {
        expect(error.message).toBe("happy takes no level");
        expect(error.status).toBe(400);
      }
    }
  });
});
