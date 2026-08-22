import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "./route.js";
import { ITEM_IMAGE, ITEM_PRE_002 } from "@/test/fixtures.js";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/generations.js", () => ({ listByUser: vi.fn(), listPublic: vi.fn() }));

const request = (url = "http://localhost/api/gallery") => new Request(url);

describe("GET /api/gallery", () => {
  beforeEach(() => vi.resetAllMocks());

  const signedIn = async (userId = "user-1") => {
    const { auth } = await import("@clerk/nextjs/server");
    auth.mockResolvedValue({ userId });
  };

  it("returns the first page with page defaulting to 0", async () => {
    await signedIn();
    const { listByUser } = await import("@/lib/generations.js");
    listByUser.mockResolvedValue({ items: [ITEM_IMAGE, ITEM_PRE_002], hasMore: true });

    const response = await GET(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      items: [ITEM_IMAGE, ITEM_PRE_002],
      hasMore: true,
      page: 0,
    });
    expect(listByUser).toHaveBeenCalledWith("user-1", 0);
  });

  it("passes ?page=2 through as the integer 2", async () => {
    await signedIn();
    const { listByUser } = await import("@/lib/generations.js");
    listByUser.mockResolvedValue({ items: [], hasMore: false });

    const response = await GET(request("http://localhost/api/gallery?page=2"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ page: 2 });
    expect(listByUser).toHaveBeenCalledWith("user-1", 2);
    expect(listByUser.mock.calls[0][1]).toBe(2);
  });

  // A NaN page would become skip: NaN and read as the end of the list.
  it.each(["abc", "-1", "1.5", ""])("rejects ?page=%s with 400 Invalid page", async (page) => {
    await signedIn();
    const { listByUser } = await import("@/lib/generations.js");

    const response = await GET(request(`http://localhost/api/gallery?page=${page}`));

    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toBe("Invalid page");
    expect(listByUser).not.toHaveBeenCalled();
  });

  it("refuses an anonymous caller with 401 without reading anything", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    auth.mockResolvedValue({ userId: null });
    const { listByUser } = await import("@/lib/generations.js");

    const response = await GET(request());

    expect(response.status).toBe(401);
    await expect(response.text()).resolves.toBe("Unauthorized");
    expect(listByUser).not.toHaveBeenCalled();
  });

  it("always reads the session's own userId and never one from the request", async () => {
    await signedIn("mine");
    const { listByUser } = await import("@/lib/generations.js");
    listByUser.mockResolvedValue({ items: [], hasMore: false });

    await GET(request("http://localhost/api/gallery?userId=someone-else&user=someone-else"));

    expect(listByUser).toHaveBeenCalledWith("mine", 0);
  });

  it("answers a page past the last one with 200 and an empty list", async () => {
    await signedIn();
    const { listByUser } = await import("@/lib/generations.js");
    listByUser.mockResolvedValue({ items: [], hasMore: false });

    const response = await GET(request("http://localhost/api/gallery?page=99"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ items: [], hasMore: false, page: 99 });
  });

  it("reports a failed read as a 500 carrying the message", async () => {
    await signedIn();
    const { listByUser } = await import("@/lib/generations.js");
    listByUser.mockRejectedValue(new Error("database is down"));

    const response = await GET(request());

    expect(response.status).toBe(500);
    await expect(response.text()).resolves.toBe("database is down");
  });
});
