import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  describe("variants", () => {
    it("renders primary button", () => {
      const { container } = render(<Button variant="primary">Click</Button>);
      const button = container.querySelector("button");
      expect(button.className).toContain("bg-primary");
    });

    it("renders secondary button", () => {
      const { container } = render(<Button variant="secondary">Click</Button>);
      const button = container.querySelector("button");
      expect(button.className).toContain("bg-surface-2");
    });

    it("renders tertiary button", () => {
      const { container } = render(<Button variant="tertiary">Click</Button>);
      const button = container.querySelector("button");
      expect(button.className).toContain("bg-surface-3");
    });

    it("renders primary by default", () => {
      const { container } = render(<Button>Click</Button>);
      const button = container.querySelector("button");
      expect(button.className).toContain("bg-primary");
    });
  });

  describe("className prop", () => {
    it("keeps its own styles when given a className", () => {
      const { container } = render(<Button className="w-full">Click</Button>);
      const button = container.querySelector("button");
      expect(button.className).toContain("w-full");
      expect(button.className).toContain("bg-primary");
      expect(button.className).toContain("h-11");
    });
  });

  describe("border radius", () => {
    it("has 8px border radius via rounded-[8px] class", () => {
      const { container } = render(<Button>Click</Button>);
      const button = container.querySelector("button");
      expect(button.className).toContain("rounded-[8px]");
    });
  });

  describe("focus ring", () => {
    it("includes focus ring styles", () => {
      const { container } = render(<Button>Click</Button>);
      const button = container.querySelector("button");
      expect(button.className).toContain("focus:outline-2");
      expect(button.className).toContain("focus:outline-primary-focus/50");
    });

    it("shows focus on keyboard navigation", async () => {
      const user = userEvent.setup();
      const { container } = render(<Button>Click</Button>);
      const button = container.querySelector("button");

      await user.tab();
      expect(button).toHaveFocus();
    });
  });

  describe("touch height", () => {
    it("has h-11 class for 44px height", () => {
      const { container } = render(<Button>Click</Button>);
      const button = container.querySelector("button");
      expect(button.className).toContain("h-11");
    });
  });

  describe("accessibility", () => {
    it("is keyboard accessible", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      const { container } = render(<Button onClick={handleClick}>Click</Button>);
      const button = container.querySelector("button");

      await user.tab();
      expect(button).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(handleClick).toHaveBeenCalled();
    });

    it("renders with proper button semantics", () => {
      const { container } = render(<Button>Click</Button>);
      const button = container.querySelector("button");
      expect(button.tagName).toBe("BUTTON");
      expect(button.textContent).toBe("Click");
    });
  });
});
