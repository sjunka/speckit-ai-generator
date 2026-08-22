"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card, Button, StatusBadge, Spinner } from "@/components/ui";
import { PhotoInput, PhotoPreview, EmotionPicker, CameraCapture } from "@/components/capture";
import { GeneratedResult } from "@/components/capture/GeneratedResult";
import { useElapsedSeconds } from "@/hooks/useElapsedSeconds";
import { EMOTIONS, LEVELS, LEVELLED } from "@/lib/emotions.js";

const DEFAULT_EMOTION = EMOTIONS[0];
const DEFAULT_LEVEL = LEVELS[1];

export default function CapturePage() {
  const router = useRouter();
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [emotion, setEmotion] = useState(DEFAULT_EMOTION);
  const [level, setLevel] = useState(DEFAULT_LEVEL);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [paused, setPaused] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [isStartingVideo, setIsStartingVideo] = useState(false);
  const elapsedSeconds = useElapsedSeconds(isGenerating);

  const handlePhotoSelect = async (file) => {
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);
    setError("");
  };

  const handleEmotionChange = (nextEmotion) => {
    setEmotion(nextEmotion);
    if (LEVELLED.includes(nextEmotion)) {
      setLevel(DEFAULT_LEVEL);
    } else {
      setLevel(undefined);
    }
  };

  const handleGenerate = async () => {
    if (!photo) return;

    setIsGenerating(true);
    setError("");
    setPaused(false);

    try {
      const payload = { photo: preview, emotion };
      if (LEVELLED.includes(emotion) && level) payload.level = level;

      const response = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 503) {
        setPaused(true);
        setIsGenerating(false);
        return;
      }

      if (!response.ok) {
        setError(response.status === 502 ? "Image provider is down. Try again shortly." : "Generation failed. Try again.");
        setIsGenerating(false);
        return;
      }

      const data = await response.json();
      setImageUrl(data.imageUrl || "");
      setIsGenerating(false);
    } catch {
      setError("Generation failed. Try again.");
      setIsGenerating(false);
    }
  };

  const handleMakeVideo = async () => {
    if (!imageUrl) return;
    setIsStartingVideo(true);
    try {
      const response = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        setIsStartingVideo(false);
        return;
      }

      const data = await response.json();
      router.push(`/result/${data.jobId}`);
    } catch {
      setIsStartingVideo(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-4 py-6 md:max-w-2xl lg:max-w-4xl">
      <Nav />
      <h1 className="display-sm">Capture</h1>

      <Card className="space-y-4 p-4">
        {!imageUrl && (
          <>
            <PhotoInput value={photo} onChange={handlePhotoSelect} disabled={isGenerating || paused} />
            <PhotoPreview src={preview} />
            <CameraCapture onPhoto={handlePhotoSelect} />
            <EmotionPicker value={emotion} level={level} onChange={handleEmotionChange} onLevelChange={setLevel} />
          </>
        )}

        {paused && (
          <div className="flex items-center gap-2 rounded-[8px] border border-hairline bg-surface-2 p-3">
            <StatusBadge variant="pending">Generation paused</StatusBadge>
            <span className="body-sm text-ink-muted">Generation is currently paused. Check back later.</span>
          </div>
        )}

        {error && !paused ? <p className="body-sm text-ink-muted">{error}</p> : null}

        {!imageUrl && (
          <Button type="button" onClick={handleGenerate} disabled={!photo || isGenerating || paused} className="w-full">
            {isGenerating ? (
              <span className="inline-flex items-center gap-2">
                <Spinner className="h-4 w-4" />
                Generating... {elapsedSeconds}s
              </span>
            ) : (
              "Generate"
            )}
          </Button>
        )}

        <GeneratedResult
          originalSrc={preview}
          generatedSrc={imageUrl}
          onMakeVideo={handleMakeVideo}
          isLoading={isStartingVideo}
        />
      </Card>
    </main>
  );
}
