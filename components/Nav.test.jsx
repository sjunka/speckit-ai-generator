import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Nav } from "./Nav";

// 001 shipped this file with no colocated test; the two new links get one.
const user = { publicMetadata: {} };

vi.mock("@clerk/nextjs", () => ({
  UserButton: () => null,
  useUser: () => ({ user }),
}));

const link = (name) => screen.queryByRole("link", { name });

describe("Nav — the routes this feature adds", () => {
  it("links to the gallery", () => {
    render(<Nav />);

    expect(link("Gallery")).toHaveAttribute("href", "/gallery");
  });

  it("links to the wall", () => {
    render(<Nav />);

    expect(link("Wall")).toHaveAttribute("href", "/wall");
  });

  it("keeps the existing Capture link beside them", () => {
    render(<Nav />);

    expect(link("Capture")).toHaveAttribute("href", "/capture");

    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(["/capture", "/gallery", "/wall"]);
  });
});

describe("Nav — the admin link is unchanged", () => {
  it("hides Dashboard from a user who is not an admin", () => {
    user.publicMetadata = {};

    render(<Nav />);

    expect(link("Dashboard")).not.toBeInTheDocument();
  });

  it("shows Dashboard to an admin, alongside the new links", () => {
    user.publicMetadata = { role: "admin" };

    render(<Nav />);

    expect(link("Dashboard")).toHaveAttribute("href", "/dashboard");
    expect(link("Gallery")).toBeInTheDocument();
    expect(link("Wall")).toBeInTheDocument();

    user.publicMetadata = {};
  });
});
