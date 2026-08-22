import { listPublic } from "@/lib/generations.js";

// Same rule as the gallery, deliberately duplicated: the wall route imports no
// symbol from any other route, and the helper is one line.
const parsePage = (value) =>
  value === null ? 0 : /^\d+$/.test(value) ? Number(value) : null;

// The wall is public. There is no auth() call here and no 401 branch: a visitor
// with no session gets the same 200 as one with a session.
export const GET = async (request) => {
  const page = parsePage(new URL(request.url).searchParams.get("page"));
  if (page === null) return new Response("Invalid page", { status: 400 });

  try {
    const { items, hasMore } = await listPublic(page);
    return Response.json({ items, hasMore, page });
  } catch (error) {
    console.error("Wall read failed:", error);
    return new Response(error.message, { status: 500 });
  }
};
