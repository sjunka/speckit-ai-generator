import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { handlers } from "@/test/msw/handlers.js";
import { ITEM_IMAGE, ITEM_PENDING_VIDEO } from "@/test/fixtures.js";
import { PublishToggle } from "./PublishToggle";

// The screens test against the handlers and never against the routes, so this
// is the whole seam: the toggle is asserted against the plan's HTTP table.
const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const toggle = () => screen.getByRole("button");

const PUBLIC_ITEM = { ...ITEM_IMAGE, isPublic: true };

describe("PublishToggle — the label", () => {
  it("reads Publish for an item that is not public", () => {
    render(<PublishToggle item={ITEM_IMAGE} />);

    expect(toggle()).toHaveTextContent("Publish");
  });

  it("reads Unpublish for an item that is public", () => {
    render(<PublishToggle item={PUBLIC_ITEM} />);

    expect(toggle()).toHaveTextContent("Unpublish");
  });
});

describe("PublishToggle — posting the flag", () => {
  it("posts the flipped flag to the item's publish route and flips its label on a 200", async () => {
    const seen = vi.fn();
    server.use(
      http.post("/api/generation/:id/publish", async ({ request, params }) => {
        seen({ id: params.id, body: await request.json() });
        return HttpResponse.json({ id: params.id, isPublic: true }, { status: 200 });
      })
    );

    render(<PublishToggle item={ITEM_IMAGE} />);
    await userEvent.click(toggle());

    await waitFor(() => expect(toggle()).toHaveTextContent("Unpublish"));
    expect(seen).toHaveBeenCalledWith({
      id: ITEM_IMAGE.id,
      body: { isPublic: true },
    });
  });

  it("posts false when unpublishing, and flips back", async () => {
    const seen = vi.fn();
    server.use(
      http.post("/api/generation/:id/publish", async ({ request, params }) => {
        seen(await request.json());
        return HttpResponse.json({ id: params.id, isPublic: false }, { status: 200 });
      })
    );

    render(<PublishToggle item={PUBLIC_ITEM} />);
    await userEvent.click(toggle());

    await waitFor(() => expect(toggle()).toHaveTextContent("Publish"));
    expect(seen).toHaveBeenCalledWith({ isPublic: false });
  });
});

describe("PublishToggle — a failure says nothing", () => {
  it("leaves the label where it was, re-enables the control and shows no message", async () => {
    server.use(
      http.post("/api/generation/:id/publish", () =>
        new HttpResponse("Generation is not ready", { status: 409 })
      )
    );

    const { container } = render(<PublishToggle item={ITEM_IMAGE} />);
    await userEvent.click(toggle());

    await waitFor(() => expect(toggle()).toBeEnabled());
    expect(toggle()).toHaveTextContent("Publish");
    expect(container.textContent).toBe("Publish");
  });
});

describe("PublishToggle — only a ready generation carries one (FR-016)", () => {
  it("renders nothing for an item whose status is not ready", () => {
    const { container } = render(<PublishToggle item={ITEM_PENDING_VIDEO} />);

    expect(container).toBeEmptyDOMElement();
  });
});
