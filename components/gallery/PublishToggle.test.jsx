import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { handlers } from "@/test/msw/handlers.js";
import { ITEM_IMAGE, ITEM_PENDING_VIDEO } from "@/test/fixtures.js";
import { PublishToggle } from "./PublishToggle.jsx";

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const toggle = () => screen.getByRole("button", { name: /publish/i });

describe("PublishToggle", () => {
  it("reads Publish for an item that is not public", () => {
    render(<PublishToggle item={ITEM_IMAGE} />);

    expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument();
  });

  it("reads Unpublish for an item that is public", () => {
    render(<PublishToggle item={{ ...ITEM_IMAGE, isPublic: true }} />);

    expect(screen.getByRole("button", { name: "Unpublish" })).toBeInTheDocument();
  });

  it("posts the flag to the item's own publish route and flips its label on a 200", async () => {
    let body;
    let path;
    server.use(
      http.post("/api/generation/:id/publish", async ({ request, params }) => {
        body = await request.json();
        path = params.id;
        return HttpResponse.json({ id: params.id, isPublic: body.isPublic }, { status: 200 });
      })
    );

    render(<PublishToggle item={ITEM_IMAGE} />);
    await userEvent.click(toggle());

    await waitFor(() => expect(screen.getByRole("button", { name: "Unpublish" })).toBeInTheDocument());
    expect(body).toEqual({ isPublic: true });
    expect(path).toBe(ITEM_IMAGE.id);
  });

  it("posts isPublic false when unpublishing, and flips back", async () => {
    let body;
    server.use(
      http.post("/api/generation/:id/publish", async ({ request, params }) => {
        body = await request.json();
        return HttpResponse.json({ id: params.id, isPublic: body.isPublic }, { status: 200 });
      })
    );

    render(<PublishToggle item={{ ...ITEM_IMAGE, isPublic: true }} />);
    await userEvent.click(toggle());

    await waitFor(() => expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument());
    expect(body).toEqual({ isPublic: false });
  });

  it("leaves the label where it was, re-enables and shows no message on a non-200", async () => {
    server.use(
      http.post("/api/generation/:id/publish", () =>
        new HttpResponse("Generation is not ready", { status: 409 })
      )
    );

    render(<PublishToggle item={ITEM_IMAGE} />);
    await userEvent.click(toggle());

    await waitFor(() => expect(screen.getByRole("button", { name: "Publish" })).toBeEnabled());
    expect(screen.queryByRole("button", { name: "Unpublish" })).toBeNull();
    expect(screen.queryByText(/not ready|failed|error|try again/i)).toBeNull();
  });

  it("shows no message when the request itself fails", async () => {
    server.use(http.post("/api/generation/:id/publish", () => HttpResponse.error()));

    render(<PublishToggle item={ITEM_IMAGE} />);
    await userEvent.click(toggle());

    await waitFor(() => expect(screen.getByRole("button", { name: "Publish" })).toBeEnabled());
    expect(screen.queryByText(/failed|error|try again/i)).toBeNull();
  });

  // FR-016: nothing to publish until the generation is ready.
  it("renders nothing for an item whose status is not ready", () => {
    const { container } = render(<PublishToggle item={ITEM_PENDING_VIDEO} />);

    expect(container).toBeEmptyDOMElement();
  });
});
