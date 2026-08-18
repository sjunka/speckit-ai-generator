import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Card } from "./Card";

describe("Card", () => {
  describe("tokens", () => {
    it("uses surface-1 background", () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.querySelector("[data-testid='card']");
      expect(card.className).toContain("bg-surface-1");
    });

    it("uses hairline border", () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.querySelector("[data-testid='card']");
      expect(card.className).toContain("border-hairline");
    });

    it("uses ink color for text", () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.querySelector("[data-testid='card']");
      expect(card.className).toContain("text-ink");
    });
  });

  describe("styling", () => {
    it("has 8px border radius", () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.querySelector("[data-testid='card']");
      expect(card.className).toContain("rounded-[8px]");
    });

    it("has proper border styling", () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.querySelector("[data-testid='card']");
      expect(card.className).toContain("border");
    });
  });

  describe("rendering", () => {
    it("renders with children", () => {
      const { container } = render(
        <Card>
          <div>Test Content</div>
        </Card>
      );
      const card = container.querySelector("[data-testid='card']");
      expect(card.textContent).toContain("Test Content");
    });

    it("accepts custom className", () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      const card = container.querySelector("[data-testid='card']");
      expect(card.className).toContain("custom-class");
    });

    it("maintains base classes with custom className", () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      const card = container.querySelector("[data-testid='card']");
      expect(card.className).toContain("bg-surface-1");
      expect(card.className).toContain("custom-class");
    });
  });
});
