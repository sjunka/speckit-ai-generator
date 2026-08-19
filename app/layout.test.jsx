import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("RootLayout", () => {
  const layoutPath = path.join(process.cwd(), "app", "layout.jsx");
  const layoutContent = fs.readFileSync(layoutPath, "utf-8");

  it("has dark class", () => {
    expect(layoutContent).toMatch(/className=.*dark/);
  });

  it("includes font variables in html className", () => {
    expect(layoutContent).toMatch(/inter\.variable/);
    expect(layoutContent).toMatch(/jetbrainsMono\.variable/);
  });

  it("body has bg-canvas and text-ink classes", () => {
    expect(layoutContent).toMatch(/<body[^>]*className.*bg-canvas/);
    expect(layoutContent).toMatch(/<body[^>]*className.*text-ink/);
  });

  it("exports metadata with viewport", () => {
    expect(layoutContent).toMatch(/export\s+const\s+metadata/);
    expect(layoutContent).toMatch(/export\s+const\s+viewport/);
    expect(layoutContent).toMatch(/device-width/);
  });
});

describe("PWA Manifest", () => {
  const layoutPath = path.join(process.cwd(), "app", "layout.jsx");
  const layoutContent = fs.readFileSync(layoutPath, "utf-8");

  it("references manifest.json in metadata", () => {
    expect(layoutContent).toMatch(/manifest\.json/);
  });
});
