import { generations } from "@/lib/db.js";
import { getVideo } from "@/lib/higgsfield.js";

// No assertEnabled here: the kill switch stops new generations, it does not
// hide jobs that already exist (media-pipeline spec).
export const GET = async (_request, { params }) => {
  const [{ id }, collection] = await Promise.all([params, generations()]);
  const record = await collection.findOne({ jobId: id });

  if (!record) return new Response("Not found", { status: 404 });
  if (record.status === "ready") {
    return Response.json({ status: "ready", videoUrl: record.url });
  }
  if (record.status === "failed") {
    return Response.json({ status: "failed" });
  }

  const { status, videoUrl } = await getVideo(id);

  if (status === "ready") {
    await collection.updateOne({ jobId: id }, { $set: { status: "ready", url: videoUrl } });
    return Response.json({ status: "ready", videoUrl });
  }

  if (status === "failed") {
    await collection.updateOne({ jobId: id }, { $set: { status: "failed" } });
    return Response.json({ status: "failed" });
  }

  return Response.json({ status: "pending" });
};
