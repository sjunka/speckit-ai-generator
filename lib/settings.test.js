import { describe, it, expect, beforeEach, vi } from "vitest";
import { getSettings, assertEnabled, isOwner } from "./settings.js";

vi.mock("./db.js");

describe("lib/settings.js", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.OWNER_ID = "owner-user-123";
  });

  it("returns stored settings and fills a missing quality default", async () => {
    const { db } = await import("./db.js");
    db.mockResolvedValue({ db: () => ({ collection: () => ({ findOne: vi.fn().mockResolvedValue({ enabled: false }) }) }) });

    await expect(getSettings()).resolves.toEqual({ enabled: false, videoQuality: "lite" });
  });

  it("returns enabled lite defaults when no record exists", async () => {
    const { db } = await import("./db.js");
    db.mockResolvedValue({ db: () => ({ collection: () => ({ findOne: vi.fn().mockResolvedValue(null) }) }) });

    await expect(getSettings()).resolves.toEqual({ enabled: true, videoQuality: "lite" });
  });

  it("throws a 503 pause error only when generation is disabled", async () => {
    const { db } = await import("./db.js");
    db.mockResolvedValue({ db: () => ({ collection: () => ({ findOne: vi.fn().mockResolvedValue({ enabled: false }) }) }) });

    await expect(assertEnabled()).rejects.toMatchObject({ status: 503, message: "Generation is paused" });
  });

  it("passes when generation is enabled or settings are absent", async () => {
    const { db } = await import("./db.js");
    db.mockResolvedValue({ db: () => ({ collection: () => ({ findOne: vi.fn().mockResolvedValue(null) }) }) });

    await expect(assertEnabled()).resolves.toBeUndefined();
  });

  it("compares the caller to OWNER_ID", () => {
    expect(isOwner("owner-user-123")).toBe(true);
    expect(isOwner("other-user")).toBe(false);
    expect(isOwner(undefined)).toBe(false);
  });
});
