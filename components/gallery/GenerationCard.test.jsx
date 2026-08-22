import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ITEM_IMAGE, ITEM_PENDING_VIDEO, ITEM_PRE_002 } from "@/test/fixtures.js";
import { GenerationCard } from "./GenerationCard.jsx";

const readyVideo = {
  ...ITEM_PENDING_VIDEO,
  status: "ready",
  url: "https://blob.test/video-1.mp4",
};

describe("GenerationCard", () => {
  it("renders an image entry as an image at its own url", () => {
    render(<GenerationCard item={ITEM_IMAGE} />);

    const image = screen.getByRole("img");
    expect(image).toHaveAttribute("src", ITEM_IMAGE.url);
    expect(document.querySelector("video")).toBeNull();
  });

  it("renders a ready video entry as a player at its own url", () => {
    render(<GenerationCard item={readyVideo} />);

    const player = document.querySelector("video");
    expect(player).toHaveAttribute("src", readyVideo.url);
    expect(screen.queryByRole("img")).toBeNull();
  });

  // FR-004.
  it("renders a pending video as a pending badge reading Rendering, with no player", () => {
    render(<GenerationCard item={ITEM_PENDING_VIDEO} />);

    const badge = screen.getByTestId("status-badge");
    expect(badge).toHaveTextContent("Rendering");
    expect(badge.className).toContain("bg-primary");
    expect(document.querySelector("video")).toBeNull();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("renders an emotion and a level verbatim, in separate elements", () => {
    render(<GenerationCard item={ITEM_IMAGE} />);

    const emotion = screen.getByText("angry");
    const level = screen.getByText("quite");
    expect(emotion).toBeInTheDocument();
    expect(level).toBeInTheDocument();
    expect(emotion).not.toBe(level);
    expect(emotion).not.toContainElement(level);
    // The stored strings, verbatim: no emoji and no capitalisation.
    expect(emotion.textContent).toBe("angry");
    expect(level.textContent).toBe("quite");
    expect(document.body.textContent).not.toMatch(/😊|😠|😢/);
  });

  it("renders no level for an emotion that has none", () => {
    render(<GenerationCard item={{ ...ITEM_IMAGE, emotion: "happy", level: null }} />);

    expect(screen.getByText("happy")).toBeInTheDocument();
    expect(screen.queryByText("quite")).toBeNull();
    expect(screen.queryByTestId("level")).toBeNull();
  });

  // FR-005: a pre-002 entry renders without an emotion label rather than failing.
  it("renders an entry with neither emotion nor level, showing no emotion label", () => {
    render(<GenerationCard item={ITEM_PRE_002} />);

    expect(screen.getByRole("img")).toHaveAttribute("src", ITEM_PRE_002.url);
    expect(screen.queryByTestId("emotion")).toBeNull();
    expect(screen.queryByTestId("level")).toBeNull();
  });

  it("renders whatever control the list places inside it", () => {
    render(
      <GenerationCard item={ITEM_IMAGE}>
        <button type="button">Publish</button>
      </GenerationCard>
    );

    expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument();
  });
});
