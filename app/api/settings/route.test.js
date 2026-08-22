import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET, PATCH } from "./route.js";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db.js");
vi.mock("@/lib/settings.js");

describe("/api/settings", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns 404 for anonymous and non-owner callers", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    const { isOwner } = await import("@/lib/settings.js");
    auth.mockResolvedValueOnce({ userId: null }).mockResolvedValueOnce({ userId: "other" });
    isOwner.mockReturnValue(false);

    expect((await GET()).status).toBe(404);
    expect((await GET()).status).toBe(404);
  });

  it("returns settings to the owner", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    const { isOwner, getSettings } = await import("@/lib/settings.js");
    auth.mockResolvedValue({ userId: "owner" });
    isOwner.mockReturnValue(true);
    getSettings.mockResolvedValue({ enabled: true, videoQuality: "lite" });

    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ enabled: true, videoQuality: "lite" });
  });

  it("persists a partial update without putting _id in $set", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    const { isOwner } = await import("@/lib/settings.js");
    const { db } = await import("@/lib/db.js");
    auth.mockResolvedValue({ userId: "owner" });
    isOwner.mockReturnValue(true);
    const settings = { findOne: vi.fn().mockResolvedValue({ _id: "config", enabled: true, videoQuality: "turbo" }), updateOne: vi.fn() };
    db.mockResolvedValue({ db: vi.fn().mockReturnValue({ collection: vi.fn().mockReturnValue(settings) }) });

    const response = await PATCH(new Request("http://localhost/api/settings", { method: "PATCH", body: JSON.stringify({ enabled: false }) }));
    expect(response.status).toBe(200);
    expect(settings.updateOne).toHaveBeenCalledWith(
      { _id: "config" },
      { $set: { enabled: false, videoQuality: "turbo" } },
      { upsert: true }
    );
  });

  it("uses lite as the default quality on the first write", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    const { isOwner } = await import("@/lib/settings.js");
    const { db } = await import("@/lib/db.js");
    auth.mockResolvedValue({ userId: "owner" });
    isOwner.mockReturnValue(true);
    const settings = { findOne: vi.fn().mockResolvedValue(null), updateOne: vi.fn() };
    db.mockResolvedValue({ db: vi.fn().mockReturnValue({ collection: vi.fn().mockReturnValue(settings) }) });

    const response = await PATCH(new Request("http://localhost/api/settings", { method: "PATCH", body: JSON.stringify({ enabled: false }) }));
    expect(response.status).toBe(200);
    expect(settings.updateOne.mock.calls[0][1].$set).toEqual({ enabled: false, videoQuality: "lite" });
  });
});
