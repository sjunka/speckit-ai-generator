import { EMOTIONS, LEVELS, LEVELLED } from "@/lib/emotions.js";

export function EmotionPicker({ value = EMOTIONS[0], level = LEVELS[1], onChange, onLevelChange }) {
  const isLevelled = LEVELLED.includes(value);
  const currentLevel = isLevelled && LEVELS.includes(level) ? level : LEVELS[1];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="emotion" className="body-sm text-ink-muted">
          Emotion
        </label>
        <select
          id="emotion"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          className="h-11 rounded-[8px] border border-hairline bg-surface-1 px-3 text-ink focus:outline-2 focus:outline-offset-2 focus:outline-primary-focus/50"
        >
          {EMOTIONS.map((emotion) => (
            <option key={emotion} value={emotion}>
              {emotion}
            </option>
          ))}
        </select>
      </div>

      {isLevelled && (
        <div className="flex flex-col gap-2">
          <label htmlFor="level" className="body-sm text-ink-muted">
            Level
          </label>
          <select
            id="level"
            value={currentLevel}
            onChange={(event) => onLevelChange?.(event.target.value)}
            className="h-11 rounded-[8px] border border-hairline bg-surface-1 px-3 text-ink focus:outline-2 focus:outline-offset-2 focus:outline-primary-focus/50"
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
