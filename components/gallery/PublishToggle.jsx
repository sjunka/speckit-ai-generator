"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export const PublishToggle = ({ item }) => {
  const [isPublic, setIsPublic] = useState(item.isPublic);
  const [busy, setBusy] = useState(false);

  // Only a ready generation is publishable (FR-016), so nothing else carries a
  // control at all.
  if (item.status !== "ready") return null;

  const handleClick = async () => {
    const next = !isPublic;
    setBusy(true);

    try {
      const response = await fetch(`/api/generation/${item.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: next }),
      });

      // A failure shows no message: the label stays where it was and the
      // control re-enables. The spec requires no error copy here, so none is
      // written.
      if (response.ok) setIsPublic(next);
    } catch {
      // A dropped request is the same non-event as a non-200.
    }

    setBusy(false);
  };

  return (
    <Button variant="secondary" onClick={handleClick} disabled={busy} className="w-full">
      {isPublic ? "Unpublish" : "Publish"}
    </Button>
  );
};
