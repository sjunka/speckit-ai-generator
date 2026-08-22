const BASE = process.env.HIGGSFIELD_API_URL || "https://platform.higgsfield.ai";
// soul/standard is text-to-image and silently drops the photo; the reference
// mode is the one that takes a source image. There's only the one image
// model — no confirmed quality tiers like video has below.
const IMAGE_MODEL = process.env.HIGGSFIELD_IMAGE_MODEL || "higgsfield-ai/soul/reference";
// Video quality is a model choice, not a request param — dop/standard has no
// quality/resolution field. lite is the lowest-cost, fastest tier.
const VIDEO_MODELS = {
  lite: "higgsfield-ai/dop/lite",
  standard: "higgsfield-ai/dop/standard",
  turbo: "higgsfield-ai/dop/turbo",
};

const call = async (path, init) => {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Key ${process.env.HIGGSFIELD_API_KEY}:${process.env.HIGGSFIELD_API_SECRET}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = body.error || body.message || "";
    } catch {}
    const error = new Error(
      detail
        ? `Provider error: ${detail}`
        : `Provider returned ${response.status}`
    );
    error.status = response.status;
    throw error;
  }

  return response.json();
};

const submit = async (model, body) => {
  const { request_id } = await call(`/${model}`, { method: "POST", body: JSON.stringify(body) });
  return request_id;
};

const requestStatus = (requestId) => call(`/requests/${requestId}/status`, { method: "GET" });

const pending = (status) => status === "queued" || status === "in_progress";

// ponytail: inline polling because the capture screen waits on the response.
// Move the image to the job table (like video) if generation outgrows the
// serverless timeout.
const waitForResult = async (requestId, attempts = 60) => {
  for (let i = 0; i < attempts; i++) {
    const body = await requestStatus(requestId);
    if (!pending(body.status)) return body;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error("Image provider timed out");
};

export const generateImage = async (photoUrl, hint) => {
  const action = hint || "a spontaneous, joyful moment";
  const requestId = await submit(IMAGE_MODEL, {
    prompt: `Create a picture ultra realistic, similar to the reference image, mixed with the action of ${action}. Be random and creative with the result.`,
    image_reference_url: photoUrl,
  });

  const result = await waitForResult(requestId);
  const url = result.images?.[0]?.url;
  if (!url) throw new Error("Image provider returned no image");

  const image = await fetch(url);
  if (!image.ok) throw new Error("Image provider returned no image");
  return {
    buffer: Buffer.from(await image.arrayBuffer()),
    contentType: image.headers.get("content-type") || "image/jpeg",
  };
};

export const startVideo = (imageUrl, quality = "lite") =>
  submit(process.env.HIGGSFIELD_VIDEO_MODEL || VIDEO_MODELS[quality] || VIDEO_MODELS.lite, {
    image_url: imageUrl,
    prompt: "Smooth cinematic camera move, gentle natural motion.",
  });

export const getVideo = async (requestId) => {
  const body = await requestStatus(requestId);
  if (pending(body.status)) return { status: "pending" };
  if (body.status === "completed") return { status: "ready", videoUrl: body.video?.url };
  return { status: "failed" };
};
