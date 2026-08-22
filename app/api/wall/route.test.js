import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "./route.js";
import { ITEM_IMAGE, ITEM_PRE_002 } from "@/test/fixtures.js";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/generations.js", () => ({ listByUser: vi.fn(), listPublic: vi.fn() }));

const request = (url = "http://localhost/api/wall") => new Request(url);

const PUBLISHED = [
  { ...ITEM_IMAGE, isPublic: true },
  { ...ITEM_PRE_002, isPublic: true },
];

describe("GET /api/wall", () => {
  beforeEach(() => vi.resetAllMocks());

  it("serves the first page to a caller with no session at all", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    const { listPublic } = await import("@/lib/generations.js");
    listPublic.mockResolvedValue({ items: PUBLISHED, hasMore: false });

    const response = await GET(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      items: PUBLISHED,
      hasMore: false,
      page: 0,
    });
    // No 401 row exists on this contract, and its absence is deliberate.
    expect(auth).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBeNull();
  });

  it("returns only published generations", async () => {
    const { listPublic } = await import("@/lib/generations.js");
    listPublic.mockResolvedValue({ items: PUBLISHED, hasMore: false });

    const { items } = await (await GET(request())).json();

    expect(items).toHaveLength(2);
    expect(items.every((item) => item.isPublic === true)).toBe(true);
  });

  it("passes ?page=3 through as the integer 3 and nothing else", async () => {
    const { listPublic } = await import("@/lib/generations.js");
    listPublic.mockResolvedValue({ items: [], hasMore: false });

    const response = await GET(request("http://localhost/api/wall?page=3"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ page: 3 });
    expect(listPublic).toHaveBeenCalledWith(3);
    expect(listPublic.mock.calls[0]).toEqual([3]);
  });

  it.each(["abc", "-1", "1.5", ""])("rejects ?page=%s with 400 Invalid page", async (page) => {
    const { listPublic } = await import("@/lib/generations.js");

    const response = await GET(request(`http://localhost/api/wall?page=${page}`));

    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toBe("Invalid page");
    expect(listPublic).not.toHaveBeenCalled();
  });

  it("answers a page past the last one with 200 and an empty list", async () => {
    const { listPublic } = await import("@/lib/generations.js");
    listPublic.mockResolvedValue({ items: [], hasMore: false });

    const response = await GET(request("http://localhost/api/wall?page=99"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ items: [], hasMore: false, page: 99 });
  });

  it("reports a failed read as a 500 carrying the message", async () => {
    const { listPublic } = await import("@/lib/generations.js");
    listPublic.mockRejectedValue(new Error("database is down"));

    const response = await GET(request());

    expect(response.status).toBe(500);
    await expect(response.text()).resolves.toBe("database is down");
  });
});
