import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { TextInput } from "./TextInput";

describe("TextInput", () => {
  describe("tokens", () => {
    it("uses ink and surface-1 classes", () => {
      const { container } = render(<TextInput />);
      const input = container.querySelector("input");
      expect(input.className).toContain("bg-surface-1");
      expect(input.className).toContain("text-ink");
    });

    it("uses hairline border", () => {
      const { container } = render(<TextInput />);
      const input = container.querySelector("input");
      expect(input.className).toContain("border-hairline");
    });
  });

  describe("focus ring", () => {
    it("includes focus ring styles", () => {
      const { container } = render(<TextInput />);
      const input = container.querySelector("input");
      expect(input.className).toContain("focus:outline-2");
      expect(input.className).toContain("focus:outline-primary-focus/50");
    });

    it("shows focus on keyboard navigation", async () => {
      const user = userEvent.setup();
      const { container } = render(<TextInput />);
      const input = container.querySelector("input");

      await user.tab();
      expect(input).toHaveFocus();
    });
  });

  describe("touch height", () => {
    it("has h-11 class for 44px height", () => {
      const { container } = render(<TextInput />);
      const input = container.querySelector("input");
      expect(input.className).toContain("h-11");
    });
  });

  describe("accessibility", () => {
    it("accepts placeholder text", () => {
      const { container } = render(<TextInput placeholder="Enter text" />);
      const input = container.querySelector("input");
      expect(input.placeholder).toBe("Enter text");
    });

    it("accepts disabled state", () => {
      const { container } = render(<TextInput disabled />);
      const input = container.querySelector("input");
      expect(input.disabled).toBe(true);
    });

    it("accepts input", async () => {
      const user = userEvent.setup();
      const { container } = render(<TextInput />);
      const input = container.querySelector("input");

      await user.type(input, "test");
      expect(input.value).toBe("test");
    });
  });

  it("keeps its own styles when given a className", () => {
    const { container } = render(<TextInput className="mt-2" />);
    const input = container.querySelector("input");
    expect(input.className).toContain("mt-2");
    expect(input.className).toContain("h-11");
  });
});
