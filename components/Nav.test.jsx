import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

const user = { current: { publicMetadata: {} } };

vi.mock("@clerk/nextjs", () => ({
  UserButton: () => null,
  useUser: () => ({ user: user.current }),
}));

const renderNav = async () => {
  const { Nav } = await import("./Nav.jsx");
  return render(<Nav />);
};

describe("Nav", () => {
  it("links to the gallery and the wall beside the existing capture link", async () => {
    user.current = { publicMetadata: {} };

    await renderNav();

    expect(screen.getByRole("link", { name: "Capture" })).toHaveAttribute("href", "/capture");
    expect(screen.getByRole("link", { name: "Gallery" })).toHaveAttribute("href", "/gallery");
    expect(screen.getByRole("link", { name: "Wall" })).toHaveAttribute("href", "/wall");
  });

  it("hides the dashboard link from a non-admin", async () => {
    user.current = { publicMetadata: { role: "user" } };

    await renderNav();

    expect(screen.queryByRole("link", { name: "Dashboard" })).toBeNull();
  });

  it("still shows the dashboard link to an admin", async () => {
    user.current = { publicMetadata: { role: "admin" } };

    await renderNav();

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/dashboard");
  });

  it("renders for a signed-out visitor without failing", async () => {
    user.current = null;

    await renderNav();

    expect(screen.getByRole("link", { name: "Wall" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Dashboard" })).toBeNull();
  });
});
