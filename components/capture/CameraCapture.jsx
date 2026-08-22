"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";

const stopStream = (stream) => stream?.getTracks().forEach((track) => track.stop());

// A denied camera says nothing: the file picker beside this control is still
// the whole flow, so there is no error copy here (FR-024).
export function CameraCapture({ onPhoto, disabled }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [facingMode, setFacingMode] = useState("environment");
  const [isOn, setIsOn] = useState(false);

  // ponytail: the one useEffect in this feature. Leaving the screen is not an
  // event a handler sees, and FR-025 requires the camera released when the
  // reader leaves, so the cleanup is the only place that release can live.
  useEffect(() => () => stopStream(streamRef.current), []);

  const start = async (mode) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode } });

      // The previous stream is released before the new preview is attached.
      stopStream(streamRef.current);
      streamRef.current = stream;
      setFacingMode(mode);
      setIsOn(true);

      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      stop();
    }
  };

  const stop = () => {
    stopStream(streamRef.current);
    streamRef.current = null;
    setIsOn(false);
  };

  const take = () => {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 720;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      // A Blob is not a File, and the rest of the flow expects what the file
      // picker produces, so the conversion happens here at the boundary.
      onPhoto(new File([blob], `camera-${Date.now()}.png`, { type: blob.type || "image/png" }));
      stop();
    }, "image/png");
  };

  if (!isOn) {
    return (
      <Button
        type="button"
        variant="secondary"
        onClick={() => start(facingMode)}
        disabled={disabled}
        className="w-full"
      >
        Turn camera on
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <video
        ref={(node) => {
          videoRef.current = node;
          if (node && streamRef.current) node.srcObject = streamRef.current;
        }}
        autoPlay
        playsInline
        muted
        className="aspect-square w-full rounded-[8px] border border-hairline bg-surface-2 object-cover"
      />
      <div className="flex flex-col gap-2 md:flex-row">
        <Button type="button" onClick={take} className="w-full md:flex-1">
          Take photo
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => start(facingMode === "environment" ? "user" : "environment")}
          className="w-full md:flex-1"
        >
          Switch camera
        </Button>
        <Button type="button" variant="tertiary" onClick={stop} className="w-full md:flex-1">
          Turn camera off
        </Button>
      </div>
    </div>
  );
}
