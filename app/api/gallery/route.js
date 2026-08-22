import { auth } from "@clerk/nextjs/server";
import { listByUser } from "@/lib/generations.js";

// A page that is not a non-negative integer is rejected before it reaches the
// query: NaN would become skip: NaN and read as the end of the list.
const parsePage = (value) =>
  value === null ? 0 : /^\d+$/.test(value) ? Number(value) : null;

export const GET = async (request) => {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const page = parsePage(new URL(request.url).searchParams.get("page"));
  if (page === null) return new Response("Invalid page", { status: 400 });

  try {
    // The userId comes from the session and never from the request.
    const { items, hasMore } = await listByUser(userId, page);
    return Response.json({ items, hasMore, page });
  } catch (error) {
    console.error("Gallery read failed:", error);
    return new Response(error.message, { status: 500 });
  }
};
