import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";

export function CameraCapture({ onPhoto }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isFacingBack, setIsFacingBack] = useState(true);
  const [hasCamera, setHasCamera] = useState(true);

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    if (!isCameraOn || !videoRef.current || !streamRef.current) return;

    videoRef.current.srcObject = streamRef.current;
    const playResult = typeof videoRef.current.play === "function" ? videoRef.current.play() : undefined;
    if (playResult && typeof playResult.catch === "function") {
      playResult.catch(() => {});
    }
  }, [isCameraOn]);

  useEffect(() => {
    return () => stopTracks();
  }, []);

  const turnOn = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setHasCamera(false);
      return;
    }

    stopTracks();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: isFacingBack ? "environment" : "user" },
      });
      streamRef.current = stream;
      setIsCameraOn(true);
      setHasCamera(true);
    } catch {
      setIsCameraOn(false);
      setHasCamera(false);
    }
  };

  const takePhoto = async () => {
    if (!videoRef.current || !streamRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return;
    const file = new File([blob], "camera-photo.png", { type: "image/png" });
    onPhoto?.(file);
    stopTracks();
    setIsCameraOn(false);
  };

  const switchCamera = async () => {
    const nextFacing = !isFacingBack;
    setIsFacingBack(nextFacing);
    stopTracks();
    setIsCameraOn(false);
    await turnOn();
  };

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-[8px] border border-hairline bg-surface-2">
        {isCameraOn ? (
          <video ref={videoRef} autoPlay playsInline muted className="aspect-square w-full object-cover" />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center text-ink-subtle body-sm">
            {hasCamera ? "Camera ready" : "Camera unavailable"}
          </div>
        )}
      </div>
      <div className="flex gap-2">
        {!isCameraOn ? (
          <Button type="button" variant="secondary" onClick={turnOn} className="flex-1">
            Turn camera on
          </Button>
        ) : (
          <Button type="button" variant="secondary" onClick={takePhoto} className="flex-1">
            Take photo
          </Button>
        )}
        {hasCamera && (
          <Button type="button" variant="secondary" onClick={switchCamera} className="flex-1">
            Switch camera
          </Button>
        )}
        {isCameraOn && (
          <Button type="button" variant="secondary" onClick={() => { stopTracks(); setIsCameraOn(false); }} className="flex-1">
            Turn camera off
          </Button>
        )}
      </div>
    </div>
  );
}
