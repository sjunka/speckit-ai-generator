import { http, HttpResponse } from "msw";
import { buildHint } from "@/lib/emotions.js";
import { ITEM_IMAGE, ITEM_PENDING_VIDEO, ITEM_PRE_002 } from "../fixtures.js";

// `page` arrives as a string. Anything that is not a non-negative integer is a
// 400 here exactly as in the route, so a NaN never becomes an empty page that
// looks like the end of the list.
const parsePage = (request) => {
  const raw = new URL(request.url).searchParams.get("page");
  if (raw === null) return 0;
  return /^\d+$/.test(raw) ? Number(raw) : null;
};

const invalidPage = () => new HttpResponse("Invalid page", { status: 400 });

// Page 0 serves the fixtures and reports more; every later page serves one
// distinguishable item and reports the end, which is all "Load more" needs.
const pageOf = (items, page) =>
  page === 0
    ? { items, hasMore: true, page }
    : { items: [{ ...items[0], id: `${items[0].id}-page-${page}` }], hasMore: false, page };

const published = (item) => ({ ...item, isPublic: true });

export const handlers = [
  http.post("/api/image", async ({ request }) => {
    const { photo, emotion, level } = await request.json();

    try {
      buildHint(emotion, level);
    } catch (error) {
      return new HttpResponse(error.message, { status: error.status });
    }

    return HttpResponse.json(
      { imageUrl: "https://blob.test/image-1.png" },
      { status: 200 }
    );
  }),

  http.get("/api/gallery", ({ request }) => {
    const page = parsePage(request);
    if (page === null) return invalidPage();

    return HttpResponse.json(
      pageOf([ITEM_IMAGE, ITEM_PENDING_VIDEO, ITEM_PRE_002], page),
      { status: 200 }
    );
  }),

  // No 401 row: a visitor with no session gets the wall (FR-018).
  http.get("/api/wall", ({ request }) => {
    const page = parsePage(request);
    if (page === null) return invalidPage();

    return HttpResponse.json(
      pageOf([published(ITEM_IMAGE), published(ITEM_PRE_002)], page),
      { status: 200 }
    );
  }),

  http.post("/api/generation/:id/publish", async ({ request, params }) => {
    const { isPublic } = await request.json();

    if (typeof isPublic !== "boolean") {
      return new HttpResponse("Invalid isPublic", { status: 400 });
    }

    return HttpResponse.json({ id: params.id, isPublic }, { status: 200 });
  }),

  http.post("/api/video", async ({ request }) => {
    const { imageUrl } = await request.json();
    return HttpResponse.json(
      { jobId: "job-12345" },
      { status: 200 }
    );
  }),

  http.get("/api/video/:id", ({ params }) => {
    return HttpResponse.json(
      { status: "ready", videoUrl: "https://blob.test/video-1.mp4" },
      { status: 200 }
    );
  }),

  http.get("/api/video/:id/file", () => {
    return new HttpResponse("video-bytes", {
      status: 200,
      headers: { "Content-Type": "video/mp4" },
    });
  }),

  http.get("/api/settings", () => {
    return HttpResponse.json({ enabled: true, videoQuality: "lite" }, { status: 200 });
  }),

  http.patch("/api/settings", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ enabled: true, ...body }, { status: 200 });
  }),
];
