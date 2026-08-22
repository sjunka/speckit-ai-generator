import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET, PATCH } from "./route.js";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db.js");
vi.mock("@/lib/settings.js");

describe("GET /api/settings", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 404 for anonymous caller", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    auth.mockReturnValue({ userId: null });

    const response = await GET();
    expect(response.status).toBe(404);
  });

  it("returns 404 for non-owner", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    const { isOwner } = await import("@/lib/settings.js");
    auth.mockReturnValue({ userId: "other-user" });
    isOwner.mockReturnValue(false);

    const response = await GET();
    expect(response.status).toBe(404);
  });

  it("returns settings for owner", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    const { isOwner, getSettings } = await import("@/lib/settings.js");
    auth.mockReturnValue({ userId: "owner-id" });
    isOwner.mockReturnValue(true);
    getSettings.mockResolvedValue({ enabled: true });

    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.enabled).toBe(true);
  });
});

describe("PATCH /api/settings", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 404 for anonymous caller", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    auth.mockReturnValue({ userId: null });

    const request = new Request("http://localhost/api/settings", {
      method: "PATCH",
      body: JSON.stringify({ enabled: false }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(404);
  });

  it("returns 404 for non-owner", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    const { isOwner } = await import("@/lib/settings.js");
    auth.mockReturnValue({ userId: "other-user" });
    isOwner.mockReturnValue(false);

    const request = new Request("http://localhost/api/settings", {
      method: "PATCH",
      body: JSON.stringify({ enabled: false }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(404);
  });

  it("persists partial update", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    const { isOwner, getSettings } = await import("@/lib/settings.js");
    const { db } = await import("@/lib/db.js");

    auth.mockReturnValue({ userId: "owner-id" });
    isOwner.mockReturnValue(true);
    getSettings.mockResolvedValue({ enabled: true });

    const mockSettings = { findOne: vi.fn(), updateOne: vi.fn() };
    db.mockResolvedValue({
      collection: vi.fn().mockReturnValue(mockSettings),
    });
    mockSettings.findOne.mockResolvedValue({ enabled: true });
    mockSettings.updateOne.mockResolvedValue({ modifiedCount: 1 });

    const request = new Request("http://localhost/api/settings", {
      method: "PATCH",
      body: JSON.stringify({ enabled: false }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(200);
  });

  it("creates record on first write with defaults", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    const { isOwner } = await import("@/lib/settings.js");
    const { db } = await import("@/lib/db.js");

    auth.mockReturnValue({ userId: "owner-id" });
    isOwner.mockReturnValue(true);

    const mockSettings = { findOne: vi.fn(), updateOne: vi.fn() };
    db.mockResolvedValue({
      collection: vi.fn().mockReturnValue(mockSettings),
    });
    mockSettings.findOne.mockResolvedValue(null);
    mockSettings.updateOne.mockResolvedValue({ modifiedCount: 0, upsertedCount: 1 });

    const request = new Request("http://localhost/api/settings", {
      method: "PATCH",
      body: JSON.stringify({ enabled: false }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(200);
  });
});
