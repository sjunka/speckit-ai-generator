import { describe, it, expect, vi, beforeEach } from "vitest";
import { FakeCollection } from "@/test/mongo-fake.js";
import { BLOB_URL, PROVIDER_JOB_ID } from "@/test/fixtures.js";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db.js", () => ({ generations: vi.fn() }));
vi.mock("@/lib/settings.js", () => ({ assertEnabled: vi.fn(), getSettings: vi.fn() }));
vi.mock("@/lib/higgsfield.js", () => ({ startVideo: vi.fn() }));

const post = (body) =>
  new Request("http://test/api/video", { method: "POST", body: JSON.stringify(body) });

let collection;

const load = async () => {
  const mocks = {
    ...(await import("@clerk/nextjs/server")),
    ...(await import("@/lib/db.js")),
    ...(await import("@/lib/settings.js")),
    ...(await import("@/lib/higgsfield.js")),
  };
  const { POST } = await import("./route.js");
  return { POST, ...mocks };
};

beforeEach(async () => {
  vi.clearAllMocks();
  collection = new FakeCollection();

  const { auth, generations, assertEnabled, getSettings, startVideo } = await load();
  auth.mockResolvedValue({ userId: "user-1" });
  generations.mockResolvedValue(collection);
  assertEnabled.mockResolvedValue(undefined);
  getSettings.mockResolvedValue({ enabled: true, videoQuality: "lite" });
  startVideo.mockResolvedValue(PROVIDER_JOB_ID);
});

describe("POST /api/video", () => {
  it("returns 200 with a jobId and records a pending job carrying the provider's id", async () => {
    const { POST } = await load();

    const response = await POST(post({ imageUrl: BLOB_URL }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ jobId: PROVIDER_JOB_ID });
    expect(collection.docs[0]).toMatchObject({
      userId: "user-1",
      kind: "video",
      status: "pending",
      jobId: PROVIDER_JOB_ID,
    });
  });

  it("starts the video at the configured quality", async () => {
    const { POST, getSettings, startVideo } = await load();
    getSettings.mockResolvedValue({ enabled: true, videoQuality: "turbo" });

    await POST(post({ imageUrl: BLOB_URL }));

    expect(startVideo).toHaveBeenCalledWith(BLOB_URL, "turbo");
  });

  it("returns 401 for an anonymous caller and starts no render", async () => {
    const { POST, auth, startVideo } = await load();
    auth.mockResolvedValue({ userId: null });

    const response = await POST(post({ imageUrl: BLOB_URL }));

    expect(response.status).toBe(401);
    expect(startVideo).not.toHaveBeenCalled();
    expect(collection.docs).toHaveLength(0);
  });

  it("returns 503 when generation is paused", async () => {
    const { POST, assertEnabled, startVideo } = await load();
    const paused = new Error("Generation is paused");
    paused.status = 503;
    assertEnabled.mockRejectedValue(paused);

    const response = await POST(post({ imageUrl: BLOB_URL }));

    expect(response.status).toBe(503);
    expect(startVideo).not.toHaveBeenCalled();
  });
});
