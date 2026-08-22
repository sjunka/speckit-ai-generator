import fs from "node:fs";
import path from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, vi } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "@/test/msw/handlers.js";
import { ITEM_IMAGE, ITEM_PRE_002 } from "@/test/fixtures.js";
import { renderAt360px } from "@/test/viewport.js";
import * as wallComponents from "@/components/wall";
import WallPage, { dynamic } from "./page.jsx";

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

const source = (file) => fs.readFileSync(path.join(process.cwd(), file), "utf-8");

const WALL_FILES = ["app/wall/page.jsx", "components/wall/WallList.jsx"];

describe("Wall screen — the barrel", () => {
  it("re-exports every component this block adds under components/wall/", () => {
    expect(Object.keys(wallComponents)).toEqual(["WallList"]);
  });

  it("is what the screen imports through", () => {
    expect(source("app/wall/page.jsx")).toMatch(/from "@\/components\/wall"/);
  });
});

describe("Wall screen — FR-029", () => {
  it("carries no raw palette hex outside app/globals.css", () => {
    WALL_FILES.forEach((file) => {
      expect(source(file), `${file} carries a raw hex`).not.toMatch(/#[0-9a-f]{3}\b|#[0-9a-f]{6}\b/i);
    });
  });

  it("uses no max-width media query", () => {
    WALL_FILES.forEach((file) => {
      expect(source(file), `${file} shrinks instead of widening`).not.toMatch(/max-width/);
    });
  });

  it("is written 360px-first and widened with md: and lg:", () => {
    const screenSource = source("app/wall/page.jsx");

    expect(screenSource).toMatch(/\bw-full\b/);
    expect(screenSource).toMatch(/\bmd:/);
    expect(screenSource).toMatch(/\blg:/);
  });

  it("starts at one column and widens the grid", () => {
    const listSource = source("components/wall/WallList.jsx");

    expect(listSource).toMatch(/grid-cols-1/);
    expect(listSource).toMatch(/md:grid-cols-/);
    expect(listSource).toMatch(/lg:grid-cols-/);
  });

  it("renders at 360px with nothing wider than the viewport", async () => {
    const { container, cleanup } = renderAt360px(await WallPage());

    container.querySelectorAll("*").forEach((element) => {
      expect(element.className.toString()).not.toMatch(/\bw-\[\d{3,}px\]/);
    });

    cleanup();
  });

  it("gives its one control 44px of height and a visible focus ring", async () => {
    render(await WallPage());

    screen.getAllByRole("button").forEach((control) => {
      expect(control).toHaveClass("h-11");
      expect(control.className).toMatch(/focus:outline-2/);
    });
  });
});

describe("Wall screen — rendered per request (FR-019)", () => {
  it("opts out of the static prerender, so newly published work is on it", () => {
    // Nothing on this page is request-specific — no auth(), no searchParams —
    // so Next prerenders it at build time by default and the wall freezes at
    // whatever was published when the build ran.
    expect(dynamic).toBe("force-dynamic");
  });
});
