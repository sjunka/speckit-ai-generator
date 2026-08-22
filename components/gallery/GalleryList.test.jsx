import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "@/test/msw/handlers.js";
import { ITEM_IMAGE, ITEM_PENDING_VIDEO, ITEM_PRE_002 } from "@/test/fixtures.js";
import { GalleryList } from "./GalleryList.jsx";

const server = setupServer(...handlers);

const requests = [];

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
  server.events.on("request:start", ({ request }) => requests.push(request.url));
});
afterEach(() => {
  server.resetHandlers();
  requests.length = 0;
});
afterAll(() => server.close());

const items = [ITEM_IMAGE, ITEM_PENDING_VIDEO, ITEM_PRE_002];
const loadMore = () => screen.getByRole("button", { name: "Load more" });

describe("GalleryList", () => {
  // FR-006, SC-006: seeded from the server render, nothing on mount.
  it("renders the items it was seeded with and fetches nothing on mount", async () => {
    render(<GalleryList items={items} hasMore={true} page={0} />);

    expect(screen.getAllByTestId("card")).toHaveLength(3);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(requests).toHaveLength(0);
  });

  it("asks for the next page on the Load more click only, and appends the result", async () => {
    render(<GalleryList items={items} hasMore={true} page={0} />);

    await userEvent.click(loadMore());

    await waitFor(() => expect(screen.getAllByTestId("card").length).toBeGreaterThan(3));
    expect(requests).toHaveLength(1);
    expect(requests[0]).toContain("/api/gallery?page=1");
    // The seeded items are still there: the page appends, it does not replace.
    expect(screen.getByRole("img", { name: /generation/i })).toBeInTheDocument();
  });

  it("hides the control once the last page has arrived", async () => {
    render(<GalleryList items={items} hasMore={true} page={0} />);

    await userEvent.click(loadMore());

    await waitFor(() => expect(screen.queryByRole("button", { name: "Load more" })).toBeNull());
  });

  it("renders no control at all when there is no more to load", () => {
    render(<GalleryList items={items} hasMore={false} page={0} />);

    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
  });

  it("leaves the list untouched when the page request fails", async () => {
    render(<GalleryList items={items} hasMore={true} page={0} />);
    const before = screen.getAllByTestId("card").length;

    const { http, HttpResponse } = await import("msw");
    server.use(http.get("/api/gallery", () => new HttpResponse("Invalid page", { status: 400 })));

    await userEvent.click(loadMore());

    await waitFor(() => expect(loadMore()).toBeEnabled());
    expect(screen.getAllByTestId("card")).toHaveLength(before);
  });

  // FR-007.
  it("renders the empty state with a link to capture when there is nothing to show", () => {
    render(<GalleryList items={[]} hasMore={false} page={0} />);

    expect(screen.getByText("Nothing here yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Capture something" })).toHaveAttribute("href", "/capture");
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
  });

  it("renders a publish control for each ready item", () => {
    render(<GalleryList items={items} hasMore={false} page={0} />);

    // Two of the three fixtures are ready; the pending video carries no control.
    expect(screen.getAllByRole("button", { name: /^(Publish|Unpublish)$/ })).toHaveLength(2);
  });
});
