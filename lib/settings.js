// stub, Fase 4 replaces this — signature pinned in plan.md Contracts.

export const getSettings = async () => ({ enabled: true, videoQuality: "lite" });

export const assertEnabled = async () => {
  const { enabled } = await getSettings();
  if (!enabled) {
    const error = new Error("Generation is paused");
    error.status = 503;
    throw error;
  }
};

export const isOwner = (userId) => userId === process.env.OWNER_ID;
