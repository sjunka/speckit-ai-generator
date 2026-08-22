import { auth } from "@clerk/nextjs/server";
import { generations } from "@/lib/db.js";
import { assertEnabled } from "@/lib/settings.js";
import { generateImage } from "@/lib/higgsfield.js";
import { store } from "@/lib/blob.js";
import { buildHint, LEVELLED } from "@/lib/emotions.js";

export const POST = async (request) => {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { photo, emotion, level } = await request.json();

  try {
    // Validation precedes the spend switch: an invalid emotion is a 400 even
    // while generation is paused, and neither path contacts a provider.
    const hint = buildHint(emotion, level);

    await assertEnabled();

    // Higgsfield takes a public image_url, not bytes, so the photo goes to blob first.
    const [, photoType, photoBase64] = photo.match(/^data:(.+);base64,(.+)$/);
    const photoUrl = await store(Buffer.from(photoBase64, "base64"), photoType);

    const { buffer, contentType } = await generateImage(photoUrl, hint);
    const imageUrl = await store(buffer, contentType);

    await (await generations()).insertOne({
      userId,
      kind: "image",
      status: "ready",
      url: imageUrl,
      createdAt: new Date(),
      emotion,
      // Written only for the emotions that carry one: a happy record has no
      // level key at all, which is what the read-time default reads as null.
      ...(LEVELLED.includes(emotion) ? { level } : {}),
      isPublic: false,
    });

    return Response.json({ imageUrl });
  } catch (error) {
    console.error("Image generation failed:", error);
    return new Response(error.message, { status: error.status || 500 });
  }
};
