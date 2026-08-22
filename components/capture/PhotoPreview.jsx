export function PhotoPreview({ src, alt = "Selected photo" }) {
  if (!src) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-[8px] border border-dashed border-hairline bg-surface-2 text-ink-subtle body-sm">
        No photo selected
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[8px] border border-hairline bg-surface-1">
      <img src={src} alt={alt} className="aspect-square w-full object-contain" />
    </div>
  );
}
