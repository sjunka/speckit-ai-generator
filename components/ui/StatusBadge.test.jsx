import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  describe("variants", () => {
    it("renders success badge with success class", () => {
      const { container } = render(<StatusBadge variant="success">Done</StatusBadge>);
      const badge = container.querySelector("[data-testid='status-badge']");
      expect(badge.className).toContain("bg-success");
    });

    it("renders pending badge with primary class", () => {
      const { container } = render(<StatusBadge variant="pending">Processing</StatusBadge>);
      const badge = container.querySelector("[data-testid='status-badge']");
      expect(badge.className).toContain("bg-primary");
    });

    it("renders failed badge with surface-3 class", () => {
      const { container } = render(<StatusBadge variant="failed">Error</StatusBadge>);
      const badge = container.querySelector("[data-testid='status-badge']");
      expect(badge.className).toContain("bg-surface-3");
    });

    it("renders pending by default", () => {
      const { container } = render(<StatusBadge>Status</StatusBadge>);
      const badge = container.querySelector("[data-testid='status-badge']");
      expect(badge.className).toContain("bg-primary");
    });
  });

  describe("tokens", () => {
    it("uses ink color for text", () => {
      const { container } = render(<StatusBadge>Done</StatusBadge>);
      const badge = container.querySelector("[data-testid='status-badge']");
      expect(badge.className).toContain("text-ink");
    });
  });

  describe("rendering", () => {
    it("renders with text content", () => {
      const { container } = render(<StatusBadge>Success</StatusBadge>);
      const badge = container.querySelector("[data-testid='status-badge']");
      expect(badge.textContent).toBe("Success");
    });

    it("has proper badge styling", () => {
      const { container } = render(<StatusBadge>Status</StatusBadge>);
      const badge = container.querySelector("[data-testid='status-badge']");
      expect(badge.className).toContain("rounded-[4px]");
      expect(badge.className).toContain("inline-block");
    });
  });

  it("keeps its own styles when given a className", () => {
    const { getByTestId } = render(
      <StatusBadge variant="pending" className="mb-2">Pending</StatusBadge>
    );
    const badge = getByTestId("status-badge");
    expect(badge.className).toContain("mb-2");
    expect(badge.className).toContain("bg-primary");
  });
});
