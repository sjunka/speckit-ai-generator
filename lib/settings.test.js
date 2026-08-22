import { describe, it, expect, beforeEach, vi } from "vitest";
import { getSettings, assertEnabled, isOwner } from "./settings.js";

vi.mock("./db.js");

describe("lib/settings.js", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.OWNER_ID = "owner-user-123";
  });

  describe("getSettings", () => {
    it("returns stored settings when record exists", async () => {
      const { db } = await import("./db.js");
      const mockRecord = { enabled: false, videoQuality: "turbo" };
      db.mockResolvedValue({
        collection: () => ({
          findOne: vi.fn().mockResolvedValue(mockRecord),
        }),
      });

      const settings = await getSettings();
      expect(settings).toEqual(mockRecord);
    });

    it("defaults videoQuality to lite when a stored record omits it", async () => {
      const { db } = await import("./db.js");
      db.mockResolvedValue({
        collection: () => ({
          findOne: vi.fn().mockResolvedValue({ enabled: false }),
        }),
      });

      const settings = await getSettings();
      expect(settings.videoQuality).toBe("lite");
    });

    it("returns default settings when no record exists", async () => {
      const { db } = await import("./db.js");
      db.mockResolvedValue({
        collection: () => ({
          findOne: vi.fn().mockResolvedValue(null),
        }),
      });

      const settings = await getSettings();
      expect(settings.enabled).toBe(true);
      expect(settings.videoQuality).toBe("lite");
    });
  });

  describe("assertEnabled", () => {
    it("throws 503 when disabled", async () => {
      const { db } = await import("./db.js");
      db.mockResolvedValue({
        collection: () => ({
          findOne: vi.fn().mockResolvedValue({ enabled: false }),
        }),
      });

      try {
        await assertEnabled();
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error.status).toBe(503);
        expect(error.message).toContain("Generation is paused");
      }
    });

    it("passes through when enabled", async () => {
      const { db } = await import("./db.js");
      db.mockResolvedValue({
        collection: () => ({
          findOne: vi.fn().mockResolvedValue({ enabled: true }),
        }),
      });

      await expect(assertEnabled()).resolves.toBeUndefined();
    });

    it("passes through when no settings exist (default enabled)", async () => {
      const { db } = await import("./db.js");
      db.mockResolvedValue({
        collection: () => ({
          findOne: vi.fn().mockResolvedValue(null),
        }),
      });

      await expect(assertEnabled()).resolves.toBeUndefined();
    });
  });

  describe("isOwner", () => {
    it("returns true for owner user id", () => {
      expect(isOwner("owner-user-123")).toBe(true);
    });

    it("returns false for non-owner user id", () => {
      expect(isOwner("other-user-456")).toBe(false);
    });

    it("returns false for undefined user id", () => {
      expect(isOwner(undefined)).toBe(false);
    });
  });
});
