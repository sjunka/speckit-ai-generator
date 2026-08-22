import { auth } from "@clerk/nextjs/server";
import { listByUser } from "@/lib/generations.js";
import { Nav } from "@/components/Nav";
import { GalleryList } from "@/components/gallery/GalleryList";

// The first page is one database round trip inside this render — no fetch, no
// HTTP, no /api/gallery. Pages two and beyond are the list's own click.
export default async function GalleryPage() {
  const { userId } = await auth();

  // Always the session's own id, never one from the request (FR-002, SC-001).
  const { items, hasMore } = await listByUser(userId, 0);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-4 py-6 md:max-w-2xl lg:max-w-4xl">
      <Nav />
      <h1 className="display-sm">Gallery</h1>

      <GalleryList items={items} hasMore={hasMore} />
    </main>
  );
}
