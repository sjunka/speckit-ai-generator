import { describe, it, expect, vi, beforeEach } from "vitest";
import { FakeCollection } from "@/test/mongo-fake.js";
import { VIDEO_URL, PROVIDER_JOB_ID } from "@/test/fixtures.js";

vi.mock("@/lib/db.js", () => ({ generations: vi.fn() }));
vi.mock("@/lib/higgsfield.js", () => ({ getVideo: vi.fn() }));

const get = (id) => [new Request(`http://test/api/video/${id}`), { params: { id } }];

let collection;

const load = async () => {
  const mocks = {
    ...(await import("@/lib/db.js")),
    ...(await import("@/lib/higgsfield.js")),
  };
  const { GET } = await import("./route.js");
  return { GET, ...mocks };
};

const seed = (overrides = {}) =>
  collection.insertOne({
    userId: "user-1",
    kind: "video",
    status: "pending",
    jobId: PROVIDER_JOB_ID,
    ...overrides,
  });

beforeEach(async () => {
  vi.clearAllMocks();
  collection = new FakeCollection();
  const { generations } = await load();
  generations.mockResolvedValue(collection);
});

describe("GET /api/video/[id]", () => {
  it("reports pending while the provider is still rendering", async () => {
    const { GET, getVideo } = await load();
    await seed();
    getVideo.mockResolvedValue({ status: "pending" });

    const response = await GET(...get(PROVIDER_JOB_ID));

    await expect(response.json()).resolves.toEqual({ status: "pending" });
  });

  it("persists and returns the url the first time the render is complete", async () => {
    const { GET, getVideo } = await load();
    await seed();
    getVideo.mockResolvedValue({ status: "ready", videoUrl: VIDEO_URL });

    const response = await GET(...get(PROVIDER_JOB_ID));

    await expect(response.json()).resolves.toEqual({ status: "ready", videoUrl: VIDEO_URL });
    expect(collection.docs[0]).toMatchObject({ status: "ready", url: VIDEO_URL });
  });

  it("serves a second read from the record without contacting the provider", async () => {
    const { GET, getVideo } = await load();
    await seed({ status: "ready", url: VIDEO_URL });

    const response = await GET(...get(PROVIDER_JOB_ID));

    await expect(response.json()).resolves.toEqual({ status: "ready", videoUrl: VIDEO_URL });
    expect(getVideo).not.toHaveBeenCalled();
  });

  it("updates the record to failed when the render fails", async () => {
    const { GET, getVideo } = await load();
    await seed();
    getVideo.mockResolvedValue({ status: "failed" });

    const response = await GET(...get(PROVIDER_JOB_ID));

    await expect(response.json()).resolves.toEqual({ status: "failed" });
    expect(collection.docs[0].status).toBe("failed");
  });

  it("returns 404 for an unknown job id", async () => {
    const { GET, getVideo } = await load();

    const response = await GET(...get("nope"));

    expect(response.status).toBe(404);
    expect(getVideo).not.toHaveBeenCalled();
  });

  it("returns the status normally while generation is paused", async () => {
    const { GET, getVideo } = await load();
    await seed();
    getVideo.mockResolvedValue({ status: "pending" });

    // No settings module is involved at all — the kill switch cannot reach this route.
    const response = await GET(...get(PROVIDER_JOB_ID));

    expect(response.status).toBe(200);
  });
});
