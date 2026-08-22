"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card, Button, StatusBadge, Spinner } from "@/components/ui";
import { PhotoInput, PhotoPreview, HintInput } from "@/components/capture";
import { GeneratedResult } from "@/components/capture/GeneratedResult";
import { useElapsedSeconds } from "@/hooks/useElapsedSeconds";

const DEFAULT_MOOD = "I am feeling happy 😊";

export default function CapturePage() {
  const router = useRouter();
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [mood, setMood] = useState(DEFAULT_MOOD);
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

  const handleGenerate = async () => {
    if (!photo) return;

    setIsGenerating(true);
    setError("");
    setPaused(false);

    try {
      const response = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo: preview, hint: mood }),
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
            <HintInput value={mood} onChange={setMood} />
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
