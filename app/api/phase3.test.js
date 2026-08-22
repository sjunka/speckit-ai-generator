import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as createImage } from "./image/route";
import { POST as createVideo } from "./video/route";
import { GET as getVideoStatus } from "./video/[id]/route";
import { GET as getVideoFile } from "./video/[id]/file/route";

const makeRequest = (body) => new Request("http://localhost", { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({ userId: "user_123" })),
}));

vi.mock("@/lib/db", () => ({
  db: vi.fn(async () => ({ db: () => ({ collection: () => fakeCollection }) })),
  generations: vi.fn(async () => fakeCollection),
}));

vi.mock("@/lib/blob", () => ({
  store: vi.fn(async (buffer, contentType) => `https://blob.test/${contentType.replace("/", ".") || "image.png"}`),
}));

vi.mock("@/lib/higgsfield", () => ({
  generateImage: vi.fn(async () => ({ buffer: Buffer.from("image-bytes"), contentType: "image/png" })),
  startVideo: vi.fn(async () => "provider-job-1"),
  getVideo: vi.fn(async () => ({ status: "ready", videoUrl: "https://blob.test/video-1.mp4" })),
}));

vi.mock("@/lib/settings", () => ({
  assertEnabled: vi.fn(async () => {}),
  getSettings: vi.fn(async () => ({ enabled: true, videoQuality: "lite" })),
}));

const fakeCollection = {
  findOne: vi.fn(),
  insertOne: vi.fn(async (doc) => ({ insertedId: doc.jobId || "doc-1" })),
  updateOne: vi.fn(async () => ({ modifiedCount: 1 })),
};

describe("phase 3 backend", () => {
  beforeEach(() => {
    fakeCollection.findOne.mockReset();
    fakeCollection.insertOne.mockClear();
    fakeCollection.updateOne.mockClear();
  });

  it("creates an image record when generation succeeds", async () => {
    const response = await createImage(makeRequest({ photo: "data:image/png;base64,AAAA", emotion: "happy" }));
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.imageUrl).toContain("https://blob.test/");
    expect(fakeCollection.insertOne).toHaveBeenCalled();
  });

  it("creates a pending video record and returns a job id", async () => {
    const response = await createVideo(makeRequest({ imageUrl: "https://blob.test/generated.png" }));
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.jobId).toBe("provider-job-1");
    expect(fakeCollection.insertOne).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "video", status: "pending", sourceUrl: "https://blob.test/generated.png" })
    );
  });

  it("reads status and returns a stored video url without re-fetching when ready", async () => {
    fakeCollection.findOne.mockResolvedValue({ jobId: "job-123", status: "ready", url: "https://blob.test/video-1.mp4" });
    const response = await getVideoStatus(new Request("http://localhost/api/video/job-123"), { params: Promise.resolve({ id: "job-123" }) });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.status).toBe("ready");
    expect(json.videoUrl).toBe("https://blob.test/video-1.mp4");
  });

  it("streams the file route when a stored video exists", async () => {
    fakeCollection.findOne.mockResolvedValue({ jobId: "job-123", url: "https://blob.test/video-1.mp4" });
    global.fetch = vi.fn(async () => ({ ok: true, body: "video-bytes", headers: new Headers({ "content-type": "video/mp4" }) }));
    const response = await getVideoFile(new Request("http://localhost/api/video/job-123/file"), { params: Promise.resolve({ id: "job-123" }) });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("video/mp4");
  });
});
