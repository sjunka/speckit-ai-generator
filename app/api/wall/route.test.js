import { describe, it, expect, vi, beforeEach } from "vitest";
import { ITEM_IMAGE, ITEM_PRE_002 } from "@/test/fixtures.js";

// Mocked only so the test can assert it is never called: the wall has no 401
// row and its absence is deliberate (FR-018).
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/generations.js", () => ({ listPublic: vi.fn() }));

const published = (item) => ({ ...item, isPublic: true });

const get = (query = "") => new Request(`http://test/api/wall${query}`);

const load = async () => {
  const { auth } = await import("@clerk/nextjs/server");
  const { listPublic } = await import("@/lib/generations.js");
  const { GET } = await import("./route.js");
  return { GET, auth, listPublic };
};

beforeEach(async () => {
  vi.clearAllMocks();
  const { auth, listPublic } = await load();
  // No session at all, for every case in this file.
  auth.mockResolvedValue({ userId: null });
  listPublic.mockResolvedValue({
    items: [published(ITEM_IMAGE), published(ITEM_PRE_002)],
    hasMore: true,
  });
});

describe("GET /api/wall", () => {
  it("returns 200 with items, hasMore and a page defaulting to 0 for a caller with no session", async () => {
    const { GET, listPublic } = await load();

    const response = await GET(get());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      items: [published(ITEM_IMAGE), published(ITEM_PRE_002)],
      hasMore: true,
      page: 0,
    });
    expect(listPublic).toHaveBeenCalledWith(0);
  });

  // FR-018, SC-004.
  it("never calls auth(), never returns 401 and never redirects", async () => {
    const { GET, auth } = await load();

    const response = await GET(get());

    expect(auth).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(response.status).not.toBe(401);
    expect(response.headers.get("location")).toBeNull();
  });

  it("passes ?page=N to listPublic as an integer and echoes it", async () => {
    const { GET, listPublic } = await load();

    const response = await GET(get("?page=3"));

    expect(listPublic).toHaveBeenCalledWith(3);
    expect(listPublic.mock.calls[0][0]).toBe(3);
    expect(listPublic.mock.calls[0]).toHaveLength(1);
    await expect(response.json()).resolves.toMatchObject({ page: 3 });
  });

  it("returns 400 'Invalid page' for a non-numeric page and reads nothing", async () => {
    const { GET, listPublic } = await load();

    const response = await GET(get("?page=abc"));

    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toBe("Invalid page");
    expect(listPublic).not.toHaveBeenCalled();
  });

  it("returns 400 'Invalid page' for a negative page and reads nothing", async () => {
    const { GET, listPublic } = await load();

    const response = await GET(get("?page=-1"));

    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toBe("Invalid page");
    expect(listPublic).not.toHaveBeenCalled();
  });

  it("serves only published generations", async () => {
    const { GET } = await load();

    const response = await GET(get());

    const { items } = await response.json();
    expect(items).not.toHaveLength(0);
    expect(items.every((item) => item.isPublic === true)).toBe(true);
  });

  it("returns 200 with an empty items array for a page past the last one", async () => {
    const { GET, listPublic } = await load();
    listPublic.mockResolvedValue({ items: [], hasMore: false });

    const response = await GET(get("?page=99"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ items: [], hasMore: false, page: 99 });
  });
});
