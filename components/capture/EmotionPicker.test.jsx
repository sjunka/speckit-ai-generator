import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { EMOTIONS, LEVELS, LEVELLED } from "@/lib/emotions.js";
import { EmotionPicker } from "./EmotionPicker.jsx";

// A controlled pair, driven the way the capture screen drives it.
const Harness = ({ onChange = () => {} } = {}) => {
  const [state, setState] = useState({ emotion: EMOTIONS[0], level: undefined });

  return (
    <EmotionPicker
      emotion={state.emotion}
      level={state.level}
      onChange={(next) => {
        setState(next);
        onChange(next);
      }}
    />
  );
};

const emotionSelect = () => screen.getByLabelText("Emotion");
const levelSelect = () => screen.getByLabelText("Level");

describe("EmotionPicker", () => {
  it("offers exactly the three emotions, with happy selected and no free-text alternative", () => {
    render(<Harness />);

    const options = [...emotionSelect().options].map((option) => option.value);
    expect(options).toEqual(["happy", "angry", "sad"]);
    expect(emotionSelect().value).toBe("happy");
    expect(document.querySelector('input[type="text"]')).toBeNull();
  });

  it("takes its lists from lib/emotions.js rather than retyping them", () => {
    render(<Harness />);

    const options = [...emotionSelect().options];
    expect(options.map((option) => option.value)).toEqual(EMOTIONS);
    expect(options.map((option) => option.textContent)).toEqual(EMOTIONS);
  });

  it("shows no level selector for happy", () => {
    render(<Harness />);

    expect(screen.queryByLabelText("Level")).toBeNull();
  });

  it("reveals a level selector with quite preselected when angry is chosen", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await userEvent.selectOptions(emotionSelect(), "angry");

    expect(levelSelect().value).toBe("quite");
    expect([...levelSelect().options].map((option) => option.value)).toEqual(["a bit", "quite", "very"]);
    expect([...levelSelect().options].map((option) => option.textContent)).toEqual(LEVELS);
    expect(onChange).toHaveBeenCalledWith({ emotion: "angry", level: "quite" });
  });

  it("reveals the same level selector for sad", async () => {
    render(<Harness />);

    await userEvent.selectOptions(emotionSelect(), "sad");

    expect(levelSelect().value).toBe("quite");
    expect(LEVELLED).toContain("sad");
  });

  it("reports the level the reader picks", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await userEvent.selectOptions(emotionSelect(), "sad");
    await userEvent.selectOptions(levelSelect(), "very");

    expect(onChange).toHaveBeenLastCalledWith({ emotion: "sad", level: "very" });
  });

  // FR-013: switching back removes the selector and clears the level.
  it("removes the level selector and clears the level when happy is chosen again", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await userEvent.selectOptions(emotionSelect(), "angry");
    await userEvent.selectOptions(emotionSelect(), "happy");

    expect(screen.queryByLabelText("Level")).toBeNull();
    expect(onChange).toHaveBeenLastCalledWith({ emotion: "happy", level: undefined });
  });

  it("labels its two controls Emotion and Level", async () => {
    render(<Harness />);

    expect(screen.getByText("Emotion")).toBeInTheDocument();

    await userEvent.selectOptions(emotionSelect(), "angry");
    expect(screen.getByText("Level")).toBeInTheDocument();
  });
});
