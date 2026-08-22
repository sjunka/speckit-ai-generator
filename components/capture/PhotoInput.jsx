export function PhotoInput({ value, onChange, disabled }) {
  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onChange(file);
    }
    event.target.value = "";
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="photo" className="body-sm text-ink-muted">
        Photo
      </label>
      <input
        id="photo"
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
        disabled={disabled}
      />
      <label
        htmlFor="photo"
        className="inline-flex h-11 items-center justify-center rounded-[8px] bg-surface-2 px-4 text-ink hover:bg-surface-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary-focus/50 cursor-pointer"
      >
        Choose photo
      </label>
      {value && <span className="body-sm text-ink-subtle">{value.name}</span>}
    </div>
  );
}
