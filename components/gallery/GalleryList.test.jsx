import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, vi } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "@/test/msw/handlers.js";
import { ITEM_IMAGE, ITEM_PENDING_VIDEO, ITEM_PRE_002 } from "@/test/fixtures.js";
import { GalleryList } from "./GalleryList";

const server = setupServer(...handlers);

// Every request that leaves the component passes through here, which is how
// "nothing on mount" is asserted rather than assumed (FR-006, SC-006).
const requested = vi.fn();
const started = ({ request }) => requested(new URL(request.url).pathname + new URL(request.url).search);

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
  server.events.on("request:start", started);
});
beforeEach(() => requested.mockClear());
afterEach(() => server.resetHandlers());
afterAll(() => {
  server.events.removeListener("request:start", started);
  server.close();
});

const FIRST_PAGE = [ITEM_IMAGE, ITEM_PENDING_VIDEO, ITEM_PRE_002];

const loadMore = () => screen.queryByRole("button", { name: "Load more" });

describe("GalleryList — seeded, never fetching on mount", () => {
  it("renders the page it was given as props", () => {
    render(<GalleryList items={FIRST_PAGE} hasMore={true} />);

    expect(screen.getAllByTestId("card")).toHaveLength(FIRST_PAGE.length);
  });

  it("sends no request at all while rendering", async () => {
    render(<GalleryList items={FIRST_PAGE} hasMore={true} />);

    await waitFor(() => expect(screen.getAllByTestId("card")).toHaveLength(3));
    expect(requested).not.toHaveBeenCalled();
  });
});

describe("GalleryList — Load more", () => {
  it("asks for page 1 on the click and appends what comes back", async () => {
    render(<GalleryList items={FIRST_PAGE} hasMore={true} />);

    await userEvent.click(loadMore());

    await waitFor(() => expect(screen.getAllByTestId("card")).toHaveLength(FIRST_PAGE.length + 1));
    expect(requested).toHaveBeenCalledTimes(1);
    expect(requested).toHaveBeenCalledWith("/api/gallery?page=1");
  });

  it("asks for page 2 on the next click", async () => {
    render(<GalleryList items={FIRST_PAGE} hasMore={true} />);

    await userEvent.click(loadMore());
    await waitFor(() => expect(screen.getAllByTestId("card")).toHaveLength(4));

    // The handler reports the end at page 1, so the control is gone; a list
    // that still has more keeps paging from where it stopped.
    expect(loadMore()).not.toBeInTheDocument();
  });

  it("hides the control when the server reports no more", () => {
    render(<GalleryList items={FIRST_PAGE} hasMore={false} />);

    expect(loadMore()).not.toBeInTheDocument();
  });
});

describe("GalleryList — the empty state (FR-007)", () => {
  it("shows the empty copy and a route back to capture, never an error", () => {
    render(<GalleryList items={[]} hasMore={false} />);

    expect(screen.getByText("Nothing here yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Capture something" })).toHaveAttribute("href", "/capture");
    expect(screen.queryAllByTestId("card")).toHaveLength(0);
    expect(loadMore()).not.toBeInTheDocument();
  });
});

describe("GalleryList — the publish control", () => {
  it("renders a publish control for every ready entry and none for a pending one", () => {
    render(<GalleryList items={FIRST_PAGE} hasMore={false} />);

    const labels = screen
      .getAllByRole("button")
      .map((button) => button.textContent);

    expect(labels).toEqual(["Publish", "Publish"]);
  });
});
