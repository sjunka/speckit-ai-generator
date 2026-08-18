import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Web App Manifest", () => {
  const manifestPath = path.join(process.cwd(), "public", "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

  it("has standalone display mode", () => {
    expect(manifest.display).toBe("standalone");
  });

  it("has theme_color #010102", () => {
    expect(manifest.theme_color).toBe("#010102");
  });

  it("has background_color #010102", () => {
    expect(manifest.background_color).toBe("#010102");
  });

  it("includes 192px icon", () => {
    const icon192 = manifest.icons.find((i) => i.sizes === "192x192");
    expect(icon192).toBeDefined();
    expect(icon192.src).toBe("/icon-192.png");
    expect(icon192.type).toBe("image/png");
  });

  it("includes 512px icon", () => {
    const icon512 = manifest.icons.find((i) => i.sizes === "512x512");
    expect(icon512).toBeDefined();
    expect(icon512.src).toBe("/icon-512.png");
    expect(icon512.type).toBe("image/png");
  });
});
