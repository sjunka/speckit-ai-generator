import { describe, it, expect, vi, beforeEach } from "vitest";

// Stand in for Clerk: `clerkMiddleware` hands back the handler untouched, and
// `createRouteMatcher` compiles the same path patterns the real one accepts.
vi.mock("@clerk/nextjs/server", () => ({
  clerkMiddleware: (handler) => handler,
  createRouteMatcher: (patterns) => (request) => {
    const { pathname } = new URL(request.url);
    return patterns.some((pattern) =>
      new RegExp(`^${pattern.replace("(.*)", ".*")}$`).test(pathname)
    );
  },
}));

const protect = vi.fn();
let userId = null;
// The real `auth` passed into a clerkMiddleware handler is itself callable
// (returns the session) and also carries `.protect()`.
const auth = Object.assign(vi.fn(() => ({ userId })), { protect });

const visit = async (path) => {
  const { proxy } = await import("./proxy.js");
  return proxy(auth, new Request(`http://test${path}`));
};

beforeEach(() => {
  protect.mockClear();
  userId = null;
});

describe("middleware", () => {
  it.each(["/capture", "/result/job-12345", "/dashboard"])(
    "sends an anonymous request to %s through sign-in",
    async (path) => {
      await visit(path);
      expect(protect).toHaveBeenCalled();
    }
  );

  it("leaves the landing route public for a signed-out visitor", async () => {
    await visit("/");
    expect(protect).not.toHaveBeenCalled();
  });

  it("sends a signed-in visitor from the landing route to /capture", async () => {
    userId = "user-1";
    const response = await visit("/");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://test/capture");
  });
});
