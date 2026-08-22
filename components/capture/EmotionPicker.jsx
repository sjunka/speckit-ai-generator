import { EMOTIONS, LEVELS, LEVELLED } from "@/lib/emotions.js";

// The lists come from lib/emotions.js, never retyped. buildHint is not called
// here: the screen posts the emotion and the level, and the server composes the
// string the provider sees.
const selectClass =
  "h-11 rounded-[8px] border border-hairline bg-surface-1 px-3 text-ink focus:outline-2 focus:outline-offset-2 focus:outline-primary-focus/50";

export function EmotionPicker({ emotion, level, onChange, disabled }) {
  const takesLevel = LEVELLED.includes(emotion);

  const handleEmotion = (next) =>
    // Switching to an emotion that takes no level clears the level (FR-013).
    onChange({ emotion: next, level: LEVELLED.includes(next) ? level ?? LEVELS[1] : undefined });

  return (
    <div className="flex flex-col gap-2 md:flex-row md:gap-4">
      <div className="flex flex-1 flex-col gap-2">
        <label htmlFor="emotion" className="body-sm text-ink-muted">
          Emotion
        </label>
        <select
          id="emotion"
          value={emotion}
          onChange={(event) => handleEmotion(event.target.value)}
          disabled={disabled}
          className={selectClass}
        >
          {EMOTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {takesLevel && (
        <div className="flex flex-1 flex-col gap-2">
          <label htmlFor="level" className="body-sm text-ink-muted">
            Level
          </label>
          <select
            id="level"
            value={level ?? LEVELS[1]}
            onChange={(event) => onChange({ emotion, level: event.target.value })}
            disabled={disabled}
            className={selectClass}
          >
            {LEVELS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
