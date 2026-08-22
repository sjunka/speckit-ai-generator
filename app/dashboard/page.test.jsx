import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only");

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: { publicMetadata: { role: "admin" } } }),
  UserButton: () => null,
}));

vi.mock("@/lib/settings.js");
vi.mock("@/lib/db.js");
vi.mock("@/lib/models.js", () => ({
  COST_PER_IMAGE: 0.02,
  COST_PER_VIDEO: 0.1,
}));

describe("Dashboard page", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders three sections: switch, counters, and spend estimate", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    const { getSettings } = await import("@/lib/settings.js");
    const { db } = await import("@/lib/db.js");
    const Page = (await import("./page.jsx")).default;

    auth.mockResolvedValue({ userId: "owner-id", sessionClaims: { publicMetadata: { role: "admin" } } });
    getSettings.mockResolvedValue({ enabled: true });
    db.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        countDocuments: vi.fn().mockResolvedValue(0),
      }),
    });

    const component = await Page();
    render(component);

    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("shows generation switch reflecting stored state", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    const { getSettings } = await import("@/lib/settings.js");
    const { db } = await import("@/lib/db.js");
    const Page = (await import("./page.jsx")).default;

    auth.mockResolvedValue({ userId: "owner-id", sessionClaims: { publicMetadata: { role: "admin" } } });
    getSettings.mockResolvedValue({ enabled: false });
    db.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        countDocuments: vi.fn().mockResolvedValue(0),
      }),
    });

    const component = await Page();
    render(component);

    expect(screen.getByText(/paused/i)).toBeInTheDocument();
  });

  it("displays three counters", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    const { getSettings } = await import("@/lib/settings.js");
    const { db } = await import("@/lib/db.js");
    const Page = (await import("./page.jsx")).default;

    auth.mockResolvedValue({ userId: "owner-id", sessionClaims: { publicMetadata: { role: "admin" } } });
    getSettings.mockResolvedValue({ enabled: true });
    db.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        countDocuments: vi.fn().mockResolvedValue(0),
      }),
    });

    const component = await Page();
    render(component);

    expect(screen.getByText(/images/i)).toBeInTheDocument();
    expect(screen.getByText(/videos/i)).toBeInTheDocument();
    expect(screen.getByText(/today/i)).toBeInTheDocument();
  });

  it("shows estimated spend labelled as estimate", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    const { getSettings } = await import("@/lib/settings.js");
    const { db } = await import("@/lib/db.js");
    const Page = (await import("./page.jsx")).default;

    auth.mockResolvedValue({ userId: "owner-id", sessionClaims: { publicMetadata: { role: "admin" } } });
    getSettings.mockResolvedValue({ enabled: true });
    db.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        countDocuments: vi.fn().mockResolvedValue(0),
      }),
    });

    const component = await Page();
    render(component);

    expect(screen.getByText(/ESTIMATED MONTHLY/i)).toBeInTheDocument();
  });

  it("shows the configured video quality", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    const { getSettings } = await import("@/lib/settings.js");
    const { db } = await import("@/lib/db.js");
    const Page = (await import("./page.jsx")).default;

    auth.mockResolvedValue({ userId: "owner-id", sessionClaims: { publicMetadata: { role: "admin" } } });
    getSettings.mockResolvedValue({ enabled: true, videoQuality: "lite" });
    db.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        countDocuments: vi.fn().mockResolvedValue(0),
      }),
    });

    const component = await Page();
    render(component);

    expect(screen.getByText(/video quality/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/lite/i)).toBeInTheDocument();
  });

  it("returns 404 for non-owner", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    const Page = (await import("./page.jsx")).default;

    auth.mockResolvedValue({ userId: "other-user", sessionClaims: { publicMetadata: { role: "user" } } });

    const component = await Page();
    render(component);

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Not found")).toBeInTheDocument();
  });

  it("loads while generation is off", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    const { getSettings } = await import("@/lib/settings.js");
    const { db } = await import("@/lib/db.js");
    const Page = (await import("./page.jsx")).default;

    auth.mockResolvedValue({ userId: "owner-id", sessionClaims: { publicMetadata: { role: "admin" } } });
    getSettings.mockResolvedValue({ enabled: false });
    db.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        countDocuments: vi.fn().mockResolvedValue(0),
      }),
    });

    const component = await Page();
    const { container } = render(component);

    expect(container).toBeDefined();
  });
});
