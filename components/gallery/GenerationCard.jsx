import { Card, StatusBadge } from "@/components/ui";

// The stored strings, verbatim: no emoji, no capitalisation, no lookup table.
// This is why the listing screens do not import lib/emotions.js.
const Asset = ({ item }) => {
  if (item.status !== "ready" || !item.url) {
    return <StatusBadge variant="pending">Rendering</StatusBadge>;
  }

  if (item.kind === "video") {
    return (
      <video
        src={item.url}
        controls
        className="aspect-square w-full rounded-[8px] object-contain"
      />
    );
  }

  return (
    <img
      src={item.url}
      alt="Generation"
      className="aspect-square w-full rounded-[8px] object-contain"
    />
  );
};

export function GenerationCard({ item, children }) {
  return (
    <Card className="flex flex-col gap-2">
      <Asset item={item} />

      {item.emotion && (
        <span data-testid="emotion" className="body-sm text-ink">
          {item.emotion}
        </span>
      )}
      {item.level && (
        <span data-testid="level" className="body-sm text-ink-subtle">
          {item.level}
        </span>
      )}

      {children}
    </Card>
  );
}
