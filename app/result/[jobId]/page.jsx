"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button, Card, Spinner, StatusBadge } from "@/components/ui";
import { VideoPlayer } from "@/components/result/VideoPlayer";

export default function ResultPage({ params }) {
  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState("pending");
  const [seconds, setSeconds] = useState(0);
  const [videoUrl, setVideoUrl] = useState("");
  const timeoutRef = useRef(null);
  const abortRef = useRef(null);
  const canShareVideo =
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [new File([""], "video.mp4", { type: "video/mp4" })] });

  useEffect(() => {
    Promise.resolve(params).then((resolved) => setJobId(resolved?.jobId || ""));
  }, [params]);

  useEffect(() => {
    if (!jobId) {
      return undefined;
    }

    let isMounted = true;

    const poll = async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(`/api/video/${jobId}`, { signal: controller.signal });

        if (!response.ok) {
          if (response.status === 404) {
            if (isMounted) setStatus("not-found");
            return;
          }
          if (isMounted) setStatus("pending");
          if (isMounted) timeoutRef.current = setTimeout(poll, 3000);
          return;
        }

        const data = await response.json();

        if (data.status === "ready") {
          if (isMounted) {
            setStatus("ready");
            setVideoUrl(data.videoUrl || "");
          }
          return;
        }

        if (data.status === "failed") {
          if (isMounted) setStatus("failed");
          return;
        }

        if (isMounted) {
          setStatus("pending");
          setSeconds((current) => current + 1);
        }
      } catch (error) {
        if (error?.name !== "AbortError" && isMounted) {
          setStatus("pending");
        }
      }

      if (isMounted) {
        timeoutRef.current = setTimeout(poll, 3000);
      }
    };

    poll();

    return () => {
      isMounted = false;
      abortRef.current?.abort();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [jobId]);

  const handleShare = async () => {
    if (!navigator.canShare || !videoUrl) return;

    try {
      const response = await fetch(`/api/video/${jobId}/file`);
      const blob = await response.blob();
      const file = new File([blob], "video.mp4", { type: blob.type || "video/mp4" });

      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
      }
    } catch {
      // no-op for this phase
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-4 py-6 md:max-w-2xl lg:max-w-4xl">
      <h1 className="display-sm text-ink">Your video</h1>
      <Card className="p-4">
        {status === "pending" && (
          <div className="space-y-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div className="h-full w-1/2 rounded-full bg-primary" role="progressbar" aria-valuenow={50} aria-valuemin={0} aria-valuemax={100} />
            </div>
            <div className="flex items-center gap-2 text-ink-muted">
              <Spinner className="h-4 w-4" />
              <span>Rendering your video... {seconds}s</span>
            </div>
          </div>
        )}

        {status === "ready" && (
          <div className="space-y-4">
            <VideoPlayer src={videoUrl} />
            <div className="flex gap-2">
              <a href={videoUrl} download className="inline-flex h-11 flex-1 items-center justify-center rounded-[8px] bg-primary text-ink">
                Download
              </a>
              {canShareVideo && (
                <Button type="button" onClick={handleShare} className="flex-1">
                  Share
                </Button>
              )}
            </div>
          </div>
        )}

        {status === "failed" && (
          <div className="space-y-3">
            <StatusBadge variant="failed">Failed</StatusBadge>
            <p className="body text-ink-muted">That render failed. Try again from a new photo.</p>
            <Link href="/capture" className="inline-flex h-11 items-center justify-center rounded-[8px] bg-primary px-4 text-ink">
              Back to capture
            </Link>
          </div>
        )}

        {status === "not-found" && (
          <div className="space-y-3">
            <p className="body text-ink-muted">We could not find that video.</p>
            <Link href="/capture" className="inline-flex h-11 items-center justify-center rounded-[8px] bg-primary px-4 text-ink">
              Back to capture
            </Link>
          </div>
        )}
      </Card>
    </main>
  );
}
