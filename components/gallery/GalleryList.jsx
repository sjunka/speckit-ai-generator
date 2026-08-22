"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { GenerationCard } from "./GenerationCard";
import { PublishToggle } from "./PublishToggle";

// useState and fetch, nothing more. The first page arrives as props from the
// server render, so there is no useEffect here and nothing fetches on mount.
export function GalleryList({ items: seed, hasMore: seedHasMore, page: seedPage = 0 }) {
  const [items, setItems] = useState(seed);
  const [hasMore, setHasMore] = useState(seedHasMore);
  const [page, setPage] = useState(seedPage);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadMore = async () => {
    const next = page + 1;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/gallery?page=${next}`);

      if (response.ok) {
        const data = await response.json();
        setItems((current) => [...current, ...data.items]);
        setHasMore(data.hasMore);
        setPage(next);
      }
    } catch {
      // The list stays where it is.
    }

    setIsLoading(false);
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="body text-ink-subtle">Nothing here yet.</p>
        <Link href="/capture" className="body text-ink underline">
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

      {hasMore && (
        <Button type="button" variant="secondary" onClick={handleLoadMore} disabled={isLoading} className="w-full">
          Load more
        </Button>
      )}
    </div>
  );
}
