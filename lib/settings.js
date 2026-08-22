import { db } from "./db.js";

export const getSettings = async () => {
  const record = await (await db()).collection("settings").findOne({ _id: "config" });

  if (!record) {
    return { enabled: true, videoQuality: "lite" };
  }

  return { videoQuality: "lite", ...record };
};

export const assertEnabled = async () => {
  const { enabled } = await getSettings();

  if (!enabled) {
    const error = new Error("Generation is paused");
    error.status = 503;
    throw error;
  }
};

export const isOwner = (userId) => userId === process.env.OWNER_ID;
