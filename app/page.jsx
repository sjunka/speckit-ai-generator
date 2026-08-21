"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

// Signed-in visitors never reach this component: middleware redirects them
// to /capture before the request renders.
export default function Landing() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-canvas text-ink flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <h1 className="display-lg">
          Create videos from photos
        </h1>

        <p className="body text-ink-subtle">
          AI turns your ideas into reality.
        </p>

        <Button
          variant="primary"
          onClick={() => router.push("/sign-in")}
          className="w-full"
        >
          Start creating
        </Button>
      </div>
    </div>
  );
}
