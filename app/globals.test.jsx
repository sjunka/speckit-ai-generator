import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Design tokens", () => {
  const globalsPath = path.join(process.cwd(), "app", "globals.css");
  const globalsContent = fs.readFileSync(globalsPath, "utf-8");

  it("defines canvas color #010102", () => {
    expect(globalsContent).toMatch(/--color-canvas:\s*#010102/);
  });

  it("defines surface ladder steps", () => {
    expect(globalsContent).toMatch(/--color-surface-1:\s*#0f1011/);
    expect(globalsContent).toMatch(/--color-surface-2:/);
    expect(globalsContent).toMatch(/--color-surface-3:/);
    expect(globalsContent).toMatch(/--color-surface-4:/);
  });

  it("defines hairline color #23252a", () => {
    expect(globalsContent).toMatch(/--color-hairline:\s*#23252a/);
  });

  it("defines text-ink color", () => {
    expect(globalsContent).toMatch(/--color-ink:\s*#f7f8f8/);
  });

  it("has no raw lavender hex outside @theme block", () => {
    const beforeTheme = globalsContent.split("@theme")[0];
    expect(beforeTheme).not.toMatch(/#5e6ad2/i);
  });

  it("resolves surface ladder colors from dark to lighter", () => {
    const surface1 = globalsContent.match(/--color-surface-1:\s*(#[0-9a-f]+)/i)[1];
    const surface4 = globalsContent.match(/--color-surface-4:\s*(#[0-9a-f]+)/i)[1];
    expect(surface1).toBeTruthy();
    expect(surface4).toBeTruthy();
  });
});

describe("Typographic scale", () => {
  const globalsPath = path.join(process.cwd(), "app", "globals.css");
  const globalsContent = fs.readFileSync(globalsPath, "utf-8");

  it("defines display-xl with size 80px and weight 600", () => {
    expect(globalsContent).toMatch(/\.display-xl\s*{[^}]*font-size:\s*80px/);
    expect(globalsContent).toMatch(/\.display-xl\s*{[^}]*font-weight:\s*600/);
  });

  it("defines display-lg with weight 600", () => {
    expect(globalsContent).toMatch(/\.display-lg\s*{[^}]*font-weight:\s*600/);
  });

  it("defines display-md with weight 600", () => {
    expect(globalsContent).toMatch(/\.display-md\s*{[^}]*font-weight:\s*600/);
  });

  it("defines display-sm with size 28px and weight 600", () => {
    expect(globalsContent).toMatch(/\.display-sm\s*{[^}]*font-size:\s*28px/);
    expect(globalsContent).toMatch(/\.display-sm\s*{[^}]*font-weight:\s*600/);
  });

  it("defines heading-xl with weight 600", () => {
    expect(globalsContent).toMatch(/\.heading-xl\s*{[^}]*font-weight:\s*600/);
  });

  it("defines heading with weight 600", () => {
    expect(globalsContent).toMatch(/\.heading\s*{[^}]*font-weight:\s*600/);
  });

  it("defines body with weight 400", () => {
    expect(globalsContent).toMatch(/\.body\s*{[^}]*font-weight:\s*400/);
  });

  it("defines caption with weight 400", () => {
    expect(globalsContent).toMatch(/\.caption\s*{[^}]*font-weight:\s*400/);
  });

  it("defines eyebrow with size 13px, weight 500, and positive tracking", () => {
    expect(globalsContent).toMatch(/\.eyebrow\s*{[^}]*font-size:\s*13px/);
    expect(globalsContent).toMatch(/\.eyebrow\s*{[^}]*font-weight:\s*500/);
    expect(globalsContent).toMatch(/\.eyebrow\s*{[^}]*letter-spacing:\s*0.4px/);
  });

  it("applies negative tracking to display sizes", () => {
    expect(globalsContent).toMatch(/\.display-xl\s*{[^}]*letter-spacing:\s*-3px/);
    expect(globalsContent).toMatch(/\.display-sm\s*{[^}]*letter-spacing:\s*-0.6px/);
  });

  it("does not use font weight above 600", () => {
    const weights = globalsContent.match(/font-weight:\s*(\d+)/g) || [];
    weights.forEach((weight) => {
      const num = parseInt(weight.match(/(\d+)/)[1]);
      expect(num).toBeLessThanOrEqual(600);
    });
  });
});
