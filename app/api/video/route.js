import { auth } from "@clerk/nextjs/server";
import { generations } from "@/lib/db.js";
import { assertEnabled, getSettings } from "@/lib/settings.js";
import { startVideo } from "@/lib/higgsfield.js";

export const POST = async (request) => {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { imageUrl } = await request.json();

  try {
    await assertEnabled();

    const { videoQuality } = await getSettings();
    const jobId = await startVideo(imageUrl, videoQuality);

    await (await generations()).insertOne({
      userId,
      kind: "video",
      status: "pending",
      jobId,
      sourceUrl: imageUrl,
      createdAt: new Date(),
    });

    return Response.json({ jobId });
  } catch (error) {
    return new Response(error.message, { status: error.status || 502 });
  }
};
