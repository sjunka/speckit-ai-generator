"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export function GeneratedResult({ originalSrc, generatedSrc, onMakeVideo, isLoading = false }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!generatedSrc) return null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="eyebrow text-ink-subtle">Original</p>
          <img src={originalSrc} alt="Original preview" className="mt-2 aspect-square w-full object-contain rounded-[8px] border border-hairline" />
        </div>
        <div>
          <p className="eyebrow text-ink-subtle">Generated image</p>
          <button
            type="button"
            aria-label="Generated result"
            onClick={() => setIsFullscreen(true)}
            className="mt-2 block w-full overflow-hidden rounded-[8px] border border-hairline bg-surface-1 focus:outline-2 focus:outline-offset-2 focus:outline-primary-focus/50"
          >
            <img src={generatedSrc} alt="Generated result" className="aspect-square w-full object-contain" />
          </button>
        </div>
      </div>
      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" role="dialog" aria-label="Generated result">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setIsFullscreen(false)}
            className="absolute right-4 top-4 h-11 rounded-[8px] bg-surface-2 px-4 text-ink focus:outline-2 focus:outline-offset-2 focus:outline-primary-focus/50"
          >
            Close
          </button>
          <img src={generatedSrc} alt="Generated result" className="max-h-full max-w-full object-contain" />
        </div>
      )}
      <Button type="button" onClick={onMakeVideo} disabled={isLoading} className="w-full">
        {isLoading ? "Starting video..." : "Make video"}
      </Button>
    </div>
  );
}
