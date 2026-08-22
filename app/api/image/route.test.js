import { describe, it, expect, vi, beforeEach } from "vitest";
import { FakeCollection } from "@/test/mongo-fake.js";
import { PHOTO_DATA_URL, BLOB_URL } from "@/test/fixtures.js";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db.js", () => ({ generations: vi.fn() }));
vi.mock("@/lib/settings.js", () => ({ getSettings: vi.fn(), assertEnabled: vi.fn() }));
vi.mock("@/lib/higgsfield.js", () => ({ generateImage: vi.fn() }));
vi.mock("@/lib/blob.js", () => ({ store: vi.fn() }));

const post = (body) =>
  new Request("http://test/api/image", { method: "POST", body: JSON.stringify(body) });

let collection;

const load = async () => {
  const mocks = {
    ...(await import("@clerk/nextjs/server")),
    ...(await import("@/lib/db.js")),
    ...(await import("@/lib/settings.js")),
    ...(await import("@/lib/higgsfield.js")),
    ...(await import("@/lib/blob.js")),
  };
  const { POST } = await import("./route.js");
  return { POST, ...mocks };
};

beforeEach(async () => {
  vi.clearAllMocks();
  collection = new FakeCollection();

  const { auth, generations, getSettings, assertEnabled, generateImage, store } = await load();

  auth.mockResolvedValue({ userId: "user-1" });
  generations.mockResolvedValue(collection);
  getSettings.mockResolvedValue({ enabled: true });
  assertEnabled.mockResolvedValue(undefined);
  generateImage.mockResolvedValue({ buffer: Buffer.from("png"), contentType: "image/jpeg" });
  store.mockResolvedValue(BLOB_URL);
});

describe("POST /api/image", () => {
  it("returns 200 with the stored image url for a photo and an emotion", async () => {
    const { POST } = await load();

    const response = await POST(post({ photo: PHOTO_DATA_URL, emotion: "happy" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ imageUrl: BLOB_URL });
  });

  it("sends the composed hint for a happy request, unchanged from 001", async () => {
    const { POST, generateImage } = await load();

    await POST(post({ photo: PHOTO_DATA_URL, emotion: "happy" }));

    expect(generateImage).toHaveBeenCalledWith(BLOB_URL, "I am feeling happy 😊");
  });

  it("composes the level into the hint for a levelled emotion", async () => {
    const { POST, generateImage } = await load();

    await POST(post({ photo: PHOTO_DATA_URL, emotion: "angry", level: "quite" }));

    expect(generateImage).toHaveBeenCalledWith(BLOB_URL, "I am feeling quite angry 😠");
  });

  it("no longer reads hint from the request body", async () => {
    const { POST, generateImage } = await load();

    const response = await POST(post({ photo: PHOTO_DATA_URL, hint: "make it a watercolour" }));

    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toBe("Unknown emotion");
    expect(generateImage).not.toHaveBeenCalled();
  });

  it.each([
    ["Unknown emotion", { emotion: "smug" }],
    ["Unknown emotion", {}],
    ["Unknown level", { emotion: "sad", level: "somewhat" }],
    ["Unknown level", { emotion: "sad" }],
    ["happy takes no level", { emotion: "happy", level: "very" }],
  ])("returns 400 '%s' and spends nothing", async (message, body) => {
    const { POST, generateImage, store } = await load();

    const response = await POST(post({ photo: PHOTO_DATA_URL, ...body }));

    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toBe(message);
    expect(generateImage).not.toHaveBeenCalled();
    expect(store).not.toHaveBeenCalled();
    expect(collection.docs).toHaveLength(0);
  });

  it("returns the 400 rather than the 503 when generation is paused", async () => {
    const { POST, assertEnabled, generateImage, store } = await load();
    const paused = new Error("Generation is paused");
    paused.status = 503;
    assertEnabled.mockRejectedValue(paused);

    const response = await POST(post({ photo: PHOTO_DATA_URL, emotion: "smug" }));

    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toBe("Unknown emotion");
    expect(generateImage).not.toHaveBeenCalled();
    expect(store).not.toHaveBeenCalled();
  });

  it("writes a generations record with the user, kind, status, url and timestamp", async () => {
    const { POST } = await load();

    await POST(post({ photo: PHOTO_DATA_URL, emotion: "happy" }));

    expect(collection.docs).toHaveLength(1);
    expect(collection.docs[0]).toMatchObject({
      userId: "user-1",
      kind: "image",
      status: "ready",
      url: BLOB_URL,
    });
    expect(collection.docs[0].createdAt).toBeInstanceOf(Date);
  });

  it("returns 401 for an anonymous caller and touches no provider", async () => {
    const { POST, auth, generateImage } = await load();
    auth.mockResolvedValue({ userId: null });

    const response = await POST(post({ photo: PHOTO_DATA_URL, emotion: "happy" }));

    expect(response.status).toBe(401);
    expect(generateImage).not.toHaveBeenCalled();
  });

  it("returns 503 'Generation is paused' when the kill switch is off", async () => {
    const { POST, assertEnabled, generateImage } = await load();
    const paused = new Error("Generation is paused");
    paused.status = 503;
    assertEnabled.mockRejectedValue(paused);

    const response = await POST(post({ photo: PHOTO_DATA_URL, emotion: "happy" }));

    expect(response.status).toBe(503);
    await expect(response.text()).resolves.toBe("Generation is paused");
    expect(generateImage).not.toHaveBeenCalled();
  });

  it("returns a non-2xx and writes no ready record when the provider fails", async () => {
    const { POST, generateImage } = await load();
    generateImage.mockRejectedValue(new Error("Image provider returned no image"));

    const response = await POST(post({ photo: PHOTO_DATA_URL, emotion: "happy" }));

    expect(response.ok).toBe(false);
    expect(collection.docs).toHaveLength(0);
  });
});
