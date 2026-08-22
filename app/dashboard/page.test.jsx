import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only");
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@clerk/nextjs", () => ({ useUser: () => ({ user: { publicMetadata: { role: "admin" } } }), UserButton: () => null }));
vi.mock("@/lib/settings.js");
vi.mock("@/lib/db.js");
vi.mock("@/lib/models.js", () => ({ COST_PER_IMAGE: 0.02, COST_PER_VIDEO: 0.1 }));

describe("dashboard", () => {
  beforeEach(() => vi.resetAllMocks());

  it("renders settings, quality, three counters, and estimated spend for admins", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    const { getSettings } = await import("@/lib/settings.js");
    const { db } = await import("@/lib/db.js");
    auth.mockResolvedValue({ userId: "owner", sessionClaims: { publicMetadata: { role: "admin" } } });
    getSettings.mockResolvedValue({ enabled: true, videoQuality: "lite" });
    db.mockResolvedValue({ db: () => ({ collection: () => ({ countDocuments: vi.fn().mockResolvedValue(2) }) }) });

    const Page = (await import("./page.jsx")).default;
    render(await Page());

    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByLabelText(/generation/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/video quality/i)).toHaveValue("lite");
    expect(screen.getByText(/images/i)).toBeInTheDocument();
    expect(screen.getByText(/videos/i)).toBeInTheDocument();
    expect(screen.getByText(/today/i)).toBeInTheDocument();
    expect(screen.getByText(/estimated/i)).toBeInTheDocument();
  });

  it("renders a value-free 404 for non-admins", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    auth.mockResolvedValue({ userId: "other", sessionClaims: { publicMetadata: { role: "user" } } });
    const Page = (await import("./page.jsx")).default;
    render(await Page());

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.queryByText("Settings")).not.toBeInTheDocument();
  });

  it("still renders while generation is paused", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    const { getSettings } = await import("@/lib/settings.js");
    const { db } = await import("@/lib/db.js");
    auth.mockResolvedValue({ userId: "owner", sessionClaims: { publicMetadata: { role: "admin" } } });
    getSettings.mockResolvedValue({ enabled: false, videoQuality: "turbo" });
    db.mockResolvedValue({ db: () => ({ collection: () => ({ countDocuments: vi.fn().mockResolvedValue(0) }) }) });
    const Page = (await import("./page.jsx")).default;

    render(await Page());
    expect(screen.getByText(/paused/i)).toBeInTheDocument();
  });
});
