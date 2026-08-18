import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Typography scale", () => {
  const globalsPath = path.join(process.cwd(), "app", "globals.css");
  const globalsContent = fs.readFileSync(globalsPath, "utf-8");

  it("defines display tracking as negative", () => {
    expect(globalsContent).toMatch(/\.display-xl[\s\S]*letter-spacing:\s*-3px/);
    expect(globalsContent).toMatch(/\.display-lg[\s\S]*letter-spacing:\s*-2\.4px/);
    expect(globalsContent).toMatch(/\.display-md[\s\S]*letter-spacing:\s*-1\.8px/);
    expect(globalsContent).toMatch(/\.display-sm[\s\S]*letter-spacing:\s*-0\.6px/);
  });

  it("defines eyebrow tracking as positive 0.4px", () => {
    expect(globalsContent).toMatch(/\.eyebrow[\s\S]*letter-spacing:\s*0\.4px/);
  });

  it("has fonts loaded from next/font", () => {
    const layoutPath = path.join(process.cwd(), "app", "layout.jsx");
    const layoutContent = fs.readFileSync(layoutPath, "utf-8");
    expect(layoutContent).toMatch(/from\s+["']next\/font\/google["']/);
    expect(layoutContent).toMatch(/Inter/);
    expect(layoutContent).toMatch(/JetBrains_Mono/);
  });

  it("defines display, heading, body and caption utilities", () => {
    expect(globalsContent).toMatch(/\.display-xl/);
    expect(globalsContent).toMatch(/\.display-sm/);
    expect(globalsContent).toMatch(/\.heading/);
    expect(globalsContent).toMatch(/\.body/);
    expect(globalsContent).toMatch(/\.caption/);
  });

  it("does not use display weight above 600", () => {
    const displayLines = globalsContent.match(/\.display-[a-z-]+[\s\S]*?(?=\n  \.|$)/g) || [];
    displayLines.forEach((line) => {
      const weight = line.match(/font-weight:\s*(\d+)/);
      if (weight) {
        expect(parseInt(weight[1])).toBeLessThanOrEqual(600);
      }
    });
  });

  it("defines eyebrow at weight 500", () => {
    expect(globalsContent).toMatch(/\.eyebrow[\s\S]*font-weight:\s*500/);
  });
});
