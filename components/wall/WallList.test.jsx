import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, vi } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "@/test/msw/handlers.js";
import { ITEM_IMAGE, ITEM_PRE_002 } from "@/test/fixtures.js";
import { WallList } from "./WallList";

const server = setupServer(...handlers);

const requested = vi.fn();
const started = ({ request }) => {
  const url = new URL(request.url);
  requested(url.pathname + url.search);
};

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

const published = (item) => ({ ...item, isPublic: true });
const FIRST_PAGE = [published(ITEM_IMAGE), published(ITEM_PRE_002)];

const loadMore = () => screen.queryByRole("button", { name: "Load more" });

describe("WallList — seeded, never fetching on mount", () => {
  it("renders the page it was given as props", () => {
    render(<WallList items={FIRST_PAGE} hasMore={true} />);

    expect(screen.getAllByTestId("card")).toHaveLength(FIRST_PAGE.length);
  });

  it("sends no request at all while rendering (SC-006)", async () => {
    render(<WallList items={FIRST_PAGE} hasMore={true} />);

    await waitFor(() => expect(screen.getAllByTestId("card")).toHaveLength(2));
    expect(requested).not.toHaveBeenCalled();
  });
});

describe("WallList — Load more", () => {
  it("asks for page 1 on the click and appends what comes back", async () => {
    render(<WallList items={FIRST_PAGE} hasMore={true} />);

    await userEvent.click(loadMore());

    await waitFor(() => expect(screen.getAllByTestId("card")).toHaveLength(FIRST_PAGE.length + 1));
    expect(requested).toHaveBeenCalledTimes(1);
    expect(requested).toHaveBeenCalledWith("/api/wall?page=1");
  });

  it("hides the control when the server reports no more", () => {
    render(<WallList items={FIRST_PAGE} hasMore={false} />);

    expect(loadMore()).not.toBeInTheDocument();
  });
});

describe("WallList — the empty state", () => {
  it("reads Nothing published yet.", () => {
    render(<WallList items={[]} hasMore={false} />);

    expect(screen.getByText("Nothing published yet.")).toBeInTheDocument();
    expect(screen.queryAllByTestId("card")).toHaveLength(0);
  });

  it("offers no route back to capture — the wall is readable with no session", () => {
    render(<WallList items={[]} hasMore={false} />);

    expect(screen.queryByRole("link", { name: "Capture something" })).not.toBeInTheDocument();
  });
});

describe("WallList — no publish control anywhere (FR-017)", () => {
  it("renders neither Publish nor Unpublish for a ready published entry", () => {
    render(<WallList items={FIRST_PAGE} hasMore={false} />);

    expect(screen.queryByRole("button", { name: "Publish" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Unpublish" })).not.toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});

describe("WallList — the card it reuses", () => {
  it("renders the same entry shape the gallery does, emotion and all", () => {
    render(<WallList items={FIRST_PAGE} hasMore={false} />);

    expect(screen.getByTestId("emotion")).toHaveTextContent(ITEM_IMAGE.emotion);
    expect(screen.getByTestId("level")).toHaveTextContent(ITEM_IMAGE.level);
  });
});
