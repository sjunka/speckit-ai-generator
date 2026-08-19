import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderAt360px } from "@/test/viewport.js";
import Landing from "./page.jsx";

const push = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

beforeEach(() => {
  push.mockClear();
});

describe("Landing page", () => {
  it("renders for an anonymous visitor", () => {
    renderAt360px(<Landing />);

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("shows exactly one call to action, and it routes to sign-in", async () => {
    render(<Landing />);

    const actions = [...screen.getAllByRole("button"), ...screen.queryAllByRole("link")];
    expect(actions).toHaveLength(1);

    await userEvent.click(actions[0]);
    expect(push).toHaveBeenCalledWith("/sign-in");
  });

  it("carries no features grid, FAQ, or pricing", () => {
    render(<Landing />);

    expect(screen.queryByText(/features/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/faq/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/pricing/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole("heading")).toHaveLength(1);
  });
});
