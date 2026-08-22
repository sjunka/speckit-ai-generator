export function VideoPlayer({ src }) {
  return (
    <video
      data-testid="video-player"
      controls
      playsInline
      className="w-full rounded-[8px] border border-hairline bg-surface-1"
      src={src}
    />
  );
}
