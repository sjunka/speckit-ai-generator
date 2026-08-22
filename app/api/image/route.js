import { auth } from "@clerk/nextjs/server";
import { generations } from "@/lib/db.js";
import { assertEnabled } from "@/lib/settings.js";
import { generateImage } from "@/lib/higgsfield.js";
import { store } from "@/lib/blob.js";

export const POST = async (request) => {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { photo, hint } = await request.json();

  try {
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
    });

    return Response.json({ imageUrl });
  } catch (error) {
    console.error("Image generation failed:", error);
    return new Response(error.message, { status: error.status || 500 });
  }
};
