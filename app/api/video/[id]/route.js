import { NextResponse } from "next/server";
import { generations } from "@/lib/db";
import { getVideo } from "@/lib/higgsfield";
import { getSettings } from "@/lib/settings";

export async function GET(request, context = {}) {
  const routeParams = await (request?.params ?? context?.params ?? Promise.resolve({}));
  const { id } = routeParams || {};

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const collection = await generations();
  const record = await collection.findOne({ jobId: id });

  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (record.status === "ready" || record.status === "failed") {
    return NextResponse.json({
      status: record.status,
      ...(record.url ? { videoUrl: record.url } : {}),
    }, { status: 200 });
  }

  const settings = await getSettings();
  if (!settings || settings.enabled === false) {
    return NextResponse.json({ status: "pending" }, { status: 200 });
  }

  const providerState = await getVideo(id);

  if (providerState.status === "ready") {
    await collection.updateOne(
      { jobId: id },
      { $set: { status: "ready", url: providerState.videoUrl, updatedAt: new Date() } }
    );

    return NextResponse.json({ status: "ready", videoUrl: providerState.videoUrl }, { status: 200 });
  }

  if (providerState.status === "failed") {
    await collection.updateOne(
      { jobId: id },
      { $set: { status: "failed", updatedAt: new Date() } }
    );

    return NextResponse.json({ status: "failed" }, { status: 200 });
  }

  return NextResponse.json({ status: "pending" }, { status: 200 });
}
