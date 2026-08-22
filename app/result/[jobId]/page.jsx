"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui";
import { VideoResult } from "@/components/result/VideoResult";
import { useElapsedSeconds } from "@/hooks/useElapsedSeconds";

const POLL_MS = 3000;

const BackToCapture = () => (
  <Link href="/capture" className="body text-primary-light underline">
    Back to capture
  </Link>
);

export default function ResultPage() {
  const { jobId } = useParams();
  const [job, setJob] = useState({ status: "pending" });
  const elapsedSeconds = useElapsedSeconds(job.status === "pending");

  useEffect(() => {
    const controller = new AbortController();
    let timer = null;

    const poll = async () => {
      try {
        const response = await fetch(`/api/video/${jobId}`, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        if (response.status === 404) {
          setJob({ status: "not-found" });
          return;
        }

        if (!response.ok) {
          // A transient server error is not a job state — keep waiting.
          timer = setTimeout(poll, POLL_MS);
          return;
        }

        const next = await response.json();
        if (controller.signal.aborted) return;

        setJob(next);
        if (next.status === "pending") timer = setTimeout(poll, POLL_MS);
      } catch (error) {
        if (error.name !== "AbortError" && !controller.signal.aborted) {
          timer = setTimeout(poll, POLL_MS);
        }
      }
    };

    timer = setTimeout(poll, 0);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [jobId]);

  return (
    <div className="min-h-screen bg-canvas px-4 py-8 text-ink">
      <div className="mx-auto max-w-md space-y-6 md:max-w-2xl">
        <h1 className="display-sm">Your video</h1>

        <Card>
          {job.status === "pending" && (
            <div className="space-y-3">
              <div
                role="progressbar"
                aria-label="Rendering"
                className="h-1 w-full overflow-hidden rounded-full bg-surface-3"
              >
                <div className="h-full w-1/3 animate-pulse bg-primary" />
              </div>
              <p className="body">Rendering your video... {elapsedSeconds}s</p>
            </div>
          )}

          {job.status === "ready" && <VideoResult videoUrl={job.videoUrl} jobId={jobId} />}

          {job.status === "failed" && (
            <div className="space-y-3">
              <p className="body">That render failed. Try again from a new photo.</p>
              <BackToCapture />
            </div>
          )}

          {job.status === "not-found" && (
            <div className="space-y-3">
              <p className="body">We could not find that video.</p>
              <BackToCapture />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
