// stub, Fase 3 replaces this
//
// Fase 4 imports `db` by its Contracts signature (plan.md) and mocks it in every
// test. Vitest resolves ES imports against the real filesystem before `vi.mock`
// runs, so the module has to exist on disk before it can be mocked — an
// in-memory mock alone fails with "Failed to resolve import".
//
// T031 expects this file to collide with Fase 3's real implementation at the
// merge. Keep Fase 3's, discard this one.

export const db = async () => {
  throw new Error("lib/db.js stub — Fase 3 provides the real implementation");
};

export const generations = async () => (await db()).collection("generations");
