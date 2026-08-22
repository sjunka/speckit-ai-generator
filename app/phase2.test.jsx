import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./page";
import CapturePage from "./capture/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
}));

const routerPush = vi.fn();

vi.mock("@clerk/nextjs", () => ({
  ClerkProvider: ({ children }) => <>{children}</>,
  useUser: () => ({ user: null }),
  SignIn: ({ forceRedirectUrl }) => (
    <div data-testid="sign-in">Sign in redirect={forceRedirectUrl}</div>
  ),
  UserButton: () => <button type="button">User</button>,
}));

describe("Phase 2 landing screen", () => {
  it("renders the landing page copy and primary CTA", () => {
    render(<Home />);

    expect(screen.getByRole("main")).toHaveClass("md:max-w-lg", "lg:max-w-xl");
    expect(screen.getByText("Create videos from photos")).toBeInTheDocument();
    expect(screen.getByText("AI turns your ideas into reality.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start creating" })).toBeInTheDocument();
    expect(screen.queryByText(/pricing/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/faq/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/features/i)).not.toBeInTheDocument();
  });
});

describe("Phase 2 capture flow", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ imageUrl: "https://blob.test/generated.png" }),
    });
  });

  it("shows the emotion selector and photo preview", async () => {
    const user = userEvent.setup();
    render(<CapturePage />);

    expect(screen.getByRole("main")).toHaveClass("md:max-w-2xl", "lg:max-w-4xl");
    const input = document.getElementById("photo");
    expect(input).toHaveAttribute("accept", "image/*");
    expect(input).toHaveAttribute("capture", "environment");

    const emotion = screen.getByLabelText("Emotion");
    expect(emotion).toBeInTheDocument();
    expect(emotion.value).toBe("happy");
    expect(screen.getByRole("link", { name: "Capture" })).toHaveAttribute("href", "/capture");

    const file = new File(["hello"], "photo.png", { type: "image/png" });
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByAltText("Selected photo")).toHaveAttribute("src", expect.stringContaining("data:image/png"));
    });
  });

  it("shows the generated result overlay and starts a video handoff", async () => {
    const user = userEvent.setup();
    routerPush.mockClear();
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ imageUrl: "https://blob.test/generated.png" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ jobId: "job-12345" }),
      });

    render(<CapturePage />);
    const input = document.getElementById("photo");
    await user.upload(input, new File(["hello"], "photo.png", { type: "image/png" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Generate" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "Generate" }));

    expect(await screen.findByAltText("Generated result")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Generated result" }));
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Make video" }));
    await waitFor(() => expect(routerPush).toHaveBeenCalledWith("/result/job-12345"));
  });
});
