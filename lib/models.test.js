import { describe, it, expect } from "vitest";
import { COST_PER_IMAGE, COST_PER_VIDEO } from "./models.js";

describe("lib/models.js", () => {
  it("exports COST_PER_IMAGE as a positive number", () => {
    expect(typeof COST_PER_IMAGE).toBe("number");
    expect(COST_PER_IMAGE).toBeGreaterThan(0);
  });

  it("exports COST_PER_VIDEO as a positive number", () => {
    expect(typeof COST_PER_VIDEO).toBe("number");
    expect(COST_PER_VIDEO).toBeGreaterThan(0);
  });
});
