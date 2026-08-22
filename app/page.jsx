"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export default function Home() {
  const router = useRouter();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 text-center md:max-w-lg lg:max-w-xl">
      <div className="space-y-4">
        <h1 className="display-lg text-ink">Create videos from photos</h1>
        <p className="body text-ink-muted">AI turns your ideas into reality.</p>
        <Button type="button" onClick={() => router.push("/sign-in")} className="w-full">
          Start creating
        </Button>
      </div>
    </main>
  );
}
