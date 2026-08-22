import Image from "next/image";
import { Card, StatusBadge } from "@/components/ui";

// An entry with no url has nothing to show yet — a video still rendering is the
// only way a listing reaches this state (FR-004). No other copy is pinned for
// it, so no error taxonomy is invented here (Principle III).
const Media = ({ item }) => {
  if (!item.url) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-[8px] border border-hairline bg-surface-2">
        <StatusBadge variant="pending">Rendering</StatusBadge>
      </div>
    );
  }

  // Testing Library gives <video> no implicit ARIA role, so it is found by
  // test id rather than by role (trap 20).
  if (item.kind === "video") {
    return (
      <video
        data-testid="video-player"
        src={item.url}
        controls
        playsInline
        className="aspect-square w-full rounded-[8px] border border-hairline bg-surface-1 object-cover"
      />
    );
  }

  // next/image needs a sized parent to fill; the host allowlist it needs in
  // production is already in next.config.mjs, and the Vitest setup swaps it for
  // a plain <img> because jsdom cannot run the optimization loader (trap 7).
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-[8px] border border-hairline bg-surface-1">
      <Image
        src={item.url}
        alt="Generation"
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        className="object-cover"
      />
    </div>
  );
};

// The stored strings render verbatim: no emoji, no capitalisation, no lookup
// table. That is why this file does not import lib/emotions.js — the emoji
// live in that module and nowhere else.
export const GenerationCard = ({ item, children }) => (
  <Card className="flex flex-col gap-3 p-3">
    <Media item={item} />

    {item.emotion ? (
      <div className="flex flex-wrap items-center gap-2">
        <span data-testid="emotion" className="body-sm text-ink">
          {item.emotion}
        </span>
        {item.level ? (
          <span data-testid="level" className="caption text-ink-subtle">
            {item.level}
          </span>
        ) : null}
      </div>
    ) : null}

    {children}
  </Card>
);
