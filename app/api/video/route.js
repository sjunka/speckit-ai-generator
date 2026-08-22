import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { generations } from "@/lib/db";
import { startVideo } from "@/lib/higgsfield";
import { assertEnabled, getSettings } from "@/lib/settings";

export async function POST(request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await assertEnabled();
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 503 });
  }

  try {
    const { imageUrl } = await request.json();
    const settings = await getSettings();
    const jobId = await startVideo(imageUrl, settings.videoQuality || "lite");
    const collection = await generations();

    await collection.insertOne({
      userId,
      kind: "video",
      status: "pending",
      jobId,
      sourceUrl: imageUrl,
      createdAt: new Date(),
    });

    return NextResponse.json({ jobId }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
