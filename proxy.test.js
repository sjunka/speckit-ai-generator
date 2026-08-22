import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  clerkMiddleware: (handler) => handler,
  createRouteMatcher: (patterns) => (request) => {
    const { pathname } = new URL(request.url);
    return patterns.some((pattern) => new RegExp(`^${pattern.replace("(.*)", ".*")}$`).test(pathname));
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
});
