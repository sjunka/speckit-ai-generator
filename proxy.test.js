import { describe, it, expect, vi, beforeEach } from "vitest";

// Captured so the wall can be asserted absent from the protected matcher, not
// merely unprotected by the mock's regex (FR-018).
const matcher = vi.hoisted(() => ({ patterns: [] }));

vi.mock("@clerk/nextjs/server", () => ({
  clerkMiddleware: (handler) => handler,
  createRouteMatcher: (patterns) => {
    matcher.patterns = patterns;
    return (request) => {
      const { pathname } = new URL(request.url);
      return patterns.some((pattern) => new RegExp(`^${pattern.replace("(.*)", ".*")}$`).test(pathname));
    };
  },
}));

const protect = vi.fn();
let userId = null;
const auth = Object.assign(vi.fn(() => ({ userId })), { protect });

const visit = async (path) => {
  const { proxy } = await import("./proxy.js");
  return proxy(auth, new Request(`http://test${path}`));
};

beforeEach(() => {
  protect.mockClear();
  userId = null;
});

describe("proxy", () => {
  it("protects an anonymous capture request", async () => {
    await visit("/capture");
    expect(protect).toHaveBeenCalled();
  });

  it("redirects a signed-in visitor from the landing route", async () => {
    userId = "user-1";
    const response = await visit("/");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://test/capture");
  });

  it("protects an anonymous gallery request", async () => {
    await visit("/gallery");
    expect(protect).toHaveBeenCalled();
  });

  it("leaves the wall open to a visitor with no session", async () => {
    const response = await visit("/wall");

    expect(protect).not.toHaveBeenCalled();
    expect(response).toBeUndefined();
  });

  it("treats the wall exactly like the public landing route for a signed-in visitor", async () => {
    userId = "user-1";
    const response = await visit("/wall");

    expect(protect).not.toHaveBeenCalled();
    expect(response).toBeUndefined();
  });

  it("keeps 001's three protected routes and adds only the gallery", async () => {
    await visit("/capture");

    expect(matcher.patterns).toEqual([
      "/capture(.*)",
      "/result(.*)",
      "/dashboard(.*)",
      "/gallery(.*)",
    ]);
  });

  it("never adds the wall to the protected matcher", async () => {
    await visit("/wall");

    expect(matcher.patterns.some((pattern) => pattern.includes("/wall"))).toBe(false);
  });
});
