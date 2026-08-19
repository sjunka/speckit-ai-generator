import { describe, it, expect, vi, beforeEach } from "vitest";

const connect = vi.fn();

vi.mock("mongodb", () => ({
  MongoClient: vi.fn(function () {
    this.connect = connect;
  }),
}));

describe("lib/db", () => {
  beforeEach(() => {
    vi.resetModules();
    delete globalThis._mongo;
    connect.mockReset();
    process.env.MONGODB_URI = "mongodb://test";
  });

  it("caches the client on globalThis and reuses it across calls", async () => {
    const { MongoClient } = await import("mongodb");
    const collection = vi.fn();
    connect.mockResolvedValue({ db: () => ({ collection }) });

    const { db } = await import("./db.js");

    await db();
    await db();

    expect(MongoClient).toHaveBeenCalledTimes(1);
    expect(globalThis._mongo).toBeDefined();
  });

  it("generations() returns the generations collection", async () => {
    const collection = vi.fn().mockReturnValue({ name: "generations" });
    connect.mockResolvedValue({ db: () => ({ collection }) });

    const { generations } = await import("./db.js");
    const result = await generations();

    expect(collection).toHaveBeenCalledWith("generations");
    expect(result).toEqual({ name: "generations" });
  });

  it("throws when MONGODB_URI is not set", async () => {
    delete process.env.MONGODB_URI;
    const { db } = await import("./db.js");

    await expect(db()).rejects.toThrow("MONGODB_URI");
  });
});
