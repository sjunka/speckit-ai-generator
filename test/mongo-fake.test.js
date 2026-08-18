import { describe, it, expect } from "vitest";
import { FakeCollection } from "./mongo-fake";

describe("FakeCollection", () => {
  it("inserts and finds documents", async () => {
    const col = new FakeCollection();
    await col.insertOne({ name: "test", value: 42 });
    const doc = await col.findOne({ name: "test" });
    expect(doc.value).toBe(42);
  });

  it("updates documents", async () => {
    const col = new FakeCollection();
    await col.insertOne({ id: 1, status: "pending" });
    await col.updateOne({ id: 1 }, { $set: { status: "done" } });
    const doc = await col.findOne({ id: 1 });
    expect(doc.status).toBe("done");
  });

  it("counts documents", async () => {
    const col = new FakeCollection();
    await col.insertOne({ type: "a" });
    await col.insertOne({ type: "a" });
    await col.insertOne({ type: "b" });
    expect(await col.countDocuments({ type: "a" })).toBe(2);
  });
});
