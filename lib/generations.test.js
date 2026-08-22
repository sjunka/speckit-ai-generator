import { describe, it, expect, beforeEach, vi } from "vitest";
import { ObjectId } from "mongodb";
import { FakeCollection } from "@/test/mongo-fake.js";
import { PAGE_SIZE, listByUser, listPublic, setPublished } from "./generations.js";

vi.mock("./db.js");

let collection;
let cursorCalls;

// Records the cursor stages the module asks for, so the sort spec and the
// PAGE_SIZE + 1 limit are asserted rather than inferred from the page contents.
const record = (col) => {
  const find = col.find.bind(col);

  col.find = (filter) => {
    cursorCalls.filter = filter;
    const cursor = find(filter);
    const { sort, skip, limit } = cursor;

    cursor.sort = (spec) => ((cursorCalls.sort = spec), sort(spec));
    cursor.skip = (n) => ((cursorCalls.skip = n), skip(n));
    cursor.limit = (n) => ((cursorCalls.limit = n), limit(n));

    return cursor;
  };

  return col;
};

const seed = async (docs) => {
  for (const doc of docs) await collection.insertOne(doc);
};

const image = (overrides = {}) => ({
  userId: "user-1",
  kind: "image",
  status: "ready",
  url: "https://blob.test/image-1.png",
  emotion: "happy",
  isPublic: false,
  createdAt: new Date("2026-08-21T10:00:00.000Z"),
  ...overrides,
});

beforeEach(async () => {
  vi.resetAllMocks();
  cursorCalls = {};
  collection = record(new FakeCollection());

  const { generations } = await import("./db.js");
  generations.mockResolvedValue(collection);
});

describe("PAGE_SIZE", () => {
  it("is twelve", () => {
    expect(PAGE_SIZE).toBe(12);
  });
});

describe("listByUser", () => {
  it("returns only the caller's own generations", async () => {
    await seed([
      image({ userId: "user-1", url: "mine-1" }),
      image({ userId: "user-2", url: "theirs" }),
      image({ userId: "user-1", url: "mine-2" }),
    ]);

    const { items } = await listByUser("user-1");

    expect(items).toHaveLength(2);
    expect(items.map((i) => i.url)).toEqual(expect.arrayContaining(["mine-1", "mine-2"]));
    expect(items.map((i) => i.url)).not.toContain("theirs");
    expect(cursorCalls.filter).toEqual({ userId: "user-1" });
  });

  it("returns the newest generation first", async () => {
    await seed([
      image({ url: "older", createdAt: new Date("2026-08-19T10:00:00.000Z") }),
      image({ url: "newest", createdAt: new Date("2026-08-21T10:00:00.000Z") }),
      image({ url: "middle", createdAt: new Date("2026-08-20T10:00:00.000Z") }),
    ]);

    const { items } = await listByUser("user-1");

    expect(items.map((i) => i.url)).toEqual(["newest", "middle", "older"]);
  });

  it("sorts by createdAt with an _id tiebreaker, both descending", async () => {
    await seed([image()]);
    await listByUser("user-1");

    expect(cursorCalls.sort).toEqual({ createdAt: -1, _id: -1 });
  });

  it("reads one document past the page to decide hasMore", async () => {
    await seed(Array.from({ length: PAGE_SIZE + 1 }, () => image()));

    const { items, hasMore } = await listByUser("user-1", 0);

    expect(cursorCalls.limit).toBe(PAGE_SIZE + 1);
    expect(cursorCalls.skip).toBe(0);
    expect(items).toHaveLength(PAGE_SIZE);
    expect(hasMore).toBe(true);
  });

  it("reports no more when the page is exactly full", async () => {
    await seed(Array.from({ length: PAGE_SIZE }, () => image()));

    const { items, hasMore } = await listByUser("user-1", 0);

    expect(items).toHaveLength(PAGE_SIZE);
    expect(hasMore).toBe(false);
  });

  it("skips whole pages", async () => {
    await seed(Array.from({ length: PAGE_SIZE + 3 }, (_, n) =>
      image({ url: `image-${n}`, createdAt: new Date(2026, 7, 1, 0, n) })
    ));

    const { items, hasMore } = await listByUser("user-1", 1);

    expect(cursorCalls.skip).toBe(PAGE_SIZE);
    expect(items).toHaveLength(3);
    expect(hasMore).toBe(false);
  });

  it("defaults to the first page", async () => {
    await seed([image()]);
    await listByUser("user-1");

    expect(cursorCalls.skip).toBe(0);
  });

  it("answers a page past the last one with an empty page, not an error", async () => {
    await seed([image()]);

    await expect(listByUser("user-1", 9)).resolves.toEqual({ items: [], hasMore: false });
  });

  it("answers an unknown user with an empty page", async () => {
    await seed([image({ userId: "user-1" })]);

    await expect(listByUser("nobody")).resolves.toEqual({ items: [], hasMore: false });
  });
});

describe("listPublic", () => {
  it("returns published generations only", async () => {
    await seed([
      image({ userId: "user-1", url: "published", isPublic: true }),
      image({ userId: "user-2", url: "private", isPublic: false }),
      image({ userId: "user-3", url: "pre-002", isPublic: undefined }),
    ]);

    const { items } = await listPublic();

    expect(items.map((i) => i.url)).toEqual(["published"]);
    expect(cursorCalls.filter).toEqual({ isPublic: true });
  });

  it("returns published generations from every user, newest first", async () => {
    await seed([
      image({ userId: "user-1", url: "older", isPublic: true, createdAt: new Date("2026-08-19") }),
      image({ userId: "user-2", url: "newer", isPublic: true, createdAt: new Date("2026-08-21") }),
    ]);

    const { items } = await listPublic(0);

    expect(items.map((i) => i.url)).toEqual(["newer", "older"]);
  });

  it("pages exactly like the gallery", async () => {
    await seed(Array.from({ length: PAGE_SIZE + 1 }, () => image({ isPublic: true })));

    const { items, hasMore } = await listPublic(0);

    expect(cursorCalls.sort).toEqual({ createdAt: -1, _id: -1 });
    expect(cursorCalls.skip).toBe(0);
    expect(cursorCalls.limit).toBe(PAGE_SIZE + 1);
    expect(items).toHaveLength(PAGE_SIZE);
    expect(hasMore).toBe(true);
  });

  it("answers a page past the last one with an empty page", async () => {
    await seed([image({ isPublic: true })]);

    await expect(listPublic(4)).resolves.toEqual({ items: [], hasMore: false });
  });
});

describe("the Item shape", () => {
  it("stringifies the document id", async () => {
    const { insertedId } = await collection.insertOne(image());

    const { items } = await listByUser("user-1");

    expect(items[0].id).toBe(insertedId.toString());
    expect(typeof items[0].id).toBe("string");
  });

  it("never carries a userId", async () => {
    await seed([image()]);

    const { items } = await listByUser("user-1");

    expect(items[0]).not.toHaveProperty("userId");
    expect(Object.keys(items[0]).sort()).toEqual(
      ["createdAt", "emotion", "id", "isPublic", "kind", "level", "status", "url"]
    );
  });

  it("carries createdAt as an ISO 8601 string", async () => {
    await seed([image({ createdAt: new Date("2026-08-21T10:00:00.000Z") })]);

    const { items } = await listByUser("user-1");

    expect(items[0].createdAt).toBe("2026-08-21T10:00:00.000Z");
  });

  it("maps an emotion and a level verbatim", async () => {
    await seed([image({ emotion: "angry", level: "quite" })]);

    const { items } = await listByUser("user-1");

    expect(items[0]).toMatchObject({ emotion: "angry", level: "quite" });
  });

  it("reads a missing level as null", async () => {
    await seed([image({ emotion: "happy" })]);

    const { items } = await listByUser("user-1");

    expect(items[0].level).toBeNull();
  });

  // The whole migration story: no backfill, defaults at read time.
  it("reads a pre-002 record as having no emotion, no level and no flag", async () => {
    await seed([
      {
        userId: "user-1",
        kind: "image",
        status: "ready",
        url: "https://blob.test/old.png",
        createdAt: new Date("2026-08-01T10:00:00.000Z"),
      },
    ]);

    const { items } = await listByUser("user-1");

    expect(items[0]).toEqual({
      id: expect.any(String),
      kind: "image",
      status: "ready",
      url: "https://blob.test/old.png",
      emotion: null,
      level: null,
      isPublic: false,
      createdAt: "2026-08-01T10:00:00.000Z",
    });
  });

  it("reads a pending video's missing url as null", async () => {
    await seed([
      {
        userId: "user-1",
        kind: "video",
        status: "pending",
        jobId: "provider-job-1",
        createdAt: new Date("2026-08-21T10:00:00.000Z"),
      },
    ]);

    const { items } = await listByUser("user-1");

    expect(items[0]).toMatchObject({
      kind: "video",
      status: "pending",
      url: null,
      emotion: null,
      level: null,
      isPublic: false,
    });
  });
});

describe("setPublished", () => {
  const publishable = () => image({ status: "ready", isPublic: false });

  it("publishes the owner's ready generation", async () => {
    const { insertedId } = await collection.insertOne(publishable());

    await expect(setPublished(insertedId.toString(), "user-1", true)).resolves.toBe("ok");
    expect(collection.docs[0].isPublic).toBe(true);
  });

  it("is a no-op on an already published generation", async () => {
    const { insertedId } = await collection.insertOne(image({ isPublic: true }));

    await expect(setPublished(insertedId.toString(), "user-1", true)).resolves.toBe("ok");
    expect(collection.docs[0].isPublic).toBe(true);
  });

  it("unpublishes a published generation", async () => {
    const { insertedId } = await collection.insertOne(image({ isPublic: true }));

    await expect(setPublished(insertedId.toString(), "user-1", false)).resolves.toBe("ok");
    expect(collection.docs[0].isPublic).toBe(false);
  });

  it("unpublishes at any status, readiness being checked only on the way up", async () => {
    for (const status of ["pending", "failed", "ready"]) {
      collection.docs.length = 0;
      const { insertedId } = await collection.insertOne(image({ status, isPublic: true }));

      await expect(setPublished(insertedId.toString(), "user-1", false)).resolves.toBe("ok");
      expect(collection.docs[0].isPublic).toBe(false);
    }
  });

  it("refuses to publish something that is not ready", async () => {
    for (const status of ["pending", "failed"]) {
      collection.docs.length = 0;
      const { insertedId } = await collection.insertOne(image({ status }));

      await expect(setPublished(insertedId.toString(), "user-1", true)).resolves.toBe("not-ready");
      expect(collection.docs[0].isPublic).toBe(false);
    }
  });

  it("answers not-found for an id nothing matches", async () => {
    await collection.insertOne(publishable());

    await expect(
      setPublished(new ObjectId().toString(), "user-1", true)
    ).resolves.toBe("not-found");
  });

  it("answers not-found for an unparseable id rather than throwing", async () => {
    for (const id of ["not-an-id", "", "12345", undefined, null]) {
      await expect(setPublished(id, "user-1", true)).resolves.toBe("not-found");
    }
  });

  // Non-existence and non-ownership are deliberately indistinguishable (trap 5).
  it("answers not-found for a generation owned by somebody else", async () => {
    const { insertedId } = await collection.insertOne(publishable());
    const before = JSON.stringify(collection.docs[0]);

    await expect(setPublished(insertedId.toString(), "intruder", true)).resolves.toBe(
      "not-found"
    );

    expect(JSON.stringify(collection.docs[0])).toBe(before);
  });

  it("leaves a non-owner's unpublish attempt equally without effect", async () => {
    const { insertedId } = await collection.insertOne(image({ isPublic: true }));
    const before = JSON.stringify(collection.docs[0]);

    await expect(setPublished(insertedId.toString(), "intruder", false)).resolves.toBe(
      "not-found"
    );

    expect(JSON.stringify(collection.docs[0])).toBe(before);
  });
});
