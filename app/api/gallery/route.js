import { auth } from "@clerk/nextjs/server";
import { listByUser } from "@/lib/generations.js";

// `page` arrives as a string. Only a non-negative integer is a page; anything
// else is a 400 rather than a NaN that reads as the end of the list (trap 6).
const parsePage = (url) => {
  const raw = new URL(url).searchParams.get("page");
  if (raw === null) return 0;
  return /^\d+$/.test(raw) ? Number(raw) : null;
};

export const GET = async (request) => {
  // Self-checked, not trusted to the route matcher (FR-003).
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const page = parsePage(request.url);
  if (page === null) return new Response("Invalid page", { status: 400 });

  try {
    // The userId is the session's own, never one from the request (FR-002).
    const { items, hasMore } = await listByUser(userId, page);
    return Response.json({ items, hasMore, page });
  } catch (error) {
    return new Response(error.message, { status: error.status || 500 });
  }
};
