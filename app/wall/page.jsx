import { listPublic } from "@/lib/generations.js";
import { WallList } from "@/components/wall";

// No auth(), no redirect and no Nav: the wall renders the same for a visitor
// with no session as for one with a session (FR-018).
export default async function WallPage() {
  const { items, hasMore } = await listPublic(0);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-4 py-6 md:max-w-2xl lg:max-w-4xl">
      <h1 className="display-sm">Wall</h1>
      <WallList items={items} hasMore={hasMore} page={0} />
    </main>
  );
}
