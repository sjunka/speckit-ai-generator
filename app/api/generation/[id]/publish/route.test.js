import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/generations.js", () => ({ setPublished: vi.fn() }));
vi.mock("@/lib/db.js", () => ({ generations: vi.fn() }));

const post = (id, body) => [
  new Request(`http://test/api/generation/${id}/publish`, {
    method: "POST",
    body: JSON.stringify(body),
  }),
  { params: Promise.resolve({ id }) },
];

const load = async () => {
  const mocks = {
    ...(await import("@clerk/nextjs/server")),
    ...(await import("@/lib/generations.js")),
  };
  const { POST } = await import("./route.js");
  return { POST, ...mocks };
};

const ID = "6702a1b2c3d4e5f601020304";

beforeEach(async () => {
  vi.clearAllMocks();
  const { auth, setPublished } = await load();
  auth.mockResolvedValue({ userId: "user-1" });
  setPublished.mockResolvedValue("ok");
});

describe("POST /api/generation/[id]/publish", () => {
  it("returns 200 { id, isPublic } for an owner publishing a ready generation", async () => {
    const { POST, setPublished } = await load();

    const response = await POST(...post(ID, { isPublic: true }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ id: ID, isPublic: true });
    expect(setPublished).toHaveBeenCalledWith(ID, "user-1", true);
  });

  it("is idempotent: publishing an already-public generation is a 200 no-op", async () => {
    const { POST } = await load();

    const first = await POST(...post(ID, { isPublic: true }));
    const second = await POST(...post(ID, { isPublic: true }));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    await expect(second.json()).resolves.toEqual({ id: ID, isPublic: true });
  });

  it("unpublishes at any status", async () => {
    const { POST, setPublished } = await load();

    const response = await POST(...post(ID, { isPublic: false }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ id: ID, isPublic: false });
    expect(setPublished).toHaveBeenCalledWith(ID, "user-1", false);
  });

  it.each([[{}], [{ isPublic: "true" }], [{ isPublic: 1 }], [{ isPublic: null }]])(
    "returns 400 'Invalid isPublic' for %o",
    async (body) => {
      const { POST, setPublished } = await load();

      const response = await POST(...post(ID, body));

      expect(response.status).toBe(400);
      await expect(response.text()).resolves.toBe("Invalid isPublic");
      expect(setPublished).not.toHaveBeenCalled();
    }
  );

  it("returns 401 'Unauthorized' with no session and never touches the module", async () => {
    const { POST, auth, setPublished } = await load();
    auth.mockResolvedValue({ userId: null });

    const response = await POST(...post(ID, { isPublic: true }));

    expect(response.status).toBe(401);
    await expect(response.text()).resolves.toBe("Unauthorized");
    expect(setPublished).not.toHaveBeenCalled();
  });

  it.each([["an unknown id", ID], ["an unparseable id", "not-an-id"]])(
    "returns 404 'Not found' for %s",
    async (_label, id) => {
      const { POST, setPublished } = await load();
      setPublished.mockResolvedValue("not-found");

      const response = await POST(...post(id, { isPublic: true }));

      expect(response.status).toBe(404);
      await expect(response.text()).resolves.toBe("Not found");
    }
  );

  // The only case the route cannot prove against a mock: the ownership check
  // lives inside setPublished, so this one runs the real module over the fake
  // collection and asserts the stranger's document comes back byte-identical.
  it("returns 404 for a generation owned by somebody else and leaves it unchanged", async () => {
    const { POST, setPublished } = await load();
    const { generations } = await import("@/lib/db.js");
    const { FakeCollection } = await import("@/test/mongo-fake.js");
    const actual = await vi.importActual("@/lib/generations.js");

    const collection = new FakeCollection();
    const { insertedId } = await collection.insertOne({
      userId: "somebody-else",
      kind: "image",
      status: "ready",
      url: "https://blob.test/image-1.png",
      isPublic: false,
      createdAt: new Date(),
    });
    const before = JSON.stringify(collection.docs[0]);

    generations.mockResolvedValue(collection);
    setPublished.mockImplementation(actual.setPublished);

    const response = await POST(...post(insertedId.toString(), { isPublic: true }));

    expect(response.status).toBe(404);
    await expect(response.text()).resolves.toBe("Not found");
    expect(JSON.stringify(collection.docs[0])).toBe(before);
  });

  it("returns 409 'Generation is not ready' when publishing something not ready", async () => {
    const { POST, setPublished } = await load();
    setPublished.mockResolvedValue("not-ready");

    const response = await POST(...post(ID, { isPublic: true }));

    expect(response.status).toBe(409);
    await expect(response.text()).resolves.toBe("Generation is not ready");
  });

  it("returns 500 with the error message when the module throws", async () => {
    const { POST, setPublished } = await load();
    setPublished.mockRejectedValue(new Error("Database unreachable"));

    const response = await POST(...post(ID, { isPublic: true }));

    expect(response.status).toBe(500);
    await expect(response.text()).resolves.toBe("Database unreachable");
  });
});
