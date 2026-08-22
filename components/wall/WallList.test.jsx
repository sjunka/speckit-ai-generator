import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { handlers } from "@/test/msw/handlers.js";
import { ITEM_IMAGE, ITEM_PRE_002 } from "@/test/fixtures.js";
import { WallList } from "./WallList.jsx";

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

const published = (item) => ({ ...item, isPublic: true });
const items = [published(ITEM_IMAGE), published(ITEM_PRE_002)];
const loadMore = () => screen.getByRole("button", { name: "Load more" });

describe("WallList", () => {
  it("renders the items it was seeded with and fetches nothing on mount", async () => {
    render(<WallList items={items} hasMore={true} page={0} />);

    expect(screen.getAllByTestId("card")).toHaveLength(2);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(requests).toHaveLength(0);
  });

  it("asks for the next wall page on the click only, and appends the result", async () => {
    render(<WallList items={items} hasMore={true} page={0} />);

    await userEvent.click(loadMore());

    await waitFor(() => expect(screen.getAllByTestId("card").length).toBeGreaterThan(2));
    expect(requests).toHaveLength(1);
    expect(requests[0]).toContain("/api/wall?page=1");
  });

  it("hides the control once the last page has arrived", async () => {
    render(<WallList items={items} hasMore={true} page={0} />);

    await userEvent.click(loadMore());

    await waitFor(() => expect(screen.queryByRole("button", { name: "Load more" })).toBeNull());
  });

  it("renders no control at all when there is no more to load", () => {
    render(<WallList items={items} hasMore={false} page={0} />);

    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
  });

  it("leaves the list untouched when the page request fails", async () => {
    render(<WallList items={items} hasMore={true} page={0} />);
    server.use(http.get("/api/wall", () => new HttpResponse("Invalid page", { status: 400 })));

    await userEvent.click(loadMore());

    await waitFor(() => expect(loadMore()).toBeEnabled());
    expect(screen.getAllByTestId("card")).toHaveLength(2);
  });

  it("renders its own empty state", () => {
    render(<WallList items={[]} hasMore={false} page={0} />);

    expect(screen.getByText("Nothing published yet.")).toBeInTheDocument();
    expect(screen.queryByText("Nothing here yet.")).toBeNull();
    expect(screen.queryByRole("link", { name: "Capture something" })).toBeNull();
  });

  // FR-019: the wall carries no publish control anywhere.
  it("shows no publish control on any entry", async () => {
    render(<WallList items={items} hasMore={true} page={0} />);

    expect(screen.queryByRole("button", { name: /^(Publish|Unpublish)$/ })).toBeNull();

    await userEvent.click(loadMore());
    await waitFor(() => expect(screen.getAllByTestId("card").length).toBeGreaterThan(2));
    expect(screen.queryByRole("button", { name: /^(Publish|Unpublish)$/ })).toBeNull();
  });

  it("reuses the gallery's card rather than duplicating it", async () => {
    const source = (await import("node:fs")).readFileSync(
      `${process.cwd()}/components/wall/WallList.jsx`,
      "utf8"
    );

    expect(source).toMatch(/components\/gallery/);
    expect(source).not.toMatch(/PublishToggle/);
  });
});
