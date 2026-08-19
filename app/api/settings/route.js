import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db.js";
import { getSettings, isOwner } from "@/lib/settings.js";

export const GET = async () => {
  const { userId } = await auth();

  if (!userId || !isOwner(userId)) {
    return new Response(null, { status: 404 });
  }

  const settings = await getSettings();
  return Response.json(settings);
};

export const PATCH = async (request) => {
  const { userId } = await auth();

  if (!userId || !isOwner(userId)) {
    return new Response(null, { status: 404 });
  }

  const [body, database] = await Promise.all([request.json(), db()]);
  const settings = database.collection("settings");

  // Get current settings
  const current = await settings.findOne({ _id: "config" });

  // Build update — _id stays out of $set, MongoDB rejects updating it
  const { _id, ...currentFields } = current ?? {};
  const update = {
    enabled: true,
    videoQuality: "lite",
    ...currentFields,
    ...body,
  };

  // Persist
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
