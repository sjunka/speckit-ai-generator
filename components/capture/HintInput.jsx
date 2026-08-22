const moods = [
  "I am feeling happy 😊",
  "I am feeling adventurous 🌍",
  "I am feeling playful 🎉",
  "I am feeling calm 🧘",
  "I am feeling energetic ⚡",
  "I am feeling curious 🔍",
  "I am feeling confident 💪",
  "I am feeling dreamy 🌙",
  "I am feeling grateful 🙏",
  "I am feeling bold 🔥",
];

export function HintInput({ value, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="mood" className="body-sm text-ink-muted">
        Mood
      </label>
      <select
        id="mood"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-[8px] border border-hairline bg-surface-1 px-3 text-ink focus:outline-2 focus:outline-offset-2 focus:outline-primary-focus/50"
      >
        {moods.map((mood) => (
          <option key={mood} value={mood}>
            {mood}
          </option>
        ))}
      </select>
    </div>
  );
}

export { moods };
