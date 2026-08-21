import Image from "next/image";

export const PhotoPreview = ({ photoUrl }) => {
  if (!photoUrl) return null;

  return (
    <div className="space-y-2">
      <span className="eyebrow block">Preview</span>
      <div className="relative w-full aspect-square bg-surface-1 border border-hairline rounded-[8px] overflow-hidden">
        <Image
          src={photoUrl}
          alt="Selected"
          fill
          sizes="(max-width: 768px) 100vw, 672px"
          className="object-contain"
        />
      </div>
    </div>
  );
};
