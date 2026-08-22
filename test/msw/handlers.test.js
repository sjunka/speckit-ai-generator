import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "./handlers";
import { PHOTO_DATA_URL } from "../fixtures.js";

// The handlers are the seam Bloques A and B test against: they never call the
// real routes, so a handler that disagrees with the plan's HTTP table gives
// green tests and a broken app. These cases are that table, row by row.
const server = setupServer(...handlers);

// The handlers are declared with relative paths, which MSW resolves against
// the document's origin — the same origin the screens fetch from.
const ORIGIN = location.origin;

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const get = (path) => fetch(`${ORIGIN}${path}`);

const post = (path, body) =>
  fetch(`${ORIGIN}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("MSW handlers", () => {
  it("includes handlers for all four API routes", () => {
    const paths = handlers.map((h) => h.info.path);
    expect(paths).toContain("/api/image");
    expect(paths).toContain("/api/video");
  });

  it("covers the routes this feature adds", () => {
    const paths = handlers.map((h) => h.info.path);
    expect(paths).toContain("/api/gallery");
    expect(paths).toContain("/api/wall");
    expect(paths).toContain("/api/generation/:id/publish");
  });

  it("GET /api/video/:id returns status and videoUrl", async () => {
    const response = await get("/api/video/job-12345");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ready",
      videoUrl: "https://blob.test/video-1.mp4",
    });
  });

  it("covers the file route and the complete settings response", async () => {
    const file = await get("/api/video/job-12345/file");
    expect(file.headers.get("Content-Type")).toBe("video/mp4");

    const settings = await get("/api/settings");
    await expect(settings.json()).resolves.toEqual({ enabled: true, videoQuality: "lite" });
  });
});

describe("POST /api/image", () => {
  it("answers 200 with an imageUrl for a happy generation", async () => {
    const response = await post("/api/image", {
      photo: PHOTO_DATA_URL,
      emotion: "happy",
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      imageUrl: "https://blob.test/image-1.png",
    });
  });

  it("answers 200 for a levelled generation", async () => {
    const response = await post("/api/image", {
      photo: PHOTO_DATA_URL,
      emotion: "angry",
      level: "quite",
    });

    expect(response.status).toBe(200);
  });

  // The request body changed with this feature: hint is gone and is not read.
  it("answers 400 Unknown emotion for a hint-shaped body", async () => {
    const response = await post("/api/image", { photo: PHOTO_DATA_URL, hint: "happy" });

    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toBe("Unknown emotion");
  });

  it("answers 400 with the validator's message for every invalid combination", async () => {
    const cases = [
      [{ emotion: "excited" }, "Unknown emotion"],
      [{ emotion: "angry" }, "Unknown level"],
      [{ emotion: "sad", level: "a lot" }, "Unknown level"],
      [{ emotion: "happy", level: "quite" }, "happy takes no level"],
    ];

    for (const [body, message] of cases) {
      const response = await post("/api/image", { photo: PHOTO_DATA_URL, ...body });

      expect(response.status).toBe(400);
      await expect(response.text()).resolves.toBe(message);
    }
  });
});

describe("GET /api/gallery", () => {
  it("answers 200 with items, hasMore and the page", async () => {
    const response = await get("/api/gallery");
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(Object.keys(body).sort()).toEqual(["hasMore", "items", "page"]);
    expect(body.page).toBe(0);
    expect(body.items.length).toBeGreaterThan(0);
  });

  it("serves the requested page as an integer", async () => {
    const body = await (await get("/api/gallery?page=2")).json();

    expect(body.page).toBe(2);
    expect(typeof body.page).toBe("number");
  });

  it("serves a later page that differs from the first", async () => {
    const first = await (await get("/api/gallery?page=0")).json();
    const second = await (await get("/api/gallery?page=1")).json();

    expect(first.hasMore).toBe(true);
    expect(second.items.map((i) => i.id)).not.toEqual(first.items.map((i) => i.id));
    expect(second.hasMore).toBe(false);
  });

  it("returns items in the Item shape and never a userId", async () => {
    const { items } = await (await get("/api/gallery")).json();

    for (const item of items) {
      expect(Object.keys(item).sort()).toEqual([
        "createdAt",
        "emotion",
        "id",
        "isPublic",
        "kind",
        "level",
        "status",
        "url",
      ]);
    }
  });

  it("answers 400 Invalid page for a page that is not a non-negative integer", async () => {
    for (const page of ["abc", "-1", "1.5", ""]) {
      const response = await get(`/api/gallery?page=${page}`);

      expect(response.status).toBe(400);
      await expect(response.text()).resolves.toBe("Invalid page");
    }
  });
});

describe("GET /api/wall", () => {
  it("answers 200 with items, hasMore and the page, with no session", async () => {
    const response = await get("/api/wall");
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(Object.keys(body).sort()).toEqual(["hasMore", "items", "page"]);
    expect(body.page).toBe(0);
  });

  it("serves published generations only", async () => {
    const { items } = await (await get("/api/wall")).json();

    expect(items.length).toBeGreaterThan(0);
    for (const item of items) expect(item.isPublic).toBe(true);
  });

  it("serves the requested page and reports the end of the list", async () => {
    const second = await (await get("/api/wall?page=1")).json();

    expect(second.page).toBe(1);
    expect(second.hasMore).toBe(false);
  });

  it("answers 400 Invalid page under the same rule as the gallery", async () => {
    const response = await get("/api/wall?page=abc");

    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toBe("Invalid page");
  });
});

describe("POST /api/generation/:id/publish", () => {
  const ID = "6702a1b2c3d4e5f601020304";

  it("answers 200 with the id and the flag when publishing", async () => {
    const response = await post(`/api/generation/${ID}/publish`, { isPublic: true });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ id: ID, isPublic: true });
  });

  it("answers 200 when unpublishing", async () => {
    const response = await post(`/api/generation/${ID}/publish`, { isPublic: false });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ id: ID, isPublic: false });
  });

  it("answers 400 Invalid isPublic when the flag is missing or not a boolean", async () => {
    for (const body of [{}, { isPublic: "true" }, { isPublic: 1 }, { isPublic: null }]) {
      const response = await post(`/api/generation/${ID}/publish`, body);

      expect(response.status).toBe(400);
      await expect(response.text()).resolves.toBe("Invalid isPublic");
    }
  });
});
