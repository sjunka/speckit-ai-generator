import { auth } from "@clerk/nextjs/server";
import { listByUser } from "@/lib/generations.js";
import { Nav } from "@/components/Nav";
import { GalleryList } from "@/components/gallery";

// The first page is read here, on the server: no fetch, no HTTP, no /api/gallery.
export default async function GalleryPage() {
  const { userId } = await auth();
  const { items, hasMore } = await listByUser(userId, 0);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-4 py-6 md:max-w-2xl lg:max-w-4xl">
      <Nav />
      <h1 className="display-sm">Gallery</h1>
      <GalleryList items={items} hasMore={hasMore} page={0} />
    </main>
  );
}
