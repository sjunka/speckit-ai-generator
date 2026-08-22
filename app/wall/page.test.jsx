import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ITEM_IMAGE, ITEM_PRE_002 } from "@/test/fixtures.js";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/generations.js", () => ({ listPublic: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const published = (item) => ({ ...item, isPublic: true });

const load = async () => {
  const { auth } = await import("@clerk/nextjs/server");
  const { redirect } = await import("next/navigation");
  const { listPublic } = await import("@/lib/generations.js");
  const WallPage = (await import("./page.jsx")).default;
  return { WallPage, auth, redirect, listPublic };
};

beforeEach(async () => {
  vi.clearAllMocks();
  const { auth, listPublic } = await load();
  // No session, for every case here.
  auth.mockResolvedValue({ userId: null });
  listPublic.mockResolvedValue({
    items: [published(ITEM_IMAGE), published(ITEM_PRE_002)],
    hasMore: false,
  });
});

describe("Wall page", () => {
  it("renders the Wall heading", async () => {
    const { WallPage } = await load();

    render(await WallPage());

    expect(screen.getByRole("heading", { name: "Wall" })).toBeInTheDocument();
  });

  it("reads its first page on the server through listPublic(0)", async () => {
    const { WallPage, listPublic } = await load();

    render(await WallPage());

    expect(listPublic).toHaveBeenCalledWith(0);
    expect(listPublic.mock.calls[0]).toHaveLength(1);
    expect(screen.getAllByTestId("card")).toHaveLength(2);
  });

  // FR-018, SC-004.
  it("never calls auth() and never redirects", async () => {
    const { WallPage, auth, redirect } = await load();

    render(await WallPage());

    expect(auth).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("renders the same output with a session as without one", async () => {
    const { WallPage, auth } = await load();

    const anonymous = render(await WallPage()).container.innerHTML;
    auth.mockResolvedValue({ userId: "user-1" });
    const signedIn = render(await WallPage()).container.innerHTML;

    expect(signedIn).toBe(anonymous);
  });

  it("makes no HTTP request while rendering", async () => {
    const { WallPage } = await load();
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    render(await WallPage());

    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("shows the empty state when nothing is published", async () => {
    const { WallPage, listPublic } = await load();
    listPublic.mockResolvedValue({ items: [], hasMore: false });

    render(await WallPage());

    expect(screen.getByText("Nothing published yet.")).toBeInTheDocument();
  });
});

// T014 — FR-029, asserted against the composed screen.
describe("Wall screen — responsive and accessible", () => {
  it("widens the layout at md and lg", async () => {
    const { WallPage } = await load();

    render(await WallPage());

    expect(screen.getByRole("main")).toHaveClass("md:max-w-2xl", "lg:max-w-4xl");
  });

  it("fits 360px without a horizontal scroll", async () => {
    const { WallPage } = await load();
    const { renderAt360px } = await import("@/test/viewport.js");

    const { container, cleanup } = renderAt360px(await WallPage());

    expect(container.scrollWidth).toBeLessThanOrEqual(360);
    cleanup();
  });

  it("gives the load-more control a 44px height and a visible focus ring", async () => {
    const { WallPage, listPublic } = await load();
    listPublic.mockResolvedValue({ items: [published(ITEM_IMAGE)], hasMore: true });

    render(await WallPage());

    const control = screen.getByRole("button", { name: "Load more" });
    expect(control.className).toMatch(/h-11/);
    expect(control.className).toMatch(/focus:outline/);
  });
});
