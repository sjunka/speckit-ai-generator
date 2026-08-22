import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ITEM_IMAGE, ITEM_PENDING_VIDEO } from "@/test/fixtures.js";

// Trap 2: an async Server Component is not rendered by render(). Await the page
// function and render what it returns.
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/generations.js", () => ({ listByUser: vi.fn() }));
vi.mock("@clerk/nextjs", () => ({
  UserButton: () => null,
  useUser: () => ({ user: { publicMetadata: {} } }),
}));

const load = async () => {
  const { auth } = await import("@clerk/nextjs/server");
  const { listByUser } = await import("@/lib/generations.js");
  const GalleryPage = (await import("./page.jsx")).default;
  return { GalleryPage, auth, listByUser };
};

beforeEach(async () => {
  vi.clearAllMocks();
  const { auth, listByUser } = await load();
  auth.mockResolvedValue({ userId: "user-1" });
  listByUser.mockResolvedValue({ items: [ITEM_IMAGE, ITEM_PENDING_VIDEO], hasMore: false });
});

describe("Gallery page", () => {
  it("renders the Gallery heading", async () => {
    const { GalleryPage } = await load();

    render(await GalleryPage());

    expect(screen.getByRole("heading", { name: "Gallery" })).toBeInTheDocument();
  });

  it("reads the first page on the server, for the session's own userId", async () => {
    const { GalleryPage, listByUser } = await load();

    render(await GalleryPage());

    expect(listByUser).toHaveBeenCalledWith("user-1", 0);
    expect(screen.getAllByTestId("card")).toHaveLength(2);
  });

  // FR-006, SC-006: no HTTP leaves the render.
  it("makes no HTTP request while rendering", async () => {
    const { GalleryPage } = await load();
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    render(await GalleryPage());

    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("shows the empty state when the module returns no items", async () => {
    const { GalleryPage, listByUser } = await load();
    listByUser.mockResolvedValue({ items: [], hasMore: false });

    render(await GalleryPage());

    expect(screen.getByText("Nothing here yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Capture something" })).toHaveAttribute("href", "/capture");
  });
});

// T014 — FR-029, asserted against the composed screen.
describe("Gallery screen — responsive and accessible", () => {
  it("widens the layout at md and lg", async () => {
    const { GalleryPage } = await load();

    render(await GalleryPage());

    expect(screen.getByRole("main")).toHaveClass("md:max-w-2xl", "lg:max-w-4xl");
  });

  it("fits 360px without a horizontal scroll", async () => {
    const { GalleryPage } = await load();
    const { renderAt360px } = await import("@/test/viewport.js");

    const { container, cleanup } = renderAt360px(await GalleryPage());

    expect(container.scrollWidth).toBeLessThanOrEqual(360);
    cleanup();
  });

  it("gives every control a 44px height and a visible focus ring", async () => {
    const { GalleryPage, listByUser } = await load();
    listByUser.mockResolvedValue({ items: [ITEM_IMAGE], hasMore: true });

    render(await GalleryPage());

    screen.getAllByRole("button").forEach((control) => {
      expect(control.className).toMatch(/h-11/);
      expect(control.className).toMatch(/focus:outline/);
    });
  });

  it("clears 4.5:1 for body text on every surface step", async () => {
    const { assertBodyTextContrast } = await import("@/test/contrast.js");

    assertBodyTextContrast();
  });

  it("uses no raw palette hex outside app/globals.css", async () => {
    const { readFileSync } = await import("node:fs");
    const files = [
      "app/gallery/page.jsx",
      "app/wall/page.jsx",
      "components/gallery/GenerationCard.jsx",
      "components/gallery/GalleryList.jsx",
      "components/gallery/PublishToggle.jsx",
      "components/wall/WallList.jsx",
      "components/Nav.jsx",
    ];

    files.forEach((file) => {
      expect(readFileSync(`${process.cwd()}/${file}`, "utf8")).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    });
  });
});
