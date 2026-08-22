import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ITEM_IMAGE, ITEM_PENDING_VIDEO, ITEM_PRE_002 } from "@/test/fixtures.js";
import { GenerationCard } from "./GenerationCard";

// A ready video is the fourth shape the card has to render. The fixtures carry
// a pending one, because that is the case with a rule of its own (FR-004).
const READY_VIDEO = {
  ...ITEM_PENDING_VIDEO,
  status: "ready",
  url: "https://blob.test/video-1.mp4",
};

const player = () => screen.queryByTestId("video-player");
const emotion = () => screen.queryByTestId("emotion");
const level = () => screen.queryByTestId("level");

describe("GenerationCard — each entry as its own kind (FR-004)", () => {
  it("renders an image entry as an image carrying its url", () => {
    render(<GenerationCard item={ITEM_IMAGE} />);

    expect(screen.getByRole("img")).toHaveAttribute("src", ITEM_IMAGE.url);
    expect(player()).not.toBeInTheDocument();
  });

  it("renders a ready video entry as a player carrying its url", () => {
    render(<GenerationCard item={READY_VIDEO} />);

    expect(player()).toHaveAttribute("src", READY_VIDEO.url);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders a pending video entry as a pending badge reading Rendering, and no player", () => {
    render(<GenerationCard item={ITEM_PENDING_VIDEO} />);

    const badge = screen.getByTestId("status-badge");
    expect(badge).toHaveTextContent("Rendering");
    expect(badge).toHaveClass("bg-primary");
    expect(player()).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});

describe("GenerationCard — the recorded emotion (FR-005)", () => {
  it("renders an emotion and its level verbatim, in separate elements", () => {
    render(<GenerationCard item={ITEM_IMAGE} />);

    expect(emotion()).toHaveTextContent(ITEM_IMAGE.emotion);
    expect(level()).toHaveTextContent(ITEM_IMAGE.level);
    expect(emotion()).not.toBe(level());
    expect(emotion()).not.toContainElement(level());
  });

  it("renders no level for an emotion that carries none", () => {
    render(<GenerationCard item={{ ...ITEM_IMAGE, emotion: "happy", level: null }} />);

    expect(emotion()).toHaveTextContent("happy");
    expect(level()).not.toBeInTheDocument();
  });

  it("renders a pre-002 entry with no emotion label rather than failing", () => {
    render(<GenerationCard item={ITEM_PRE_002} />);

    expect(screen.getByRole("img")).toHaveAttribute("src", ITEM_PRE_002.url);
    expect(emotion()).not.toBeInTheDocument();
    expect(level()).not.toBeInTheDocument();
  });

  it("displays the stored strings verbatim — no emoji and no lookup table", () => {
    const { container } = render(<GenerationCard item={ITEM_IMAGE} />);

    expect(container.textContent).toMatch(/angry/);
    expect(container.textContent).not.toMatch(/[\u{1F600}-\u{1F64F}]/u);
    expect(container.textContent).not.toMatch(/Angry|I am feeling/);
  });
});
