import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, vi } from "vitest";
import { setupServer } from "msw/node";
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
