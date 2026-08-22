import { describe, it, expect } from "vitest";
import { ObjectId } from "mongodb";
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

  it("counts documents in a date range", async () => {
    const col = new FakeCollection();
    await col.insertOne({ timestamp: new Date("2026-08-20") });
    await col.insertOne({ timestamp: new Date("2026-08-21") });

    const count = await col.countDocuments({
      timestamp: { $gte: new Date("2026-08-21") },
    });

    expect(count).toBe(1);
  });
});

describe("FakeCollection ids", () => {
  it("assigns a real ObjectId on insert", async () => {
    const col = new FakeCollection();
    const { insertedId } = await col.insertOne({ kind: "image" });

    expect(insertedId).toBeInstanceOf(ObjectId);
    expect(col.docs[0]._id).toBeInstanceOf(ObjectId);
  });

  it("assigns a distinct id to every document", async () => {
    const col = new FakeCollection();
    await col.insertOne({ n: 1 });
    await col.insertOne({ n: 2 });

    expect(col.docs[0]._id.equals(col.docs[1]._id)).toBe(false);
  });

  // Trap 4: with `===` the lookup below silently misses, and setPublished
  // answers "not-found" for documents that exist.
  it("finds a document by an equal but non-identical ObjectId", async () => {
    const col = new FakeCollection();
    const { insertedId } = await col.insertOne({ kind: "image" });

    const doc = await col.findOne({ _id: new ObjectId(insertedId.toString()) });

    expect(doc).toBeDefined();
    expect(doc.kind).toBe("image");
  });

  it("does not find a document by a different ObjectId", async () => {
    const col = new FakeCollection();
    await col.insertOne({ kind: "image" });

    expect(await col.findOne({ _id: new ObjectId() })).toBeUndefined();
  });

  it("updates the document matched by its ObjectId", async () => {
    const col = new FakeCollection();
    const { insertedId } = await col.insertOne({ isPublic: false });

    const result = await col.updateOne(
      { _id: new ObjectId(insertedId.toString()) },
      { $set: { isPublic: true } }
    );

    expect(result).toEqual({ matchedCount: 1, modifiedCount: 1 });
    expect(col.docs[0].isPublic).toBe(true);
  });

  it("matches an ObjectId alongside another field", async () => {
    const col = new FakeCollection();
    const { insertedId } = await col.insertOne({ userId: "user-1" });

    expect(await col.findOne({ _id: insertedId, userId: "user-1" })).toBeDefined();
    expect(await col.findOne({ _id: insertedId, userId: "user-2" })).toBeUndefined();
  });
});

describe("FakeCollection find", () => {
  const seed = async (col, docs) => {
    for (const doc of docs) await col.insertOne(doc);
    return col;
  };

  const dated = (day, rest = {}) => ({
    createdAt: new Date(`2026-08-${day}`),
    ...rest,
  });

  it("returns every document when the filter is empty", async () => {
    const col = await seed(new FakeCollection(), [{ n: 1 }, { n: 2 }]);
    expect((await col.find({}).toArray()).map((d) => d.n)).toEqual([1, 2]);
  });

  it("filters on an exact match", async () => {
    const col = await seed(new FakeCollection(), [
      { userId: "user-1", n: 1 },
      { userId: "user-2", n: 2 },
      { userId: "user-1", n: 3 },
    ]);

    const docs = await col.find({ userId: "user-1" }).toArray();

    expect(docs.map((d) => d.n)).toEqual([1, 3]);
  });

  it("sorts descending on one key", async () => {
    const col = await seed(new FakeCollection(), [
      dated("19", { n: 1 }),
      dated("21", { n: 2 }),
      dated("20", { n: 3 }),
    ]);

    const docs = await col.find({}).sort({ createdAt: -1 }).toArray();

    expect(docs.map((d) => d.n)).toEqual([2, 3, 1]);
  });

  it("sorts ascending on one key", async () => {
    const col = await seed(new FakeCollection(), [
      dated("19", { n: 1 }),
      dated("21", { n: 2 }),
      dated("20", { n: 3 }),
    ]);

    const docs = await col.find({}).sort({ createdAt: 1 }).toArray();

    expect(docs.map((d) => d.n)).toEqual([1, 3, 2]);
  });

  // The `_id` tiebreaker is what keeps paging stable when two documents share
  // a timestamp — the plan pins the sort as { createdAt: -1, _id: -1 }.
  it("breaks a tie on the second sort key", async () => {
    const col = await seed(new FakeCollection(), [
      dated("21", { n: 1 }),
      dated("21", { n: 2 }),
      dated("21", { n: 3 }),
    ]);

    const docs = await col.find({}).sort({ createdAt: -1, _id: -1 }).toArray();

    expect(docs.map((d) => d.n)).toEqual([3, 2, 1]);
  });

  it("skips and limits, chained in any order after the sort", async () => {
    const col = await seed(
      new FakeCollection(),
      [1, 2, 3, 4, 5].map((n) => dated(String(14 + n), { n }))
    );

    const docs = await col
      .find({})
      .sort({ createdAt: -1 })
      .skip(1)
      .limit(2)
      .toArray();

    expect(docs.map((d) => d.n)).toEqual([4, 3]);
  });

  it("returns an empty array for a page past the end", async () => {
    const col = await seed(new FakeCollection(), [{ n: 1 }, { n: 2 }]);

    const docs = await col.find({}).sort({ createdAt: -1 }).skip(12).limit(13).toArray();

    expect(docs).toEqual([]);
  });

  it("leaves the stored documents untouched", async () => {
    const col = await seed(new FakeCollection(), [
      dated("19", { n: 1 }),
      dated("21", { n: 2 }),
    ]);

    await col.find({}).sort({ createdAt: -1 }).toArray();

    expect(col.docs.map((d) => d.n)).toEqual([1, 2]);
  });

  it("filters on a boolean flag", async () => {
    const col = await seed(new FakeCollection(), [
      { isPublic: true, n: 1 },
      { isPublic: false, n: 2 },
      { n: 3 },
    ]);

    const docs = await col.find({ isPublic: true }).toArray();

    expect(docs.map((d) => d.n)).toEqual([1]);
  });
});
