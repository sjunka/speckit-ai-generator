"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
// Both component directories belong to this block, so reusing the card here
// crosses no ownership line and beats duplicating it.
import { GenerationCard } from "@/components/gallery/GenerationCard";

// Same shape as the gallery list, minus the publish control: unpublishing is
// the owner's alone and happens in the gallery (FR-017).
export const WallList = ({ items: seed, hasMore: seedHasMore }) => {
  const [loaded, setLoaded] = useState({ items: seed, hasMore: seedHasMore, page: 0 });
  const [busy, setBusy] = useState(false);

  const { items, hasMore } = loaded;

  const handleLoadMore = async () => {
    const next = loaded.page + 1;
    setBusy(true);

    try {
      const response = await fetch(`/api/wall?page=${next}`);

      if (response.ok) {
        const data = await response.json();
        setLoaded((current) => ({
          items: [...current.items, ...data.items],
          hasMore: data.hasMore,
          page: next,
        }));
      }
    } catch {
      // Nothing is appended and the control comes back.
    }

    setBusy(false);
  };

  if (items.length === 0) {
    return (
      <div className="rounded-[8px] border border-hairline bg-surface-1 p-6">
        <p className="body text-ink">Nothing published yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <GenerationCard key={item.id} item={item} />
        ))}
      </div>

      {hasMore ? (
        <Button variant="secondary" onClick={handleLoadMore} disabled={busy} className="w-full">
          Load more
        </Button>
      ) : null}
    </div>
  );
};
