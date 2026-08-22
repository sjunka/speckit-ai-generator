import { listPublic } from "@/lib/generations.js";

// Same rule as the gallery route, five lines rather than a shared helper: the
// two modules this feature may add to are frozen, and a route is not a library.
const parsePage = (url) => {
  const raw = new URL(url).searchParams.get("page");
  if (raw === null) return 0;
  return /^\d+$/.test(raw) ? Number(raw) : null;
};

// No auth() call, no 401 row, no redirect: the wall is public (FR-018).
export const GET = async (request) => {
  const page = parsePage(request.url);
  if (page === null) return new Response("Invalid page", { status: 400 });

  try {
    const { items, hasMore } = await listPublic(page);
    return Response.json({ items, hasMore, page });
  } catch (error) {
    return new Response(error.message, { status: error.status || 500 });
  }
};
