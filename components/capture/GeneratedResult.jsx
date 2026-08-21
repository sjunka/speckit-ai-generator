import { useState } from "react";
import Image from "next/image";
import { Button, Spinner, CloseIcon } from "@/components/ui";

export const GeneratedResult = ({ photoUrl, imageUrl, onMakeVideo, isLoading, elapsedSeconds }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFullscreenLoading, setIsFullscreenLoading] = useState(false);

  if (!imageUrl) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {photoUrl && (
          <div className="space-y-2">
            <span className="eyebrow block">Original</span>
            <div className="relative w-full aspect-square bg-surface-1 border border-hairline rounded-[8px] overflow-hidden">
              <Image
                src={photoUrl}
                alt="Selected"
                fill
                sizes="(max-width: 768px) 50vw, 336px"
                className="object-contain"
              />
            </div>
          </div>
        )}
        <div className="space-y-2">
          <span className="eyebrow block">Generated image</span>
          <button
            type="button"
            onClick={() => {
              setIsFullscreenLoading(true);
              setIsFullscreen(true);
            }}
            className="relative w-full aspect-square bg-surface-1 border border-hairline rounded-[8px] overflow-hidden cursor-zoom-in"
          >
            <Image
              src={imageUrl}
              alt="Generated"
              fill
              sizes="(max-width: 768px) 50vw, 336px"
              className="object-contain"
            />
          </button>
        </div>
      </div>

      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 text-white"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
          <div className="relative w-full h-full max-w-3xl max-h-[48rem] m-4">
            {isFullscreenLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Spinner className="w-8 h-8 text-white" />
              </div>
            )}
            <Image
              src={imageUrl}
              alt="Generated"
              fill
              sizes="100vw"
              className="object-contain"
              onLoad={() => setIsFullscreenLoading(false)}
            />
          </div>
        </div>
      )}

      <Button
        variant="primary"
        onClick={onMakeVideo}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2"
      >
        {isLoading && <Spinner className="w-4 h-4" />}
        {isLoading ? `Starting video... ${elapsedSeconds}s` : "Make video"}
      </Button>
    </div>
  );
};
