// stub, Fase 4 replaces this. Vitest resolves ES imports against the real
// filesystem before vi.mock runs, so the generation routes need this file to
// exist before their tests can mock it. Signature from the plan's Contracts.
export const getSettings = async () => ({ enabled: true, videoQuality: "lite" });

export const assertEnabled = async () => {};

export const isOwner = (userId) => userId === process.env.OWNER_ID;
