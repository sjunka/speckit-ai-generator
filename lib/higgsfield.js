const API_URL = process.env.HIGGSFIELD_API_URL || "https://platform.higgsfield.ai";
const IMAGE_MODEL = process.env.HIGGSFIELD_IMAGE_MODEL || "higgsfield-ai/soul/reference";

async function call(path, options = {}) {
  const baseHeaders = {
    Authorization: `Key ${process.env.HIGGSFIELD_API_KEY || ""}:${process.env.HIGGSFIELD_API_SECRET || ""}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...baseHeaders,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const error = new Error(`Higgsfield request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function submit(model, payload) {
  const response = await call(`/${model}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response.request_id || response.requestId || response.id;
}

export async function requestStatus(requestId) {
  return call(`/requests/${requestId}/status`);
}

export async function generateImage(photoUrl, hint) {
  const prompt = `Create a picture ultra realistic, similar to the reference image, mixed with the action of ${hint || "a spontaneous, joyful moment"}. Be random and creative with the result.`;
  const requestId = await submit(IMAGE_MODEL, {
    image_reference_url: photoUrl,
    prompt,
  });

  for (let attempt = 0; attempt < 60; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const status = await requestStatus(requestId);

    if (status?.status === "completed") {
      const imageUrl = status?.images?.[0]?.url;
      if (!imageUrl) {
        throw new Error("Image provider returned no image");
      }

      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error("Image provider returned no image");
      }

      return {
        buffer: Buffer.from(await imageResponse.arrayBuffer()),
        contentType: imageResponse.headers.get("content-type") || "image/png",
      };
    }

    if (status?.status === "failed") {
      throw new Error("Image provider failed");
    }
  }

  throw new Error("Image provider timed out");
}

export async function startVideo(imageUrl, quality = "lite") {
  const model = process.env.HIGGSFIELD_VIDEO_MODEL || `higgsfield-ai/dop/${quality}`;
  const prompt = "Smooth cinematic camera move, gentle natural motion.";
  return submit(model, {
    image_url: imageUrl,
    prompt,
  });
}

export async function getVideo(requestId) {
  const status = await requestStatus(requestId);
  const normalizedStatus = status?.status;

  if (normalizedStatus === "completed") {
    return {
      status: "ready",
      videoUrl: status?.video?.url,
    };
  }

  if (normalizedStatus === "failed") {
    return { status: "failed" };
  }

  return { status: "pending" };
}
