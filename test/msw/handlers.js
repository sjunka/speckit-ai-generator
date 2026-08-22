import { http, HttpResponse } from "msw";

export const handlers = [
  http.post("/api/image", async ({ request }) => {
    const { photo, hint } = await request.json();
    return HttpResponse.json(
      { imageUrl: "https://blob.test/image-1.png" },
      { status: 200 }
    );
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
