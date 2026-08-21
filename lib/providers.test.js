import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PHOTO_BASE64, BLOB_URL, VIDEO_URL, PROVIDER_JOB_ID } from "@/test/fixtures.js";

const put = vi.fn();

vi.mock("@vercel/blob", () => ({ put }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("lib/blob store", () => {
  const ORIGINAL_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

  afterEach(() => {
    process.env.BLOB_READ_WRITE_TOKEN = ORIGINAL_TOKEN;
  });

  it("stores the buffer publicly and returns the url when a token is set", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "token";
    put.mockResolvedValue({ url: BLOB_URL });

    const { store } = await import("./blob.js");
    const url = await store(Buffer.from("x"), "image/png");

    expect(url).toBe(BLOB_URL);
    const [pathname, , options] = put.mock.calls[0];
    expect(pathname).toMatch(/\.png$/);
    expect(options.access).toBe("public");
  });

  it("falls back to local disk in dev when there is no token", async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;

    const { store } = await import("./blob.js");
    const url = await store(Buffer.from("x"), "image/png");

    expect(url).toMatch(/^http:\/\/localhost:3000\/uploads\/.+\.png$/);
    expect(put).not.toHaveBeenCalled();

    const { rm } = await import("fs/promises");
    const path = await import("path");
    await rm(path.join(process.cwd(), "public", "uploads"), { recursive: true, force: true });
  });
});

const json = (body) => ({ ok: true, json: async () => body });

const image = (bytes, contentType) => ({
  ok: true,
  arrayBuffer: async () => new Uint8Array(Buffer.from(bytes, "base64")).buffer,
  headers: { get: () => contentType },
});

describe("lib/higgsfield", () => {
  it("generateImage submits the photo url and hint, polls, returns the image bytes", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(json({ status: "queued", request_id: PROVIDER_JOB_ID }))
      .mockResolvedValueOnce(json({ status: "completed", images: [{ url: BLOB_URL }] }))
      .mockResolvedValueOnce(image(PHOTO_BASE64, "image/jpeg"));

    const { generateImage } = await import("./higgsfield.js");
    const { buffer, contentType } = await generateImage(BLOB_URL, "make it a watercolour");

    expect(buffer.toString("base64")).toBe(PHOTO_BASE64);
    expect(contentType).toBe("image/jpeg");

    const [submitUrl, submitInit] = global.fetch.mock.calls[0];
    expect(submitUrl).toBe("https://platform.higgsfield.ai/higgsfield-ai/soul/reference");
    expect(submitInit.headers.Authorization).toMatch(/^Key .*:/);
    expect(JSON.parse(submitInit.body)).toEqual({
      prompt:
        "Create a picture ultra realistic, similar to the reference image, mixed with the action of make it a watercolour. Be random and creative with the result.",
      image_reference_url: BLOB_URL,
    });

    expect(global.fetch.mock.calls[1][0]).toBe(
      `https://platform.higgsfield.ai/requests/${PROVIDER_JOB_ID}/status`
    );
  });

  it("generateImage defaults the prompt when there is no hint", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(json({ status: "queued", request_id: PROVIDER_JOB_ID }))
      .mockResolvedValueOnce(json({ status: "completed", images: [{ url: BLOB_URL }] }))
      .mockResolvedValueOnce(image(PHOTO_BASE64, "image/png"));

    const { generateImage } = await import("./higgsfield.js");
    await generateImage(BLOB_URL, undefined);

    expect(JSON.parse(global.fetch.mock.calls[0][1].body).prompt).toBe(
      "Create a picture ultra realistic, similar to the reference image, mixed with the action of a spontaneous, joyful moment. Be random and creative with the result."
    );
  });

  it("generateImage throws when the request is rejected as nsfw", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(json({ status: "queued", request_id: PROVIDER_JOB_ID }))
      .mockResolvedValueOnce(json({ status: "nsfw" }));

    const { generateImage } = await import("./higgsfield.js");
    await expect(generateImage(BLOB_URL)).rejects.toThrow("no image");
  });

  it("startVideo defaults to the lite (lowest cost) model", async () => {
    global.fetch = vi.fn().mockResolvedValue(json({ request_id: PROVIDER_JOB_ID }));

    const { startVideo } = await import("./higgsfield.js");
    const jobId = await startVideo(BLOB_URL);

    expect(jobId).toBe(PROVIDER_JOB_ID);
    expect(global.fetch.mock.calls[0][0]).toBe(
      "https://platform.higgsfield.ai/higgsfield-ai/dop/lite"
    );
    expect(JSON.parse(global.fetch.mock.calls[0][1].body).image_url).toBe(BLOB_URL);
  });

  it("startVideo picks the model slug matching the requested quality", async () => {
    global.fetch = vi.fn().mockResolvedValue(json({ request_id: PROVIDER_JOB_ID }));

    const { startVideo } = await import("./higgsfield.js");
    await startVideo(BLOB_URL, "turbo");

    expect(global.fetch.mock.calls[0][0]).toBe(
      "https://platform.higgsfield.ai/higgsfield-ai/dop/turbo"
    );
  });

  it("getVideo maps completed to ready with the video url", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(json({ status: "completed", video: { url: VIDEO_URL } }));

    const { getVideo } = await import("./higgsfield.js");

    await expect(getVideo(PROVIDER_JOB_ID)).resolves.toEqual({
      status: "ready",
      videoUrl: VIDEO_URL,
    });
  });

  it("getVideo maps queued to pending and nsfw to failed", async () => {
    const { getVideo } = await import("./higgsfield.js");

    global.fetch = vi.fn().mockResolvedValue(json({ status: "queued" }));
    await expect(getVideo(PROVIDER_JOB_ID)).resolves.toEqual({ status: "pending" });

    global.fetch = vi.fn().mockResolvedValue(json({ status: "nsfw" }));
    await expect(getVideo(PROVIDER_JOB_ID)).resolves.toEqual({ status: "failed" });
  });

  it("throws on a non-2xx provider response", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    const { startVideo } = await import("./higgsfield.js");
    await expect(startVideo(BLOB_URL)).rejects.toThrow("500");
  });
});
