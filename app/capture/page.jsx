"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Button, Card, StatusBadge, Spinner } from "@/components/ui";
import { PhotoInput } from "@/components/capture/PhotoInput";
import { PhotoPreview } from "@/components/capture/PhotoPreview";
import { HintInput } from "@/components/capture/HintInput";
import { HINT_OPTIONS } from "@/components/capture/hintOptions";
import { GeneratedResult } from "@/components/capture/GeneratedResult";
import { useElapsedSeconds } from "@/hooks/useElapsedSeconds";

export default function CapturePage() {
  const [photo, setPhoto] = useState(null);
  const [hint, setHint] = useState(HINT_OPTIONS[0]);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGenerating, isSetGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const inputRef = useRef(null);
  const router = useRouter();
  const elapsedSeconds = useElapsedSeconds(isGenerating);

  const handleGenerate = async () => {
    if (!photo) return;

    isSetGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photo,
          hint: hint || undefined,
        }),
      });

      if (response.status === 503) {
        setIsPaused(true);
        isSetGenerating(false);
        return;
      }

      if (!response.ok) {
        setError(
          response.status === 502
            ? "Image provider is down. Try again shortly."
            : "Generation failed. Try again."
        );
        isSetGenerating(false);
        return;
      }

      const data = await response.json();
      setGeneratedImage(data.imageUrl);
    } catch (err) {
      setError("Generation failed. Try again.");
    } finally {
      isSetGenerating(false);
    }
  };

  const handleMakeVideo = async () => {
    if (!generatedImage) return;

    isSetGenerating(true);
    try {
      const response = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: generatedImage,
        }),
      });

      if (!response.ok) throw new Error("Failed to start video");

      const data = await response.json();
      router.push(`/result/${data.jobId}`);
    } catch (err) {
      setError("Failed to start video. Try again.");
      isSetGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink px-4 py-8">
      <div className="max-w-md mx-auto space-y-6">
        <Nav />
        <h1 className="display-sm">Capture</h1>

        {isPaused && (
          <div className="bg-surface-2 border border-hairline rounded-[8px] p-4">
            <StatusBadge variant="pending" className="mb-2">
              Generation paused
            </StatusBadge>
            <p className="body-sm text-ink-subtle">
              Generation is currently paused. Check back later.
            </p>
          </div>
        )}

        <Card>
          <div className="space-y-4">
            <PhotoInput onPhotoSelect={setPhoto} inputRef={inputRef} />
            {!generatedImage && <PhotoPreview photoUrl={photo} />}

            {!generatedImage && (
              <>
                <HintInput value={hint} onChange={setHint} />

                <Button
                  variant="primary"
                  onClick={handleGenerate}
                  disabled={!photo || isGenerating || isPaused}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {isGenerating && <Spinner className="w-4 h-4" />}
                  {isGenerating ? `Generating... ${elapsedSeconds}s` : "Generate"}
                </Button>
              </>
            )}

            {error && (
              <div className="bg-surface-2 border border-hairline rounded-[8px] p-3">
                <p className="body-sm text-ink-subtle">{error}</p>
              </div>
            )}

            {generatedImage && (
              <GeneratedResult
                photoUrl={photo}
                imageUrl={generatedImage}
                onMakeVideo={handleMakeVideo}
                isLoading={isGenerating}
                elapsedSeconds={elapsedSeconds}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
