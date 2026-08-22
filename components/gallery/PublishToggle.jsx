"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

// Failure shows no message: the control returns to its previous state and
// re-enables. The spec requires no error copy here, so none is written.
export function PublishToggle({ item }) {
  const [isPublic, setIsPublic] = useState(item.isPublic);
  const [isSaving, setIsSaving] = useState(false);

  if (item.status !== "ready") return null;

  const handleClick = async () => {
    const next = !isPublic;
    setIsSaving(true);

    try {
      const response = await fetch(`/api/generation/${item.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: next }),
      });

      if (response.status === 200) setIsPublic(next);
    } catch {
      // Left where it was, deliberately silently.
    }

    setIsSaving(false);
  };

  return (
    <Button type="button" variant="secondary" onClick={handleClick} disabled={isSaving} className="w-full">
      {isPublic ? "Unpublish" : "Publish"}
    </Button>
  );
}
