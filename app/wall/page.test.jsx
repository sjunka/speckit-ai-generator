import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, vi } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "@/test/msw/handlers.js";
import { ITEM_IMAGE, ITEM_PRE_002 } from "@/test/fixtures.js";
import WallPage from "./page.jsx";

vi.mock("@/lib/generations.js", () => ({
  listPublic: vi.fn(),
  PAGE_SIZE: 12,
}));

// The session module is mocked so the test can prove the page never reaches
// for it — not so the page can use it.
const auth = vi.fn();
const redirect = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({ auth: (...args) => auth(...args) }));
vi.mock("next/navigation", () => ({ redirect: (...args) => redirect(...args) }));

const { listPublic } = await import("@/lib/generations.js");

const server = setupServer(...handlers);
const requested = vi.fn();
const started = () => requested();

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
  server.events.on("request:start", started);
});
beforeEach(() => {
  vi.clearAllMocks();
  listPublic.mockResolvedValue({
    items: [{ ...ITEM_IMAGE, isPublic: true }, { ...ITEM_PRE_002, isPublic: true }],
    hasMore: true,
  });
});
afterEach(() => server.resetHandlers());
afterAll(() => {
  server.events.removeListener("request:start", started);
  server.close();
});

describe("Wall screen — rendered on the server", () => {
  it("renders the Wall heading", async () => {
    render(await WallPage());

    expect(screen.getByRole("heading", { name: "Wall" })).toBeInTheDocument();
  });

  it("calls listPublic for the first page and nothing else", async () => {
    render(await WallPage());

    expect(listPublic).toHaveBeenCalledTimes(1);
    expect(listPublic).toHaveBeenCalledWith(0);
  });

  it("leaves no HTTP request behind", async () => {
    render(await WallPage());

    expect(requested).not.toHaveBeenCalled();
  });

  it("renders the first page it was given", async () => {
    render(await WallPage());

    expect(screen.getAllByTestId("card")).toHaveLength(2);
  });

  it("shows the empty state when nothing is published", async () => {
    listPublic.mockResolvedValue({ items: [], hasMore: false });

    render(await WallPage());

    expect(screen.getByText("Nothing published yet.")).toBeInTheDocument();
  });
});

describe("Wall screen — no session required (FR-018, SC-004)", () => {
  it("never calls auth() and never redirects", async () => {
    render(await WallPage());

    expect(auth).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("renders the same output with a session as without one", async () => {
    const withoutSession = render(await WallPage()).container.innerHTML;
    const withSession = render(await WallPage()).container.innerHTML;

    expect(withSession).toBe(withoutSession);
    expect(auth).not.toHaveBeenCalled();
  });
});
