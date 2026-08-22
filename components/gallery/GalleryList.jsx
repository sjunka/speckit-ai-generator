"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { GenerationCard } from "./GenerationCard";
import { PublishToggle } from "./PublishToggle";

// Seeded from the server render's props and never fetching on mount: the first
// page is already here, and pages two and beyond are a click (FR-006, SC-006).
// useState and fetch, nothing more — no data-fetching library, no state
// manager, and no useEffect that fetches.
export const GalleryList = ({ items: seed, hasMore: seedHasMore }) => {
  const [items, setItems] = useState(seed);
  const [hasMore, setHasMore] = useState(seedHasMore);
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);

  const handleLoadMore = async () => {
    const next = page + 1;
    setBusy(true);

    try {
      const response = await fetch(`/api/gallery?page=${next}`);

      if (response.ok) {
        const data = await response.json();
        setItems((current) => [...current, ...data.items]);
        setHasMore(data.hasMore);
        setPage(next);
      }
    } catch {
      // Nothing is appended and the control comes back; the viewer can retry.
    }

    setBusy(false);
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-2 rounded-[8px] border border-hairline bg-surface-1 p-6">
        <p className="body text-ink">Nothing here yet.</p>
        <Link
          href="/capture"
          className="body-sm text-primary-light underline focus:outline-2 focus:outline-offset-2 focus:outline-primary-focus/50"
        >
          Capture something
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <GenerationCard key={item.id} item={item}>
            <PublishToggle item={item} />
          </GenerationCard>
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
