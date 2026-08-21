"use client";

import { useState } from "react";
import { Button, DownloadIcon, ShareIcon } from "@/components/ui";

// Feature-detect once at render: a platform that cannot share files must not
// render the control at all (result-sharing spec).
const canShareFiles = () => {
  if (typeof navigator === "undefined" || !navigator.canShare) return false;
  try {
    return navigator.canShare({
      files: [new File([], "video.mp4", { type: "video/mp4" })],
    });
  } catch {
    return false;
  }
};

export const VideoResult = ({ videoUrl, jobId }) => {
  const [shareable] = useState(canShareFiles);

  const handleShare = async () => {
    try {
      // videoUrl is the provider's own domain and has no CORS headers, so it
      // can't be fetched directly from the browser — go through our proxy.
      const response = await fetch(`/api/video/${jobId}/file`);
      if (!response.ok) return;

      const blob = await response.blob();
      await navigator.share({
        title: "My video",
        files: [new File([blob], "video.mp4", { type: "video/mp4" })],
      });
    } catch {
      // Share is a bonus action; download still works if this fails.
    }
  };

  return (
    <div className="space-y-4">
      <video
        data-testid="video-player"
        src={videoUrl}
        controls
        playsInline
        className="w-full rounded-[8px] border border-hairline bg-surface-1"
      />

      <div className="flex flex-col gap-3 md:flex-row">
        <a
          href={videoUrl}
          download="video.mp4"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-primary body text-ink hover:bg-primary-light focus:outline-2 focus:outline-offset-2 focus:outline-primary-focus/50"
        >
          <DownloadIcon />
          Download
        </a>

        {shareable && (
          <Button variant="secondary" onClick={handleShare} className="w-full flex items-center justify-center gap-2">
            <ShareIcon />
            Share
          </Button>
        )}
      </div>
    </div>
  );
};
