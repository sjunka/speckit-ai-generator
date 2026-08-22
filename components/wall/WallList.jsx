"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui";
import { GenerationCard } from "@/components/gallery";

// The same shape as GalleryList minus the publish control: the wall shows
// everyone's published work and offers no way to change it.
export function WallList({ items: seed, hasMore: seedHasMore, page: seedPage = 0 }) {
  const [items, setItems] = useState(() => seed);
  const [hasMore, setHasMore] = useState(() => seedHasMore);
  // The page number is never rendered, only read by the handler that asks for
  // the next one, so it lives in a ref rather than causing a render of its own.
  const page = useRef(seedPage);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadMore = async () => {
    const next = page.current + 1;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/wall?page=${next}`);

      if (response.ok) {
        const data = await response.json();
        setItems((current) => [...current, ...data.items]);
        setHasMore(data.hasMore);
        page.current = next;
      }
    } catch {
      // The list stays where it is.
    }

    setIsLoading(false);
  };

  if (items.length === 0) {
    return <p className="body text-ink-subtle">Nothing published yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <GenerationCard key={item.id} item={item} />
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
