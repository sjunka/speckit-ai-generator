import { describe, it, expect, vi, beforeEach } from "vitest";
import { ITEM_IMAGE, ITEM_PENDING_VIDEO } from "@/test/fixtures.js";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/generations.js", () => ({ listByUser: vi.fn() }));

const get = (query = "") => new Request(`http://test/api/gallery${query}`);

const load = async () => {
  const { auth } = await import("@clerk/nextjs/server");
  const { listByUser } = await import("@/lib/generations.js");
  const { GET } = await import("./route.js");
  return { GET, auth, listByUser };
};

beforeEach(async () => {
  vi.clearAllMocks();
  const { auth, listByUser } = await load();
  auth.mockResolvedValue({ userId: "user-1" });
  listByUser.mockResolvedValue({ items: [ITEM_IMAGE, ITEM_PENDING_VIDEO], hasMore: true });
});

describe("GET /api/gallery", () => {
  it("returns 200 with items, hasMore and a page defaulting to 0", async () => {
    const { GET, listByUser } = await load();

    const response = await GET(get());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      items: [ITEM_IMAGE, ITEM_PENDING_VIDEO],
      hasMore: true,
      page: 0,
    });
    expect(listByUser).toHaveBeenCalledWith("user-1", 0);
  });

  it("passes ?page=2 to the module as the integer 2", async () => {
    const { GET, listByUser } = await load();

    const response = await GET(get("?page=2"));

    expect(response.status).toBe(200);
    expect(listByUser).toHaveBeenCalledWith("user-1", 2);
    expect(listByUser.mock.calls[0][1]).toBe(2);
    await expect(response.json()).resolves.toMatchObject({ page: 2 });
  });

  // Trap 6: a NaN that becomes skip: NaN reads as an empty page, which looks
  // exactly like the end of the list.
  it("returns 400 'Invalid page' for a non-numeric page and reads nothing", async () => {
    const { GET, listByUser } = await load();

    const response = await GET(get("?page=abc"));

    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toBe("Invalid page");
    expect(listByUser).not.toHaveBeenCalled();
  });

  it("returns 400 'Invalid page' for a negative page and reads nothing", async () => {
    const { GET, listByUser } = await load();

    const response = await GET(get("?page=-1"));

    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toBe("Invalid page");
    expect(listByUser).not.toHaveBeenCalled();
  });

  // FR-003: checked by the route itself, not trusted to the route matcher.
  it("returns 401 'Unauthorized' when there is no session, and reads nothing", async () => {
    const { GET, auth, listByUser } = await load();
    auth.mockResolvedValue({ userId: null });

    const response = await GET(get());

    expect(response.status).toBe(401);
    await expect(response.text()).resolves.toBe("Unauthorized");
    expect(listByUser).not.toHaveBeenCalled();
  });

  it("calls auth() itself rather than trusting the route matcher", async () => {
    const { GET, auth } = await load();

    await GET(get());

    expect(auth).toHaveBeenCalled();
  });

  // FR-002, SC-001: the userId comes from the session and never from the request.
  it("always lists the session's own userId, never one from the request", async () => {
    const { GET, listByUser } = await load();

    await GET(get("?page=0&userId=somebody-else"));

    expect(listByUser).toHaveBeenCalledWith("user-1", 0);
    expect(JSON.stringify(listByUser.mock.calls)).not.toContain("somebody-else");
  });

  it("returns 200 with an empty items array for a page past the last one", async () => {
    const { GET, listByUser } = await load();
    listByUser.mockResolvedValue({ items: [], hasMore: false });

    const response = await GET(get("?page=99"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ items: [], hasMore: false, page: 99 });
  });
});
