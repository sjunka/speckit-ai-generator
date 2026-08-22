import { auth } from "@clerk/nextjs/server";
import { setPublished } from "@/lib/generations.js";

// The module answers with one of three words; this route only maps them.
// "not-found" covers an unknown id, an unparseable id and a generation owned by
// somebody else — the same non-disclosure pattern /api/settings uses. The
// ownership check lives in setPublished's filter, not here.
const status = { ok: 200, "not-found": 404, "not-ready": 409 };
const message = { "not-found": "Not found", "not-ready": "Generation is not ready" };

export const POST = async (request, { params }) => {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  // Independent, so they are awaited together rather than one after the other.
  const [{ id }, { isPublic }] = await Promise.all([params, request.json()]);

  if (typeof isPublic !== "boolean") {
    return new Response("Invalid isPublic", { status: 400 });
  }

  try {
    const result = await setPublished(id, userId, isPublic);
    if (result !== "ok") {
      return new Response(message[result], { status: status[result] });
    }

    return Response.json({ id, isPublic });
  } catch (error) {
    return new Response(error.message, { status: error.status || 500 });
  }
};
