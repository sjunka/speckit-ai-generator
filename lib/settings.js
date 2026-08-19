import { db } from "./db.js";

export const getSettings = async () => {
  const database = await db();
  const settings = database.collection("settings");
  const record = await settings.findOne({ _id: "config" });

  if (!record) {
    return { enabled: true, videoQuality: "lite" };
  }

  return { videoQuality: "lite", ...record };
};

export const assertEnabled = async () => {
  const settings = await getSettings();
  if (!settings.enabled) {
    const error = new Error("Generation is paused");
    error.status = 503;
    throw error;
  }
};

export const isOwner = (userId) => {
  return userId === process.env.OWNER_ID;
};
