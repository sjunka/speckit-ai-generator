import { describe, it, expect } from "vitest";
import { assertContrastWCAGAA, assertBodyTextContrast } from "./contrast";

describe("Contrast checker", () => {
  it("detects sufficient contrast (4.5:1+)", () => {
    expect(() => {
      assertContrastWCAGAA("#f7f8f8", "#010102");
    }).not.toThrow();
  });

  it("verifies body text contrast across all surfaces", () => {
    expect(() => {
      assertBodyTextContrast();
    }).not.toThrow();
  });
});
