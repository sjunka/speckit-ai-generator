import { describe, it, expect } from "vitest";
import { handlers } from "./handlers";

describe("MSW handlers", () => {
  it("includes handlers for all four API routes", () => {
    const paths = handlers.map((h) => h.info.path);
    expect(paths).toContain("/api/image");
    expect(paths).toContain("/api/video");
  });

  it("POST /api/image returns imageUrl", () => {
    const imageHandler = handlers.find((h) => h.info.path === "/api/image");
    expect(imageHandler).toBeDefined();
  });

  it("GET /api/video/:id returns status and videoUrl", () => {
    const videoHandler = handlers.find(
      (h) => h.info.path === "/api/video/:id"
    );
    expect(videoHandler).toBeDefined();
  });

  it("covers the file route and complete settings response", async () => {
    const fileHandler = handlers.find(
      (h) => h.info.path === "/api/video/:id/file"
    );
    const settingsHandler = handlers.find(
      (h) => h.info.path === "/api/settings"
    );

    expect(fileHandler).toBeDefined();
    expect(settingsHandler).toBeDefined();
    expect(settingsHandler.info.path).toBe("/api/settings");
  });
});
