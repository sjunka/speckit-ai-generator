import { describe, it, expect, vi, beforeEach } from "vitest";
import { FakeCollection } from "@/test/mongo-fake.js";
import { PHOTO_DATA_URL, BLOB_URL } from "@/test/fixtures.js";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db.js", () => ({ generations: vi.fn() }));
vi.mock("@/lib/settings.js", () => ({ getSettings: vi.fn(), assertEnabled: vi.fn() }));
vi.mock("@/lib/higgsfield.js", () => ({ generateImage: vi.fn() }));
vi.mock("@/lib/blob.js", () => ({ store: vi.fn() }));

// lib/emotions.js is deliberately not mocked: the strings it composes are the
// contract with the provider, and this route is where they are spent.

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

const pause = () => {
  const paused = new Error("Generation is paused");
  paused.status = 503;
  return paused;
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

  // Unchanged from 001: the happy string the provider sees is the same one.
  it("sends exactly 'I am feeling happy 😊' to the provider for a happy request", async () => {
    const { POST, generateImage } = await load();

    await POST(post({ photo: PHOTO_DATA_URL, emotion: "happy" }));

    expect(generateImage).toHaveBeenCalledWith(BLOB_URL, "I am feeling happy 😊");
  });

  it("composes the level into the hint for a levelled emotion", async () => {
    const { POST, generateImage } = await load();

    await POST(post({ photo: PHOTO_DATA_URL, emotion: "angry", level: "very" }));

    expect(generateImage).toHaveBeenCalledWith(BLOB_URL, "I am feeling very angry 😠");
  });

  it("no longer reads hint from the request body", async () => {
    const { POST, generateImage } = await load();

    const response = await POST(
      post({ photo: PHOTO_DATA_URL, emotion: "happy", hint: "make it a watercolour" })
    );

    expect(response.status).toBe(200);
    expect(generateImage).toHaveBeenCalledWith(BLOB_URL, "I am feeling happy 😊");
  });

  it("returns 400 for a request carrying only a hint, now that hint is gone", async () => {
    const { POST, generateImage } = await load();

    const response = await POST(post({ photo: PHOTO_DATA_URL, hint: "happy" }));

    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toBe("Unknown emotion");
    expect(generateImage).not.toHaveBeenCalled();
  });
});

// FR-011, SC-002: validation precedes every spend.
describe("POST /api/image — validation before any spend", () => {
  const invalid = [
    ["an emotion outside the three", { emotion: "adventurous" }, "Unknown emotion"],
    ["no emotion at all", {}, "Unknown emotion"],
    ["a level outside the three", { emotion: "sad", level: "somewhat" }, "Unknown level"],
    ["a levelled emotion with no level", { emotion: "sad" }, "Unknown level"],
    ["a level on happy", { emotion: "happy", level: "quite" }, "happy takes no level"],
  ];

  invalid.forEach(([name, body, message]) => {
    it(`returns 400 '${message}' for ${name}, with zero calls to any paid provider`, async () => {
      const { POST, generateImage, store } = await load();

      const response = await POST(post({ photo: PHOTO_DATA_URL, ...body }));

      expect(response.status).toBe(400);
      await expect(response.text()).resolves.toBe(message);
      expect(generateImage).not.toHaveBeenCalled();
      expect(store).not.toHaveBeenCalled();
      expect(collection.docs).toHaveLength(0);
    });
  });

  // FR-028: a 400 wins over a 503, and neither path contacts a provider.
  it("returns the 400 rather than the 503 when generation is paused", async () => {
    const { POST, assertEnabled, generateImage, store } = await load();
    assertEnabled.mockRejectedValue(pause());

    const response = await POST(post({ photo: PHOTO_DATA_URL, emotion: "adventurous" }));

    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toBe("Unknown emotion");
    expect(generateImage).not.toHaveBeenCalled();
    expect(store).not.toHaveBeenCalled();
  });

  it("validates before it reaches the spend switch at all", async () => {
    const { POST, assertEnabled } = await load();

    await POST(post({ photo: PHOTO_DATA_URL, emotion: "adventurous" }));

    expect(assertEnabled).not.toHaveBeenCalled();
  });
});

// T026: the record this route writes.
describe("POST /api/image — the record it writes", () => {
  it("writes the user, kind, status, url and timestamp exactly as 001 did", async () => {
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

  it("records the emotion and isPublic: false at insert", async () => {
    const { POST } = await load();

    await POST(post({ photo: PHOTO_DATA_URL, emotion: "happy" }));

    expect(collection.docs[0]).toMatchObject({ emotion: "happy", isPublic: false });
  });

  // FR-012, FR-014: a happy record carries no level key at all.
  it("writes no level key for an emotion that takes none", async () => {
    const { POST } = await load();

    await POST(post({ photo: PHOTO_DATA_URL, emotion: "happy" }));

    expect(collection.docs[0]).not.toHaveProperty("level");
  });

  it("writes the level only for an emotion in LEVELLED", async () => {
    const { POST } = await load();

    await POST(post({ photo: PHOTO_DATA_URL, emotion: "sad", level: "a bit" }));

    expect(collection.docs[0]).toMatchObject({ emotion: "sad", level: "a bit", isPublic: false });
  });
});

describe("POST /api/image — the 001 status codes, untouched", () => {
  it("returns 401 for an anonymous caller and touches no provider", async () => {
    const { POST, auth, generateImage } = await load();
    auth.mockResolvedValue({ userId: null });

    const response = await POST(post({ photo: PHOTO_DATA_URL, emotion: "happy" }));

    expect(response.status).toBe(401);
    expect(generateImage).not.toHaveBeenCalled();
  });

  it("returns 503 'Generation is paused' when the kill switch is off", async () => {
    const { POST, assertEnabled, generateImage } = await load();
    assertEnabled.mockRejectedValue(pause());

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
    expect(response.status).toBe(500);
    expect(collection.docs).toHaveLength(0);
  });
});
