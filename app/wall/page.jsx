import { listPublic } from "@/lib/generations.js";
import { WallList } from "@/components/wall";

// Nothing on this page is request-specific — no auth(), no searchParams — so
// Next would prerender it at build time and the wall would show whatever was
// published when the build ran. The gallery needs no such export: its auth()
// call already makes it dynamic.
export const dynamic = "force-dynamic";

// No auth() and no redirect: the wall is readable with no session, exactly as
// the landing route is (FR-018, SC-004). That is also why it carries no Nav —
// Nav is the signed-in navigation, and rendering it here would make the page
// depend on a session it does not require.
export default async function WallPage() {
  const { items, hasMore } = await listPublic(0);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-4 py-6 md:max-w-2xl lg:max-w-4xl">
      <h1 className="display-sm">Wall</h1>

      <WallList items={items} hasMore={hasMore} />
    </main>
  );
}
