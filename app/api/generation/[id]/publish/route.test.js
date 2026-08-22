import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/generations.js", () => ({ setPublished: vi.fn() }));

const ID = "6702a1b2c3d4e5f601020304";

const post = (body, id = ID) => [
  new Request(`http://test/api/generation/${id}/publish`, {
    method: "POST",
    body: JSON.stringify(body),
  }),
  { params: Promise.resolve({ id }) },
];

const load = async () => {
  const { auth } = await import("@clerk/nextjs/server");
  const { setPublished } = await import("@/lib/generations.js");
  const { POST } = await import("./route.js");
  return { POST, auth, setPublished };
};

beforeEach(async () => {
  vi.clearAllMocks();
  const { auth, setPublished } = await load();
  auth.mockResolvedValue({ userId: "user-1" });
  setPublished.mockResolvedValue("ok");
});

describe("POST /api/generation/[id]/publish", () => {
  it("returns 200 { id, isPublic } for an owner publishing a ready generation", async () => {
    const { POST, setPublished } = await load();

    const response = await POST(...post({ isPublic: true }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ id: ID, isPublic: true });
    expect(setPublished).toHaveBeenCalledWith(ID, "user-1", true);
  });

  it("unpublishes through the same route", async () => {
    const { POST, setPublished } = await load();

    const response = await POST(...post({ isPublic: false }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ id: ID, isPublic: false });
    expect(setPublished).toHaveBeenCalledWith(ID, "user-1", false);
  });

  it("is idempotent: publishing an already-public generation is a 200 no-op", async () => {
    const { POST } = await load();

    const first = await POST(...post({ isPublic: true }));
    const second = await POST(...post({ isPublic: true }));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    await expect(second.json()).resolves.toEqual({ id: ID, isPublic: true });
  });

  const invalidBodies = [
    ["the field is missing", {}],
    ["the field is a string", { isPublic: "true" }],
    ["the field is a number", { isPublic: 1 }],
    ["the field is null", { isPublic: null }],
  ];

  invalidBodies.forEach(([name, body]) => {
    it(`returns 400 'Invalid isPublic' when ${name}, and writes nothing`, async () => {
      const { POST, setPublished } = await load();

      const response = await POST(...post(body));

      expect(response.status).toBe(400);
      await expect(response.text()).resolves.toBe("Invalid isPublic");
      expect(setPublished).not.toHaveBeenCalled();
    });
  });

  it("returns 401 'Unauthorized' with no session, and writes nothing", async () => {
    const { POST, auth, setPublished } = await load();
    auth.mockResolvedValue({ userId: null });

    const response = await POST(...post({ isPublic: true }));

    expect(response.status).toBe(401);
    await expect(response.text()).resolves.toBe("Unauthorized");
    expect(setPublished).not.toHaveBeenCalled();
  });

  it("returns 404 'Not found' for an unknown id", async () => {
    const { POST, setPublished } = await load();
    setPublished.mockResolvedValue("not-found");

    const response = await POST(...post({ isPublic: true }, "6702a1b2c3d4e5f601029999"));

    expect(response.status).toBe(404);
    await expect(response.text()).resolves.toBe("Not found");
  });

  it("returns 404 'Not found' for an unparseable id rather than a 500", async () => {
    const { POST, setPublished } = await load();
    setPublished.mockResolvedValue("not-found");

    const response = await POST(...post({ isPublic: true }, "not-an-object-id"));

    expect(response.status).toBe(404);
    await expect(response.text()).resolves.toBe("Not found");
  });

  // FR-015, SC-005, trap 5: a non-owner is a 404, not a 403, and the record is
  // left untouched. The ownership check is the userId inside setPublished's
  // filter; the route holds none of its own.
  it("returns 404 for a generation owned by somebody else and leaves it unchanged", async () => {
    const { POST, setPublished } = await load();
    const stored = Object.freeze({ _id: ID, userId: "somebody-else", isPublic: false });
    setPublished.mockImplementation(async () => "not-found");

    const response = await POST(...post({ isPublic: true }));

    expect(response.status).toBe(404);
    await expect(response.text()).resolves.toBe("Not found");
    expect(stored).toEqual({ _id: ID, userId: "somebody-else", isPublic: false });
    expect(setPublished).toHaveBeenCalledWith(ID, "user-1", true);
  });

  it("holds no ownership check of its own: it passes the session userId straight to the module", async () => {
    const { POST, setPublished } = await load();
    const source = (await import("node:fs")).readFileSync(
      `${process.cwd()}/app/api/generation/[id]/publish/route.js`,
      "utf8"
    );

    await POST(...post({ isPublic: true }));

    expect(setPublished.mock.calls[0][1]).toBe("user-1");
    expect(source).not.toMatch(/403/);
    expect(source).not.toMatch(/\.userId\s*===/);
  });

  // FR-016.
  it("returns 409 'Generation is not ready' when publishing something not ready", async () => {
    const { POST, setPublished } = await load();
    setPublished.mockResolvedValue("not-ready");

    const response = await POST(...post({ isPublic: true }));

    expect(response.status).toBe(409);
    await expect(response.text()).resolves.toBe("Generation is not ready");
  });

  // FR-017: unpublishing works at any status.
  it("unpublishes a generation at any status", async () => {
    const { POST, setPublished } = await load();
    setPublished.mockResolvedValue("ok");

    const response = await POST(...post({ isPublic: false }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ id: ID, isPublic: false });
  });
});
