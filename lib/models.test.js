import { describe, it, expect } from "vitest";
import { COST_PER_IMAGE, COST_PER_VIDEO } from "./models.js";

describe("lib/models.js", () => {
  it("exports fixed positive image and video costs", () => {
    expect(COST_PER_IMAGE).toBe(0.02);
    expect(COST_PER_VIDEO).toBe(0.1);
  });
});
