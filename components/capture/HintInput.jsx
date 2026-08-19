import { HINT_OPTIONS } from "./hintOptions";

export const HintInput = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      <label htmlFor="hint" className="eyebrow block">Mood</label>
      <select
        id="hint"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 px-3 rounded-[8px] bg-surface-1 text-ink border border-hairline focus:outline-2 focus:outline-offset-2 focus:outline-primary-focus/50 body"
      >
        {HINT_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};
