import fs from "node:fs";
import path from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, vi } from "vitest";
import { setupServer } from "msw/node";
import { renderAt360px } from "@/test/viewport.js";
import { assertBodyTextContrast } from "@/test/contrast.js";
import * as galleryComponents from "@/components/gallery";
import { handlers } from "@/test/msw/handlers.js";
import { ITEM_IMAGE, ITEM_PRE_002 } from "@/test/fixtures.js";
import GalleryPage from "./page.jsx";

// The first page is a direct module call on the server, so both seams are
// mocked here: the query module and the session.
vi.mock("@/lib/generations.js", () => ({
  listByUser: vi.fn(),
  PAGE_SIZE: 12,
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@clerk/nextjs", () => ({
  UserButton: () => null,
  useUser: () => ({ user: { publicMetadata: {} } }),
}));

const { listByUser } = await import("@/lib/generations.js");
const { auth } = await import("@clerk/nextjs/server");

const server = setupServer(...handlers);
const requested = vi.fn();
const started = () => requested();

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
  server.events.on("request:start", started);
});
beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ userId: "user_owner" });
  listByUser.mockResolvedValue({ items: [ITEM_IMAGE, ITEM_PRE_002], hasMore: true });
});
afterEach(() => server.resetHandlers());
afterAll(() => {
  server.events.removeListener("request:start", started);
  server.close();
});

describe("Gallery screen — rendered on the server", () => {
  it("renders the Gallery heading", async () => {
    // An async Server Component is not rendered by render(): await the page
    // function and render what it returns (plan trap 2).
    render(await GalleryPage());

    expect(screen.getByRole("heading", { name: "Gallery" })).toBeInTheDocument();
  });

  it("asks the module for the session's own first page (FR-002, SC-001)", async () => {
    render(await GalleryPage());

    expect(listByUser).toHaveBeenCalledTimes(1);
    expect(listByUser).toHaveBeenCalledWith("user_owner", 0);
  });

  it("leaves no HTTP request behind — the first page is one module call (FR-006, SC-006)", async () => {
    render(await GalleryPage());

    expect(requested).not.toHaveBeenCalled();
  });

  it("renders the first page it was given", async () => {
    render(await GalleryPage());

    expect(screen.getAllByTestId("card")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Load more" })).toBeInTheDocument();
  });

  it("shows the empty state when the module returns no items (FR-007)", async () => {
    listByUser.mockResolvedValue({ items: [], hasMore: false });

    render(await GalleryPage());

    expect(screen.getByText("Nothing here yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Capture something" })).toHaveAttribute("href", "/capture");
  });
});

// FR-029 is about what is written, not about what jsdom lays out: these read
// the source of the files this block owns.
const source = (file) => fs.readFileSync(path.join(process.cwd(), file), "utf-8");

const GALLERY_FILES = [
  "app/gallery/page.jsx",
  "components/gallery/GenerationCard.jsx",
  "components/gallery/GalleryList.jsx",
  "components/gallery/PublishToggle.jsx",
  "components/Nav.jsx",
];

describe("Gallery screen — the barrel", () => {
  it("re-exports every component this block adds under components/gallery/", () => {
    expect(Object.keys(galleryComponents).sort()).toEqual([
      "GalleryList",
      "GenerationCard",
      "PublishToggle",
    ]);
  });

  it("is what the screen imports through", () => {
    expect(source("app/gallery/page.jsx")).toMatch(/from "@\/components\/gallery"/);
  });
});

describe("Gallery screen — FR-029", () => {
  it("carries no raw palette hex outside app/globals.css", () => {
    GALLERY_FILES.forEach((file) => {
      expect(source(file), `${file} carries a raw hex`).not.toMatch(/#[0-9a-f]{3}\b|#[0-9a-f]{6}\b/i);
    });
  });

  it("uses no max-width media query — the direction stays greppable", () => {
    GALLERY_FILES.forEach((file) => {
      expect(source(file), `${file} shrinks instead of widening`).not.toMatch(/max-width/);
    });
  });

  it("is written 360px-first and widened with md: and lg:", () => {
    const screenSource = source("app/gallery/page.jsx");

    expect(screenSource).toMatch(/\bw-full\b/);
    expect(screenSource).toMatch(/\bmd:/);
    expect(screenSource).toMatch(/\blg:/);
  });

  it("starts at one column and widens the grid", () => {
    const listSource = source("components/gallery/GalleryList.jsx");

    expect(listSource).toMatch(/grid-cols-1/);
    expect(listSource).toMatch(/md:grid-cols-/);
    expect(listSource).toMatch(/lg:grid-cols-/);
  });

  it("renders at 360px with nothing wider than the viewport", async () => {
    const { container, cleanup } = renderAt360px(await GalleryPage());

    container.querySelectorAll("*").forEach((element) => {
      expect(element.className.toString()).not.toMatch(/\bw-\[\d{3,}px\]/);
    });

    cleanup();
  });

  it("gives every control 44px of height and a visible focus ring", async () => {
    render(await GalleryPage());

    screen.getAllByRole("button").forEach((control) => {
      expect(control).toHaveClass("h-11");
      expect(control.className).toMatch(/focus:outline-2/);
    });

    screen.getAllByRole("link").forEach((control) => {
      expect(control.className).toMatch(/h-10|h-11|focus:outline-2/);
    });
  });

  it("clears 4.5:1 for body text on the canvas and on every surface step", () => {
    assertBodyTextContrast();
  });
});
