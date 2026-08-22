import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db.js";
import { getSettings, isOwner } from "@/lib/settings.js";

export const GET = async () => {
  const { userId } = await auth();

  if (!userId || !isOwner(userId)) {
    return new Response(null, { status: 404 });
  }

  return Response.json(await getSettings());
};

export const PATCH = async (request) => {
  const { userId } = await auth();

  if (!userId || !isOwner(userId)) {
    return new Response(null, { status: 404 });
  }

  const [body, database] = await Promise.all([request.json(), db()]);
  const settings = database.collection("settings");
  const current = await settings.findOne({ _id: "config" });
  const { _id, ...currentFields } = current ?? {};
  const update = {
    enabled: true,
    videoQuality: "lite",
    ...currentFields,
    ...body,
  };

  await settings.updateOne(
    { _id: "config" },
    { $set: update },
    { upsert: true }
  );

  return Response.json({
    enabled: update.enabled,
    videoQuality: update.videoQuality,
  });
};
