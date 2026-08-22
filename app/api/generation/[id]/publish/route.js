import { auth } from "@clerk/nextjs/server";
import { setPublished } from "@/lib/generations.js";

// The module's three return strings are the whole contract. There is no
// ownership check here — that is the userId inside setPublished's filter, and a
// non-owner gets the same 404 as an id that matches nothing, on purpose.
const STATUS = { "not-found": [404, "Not found"], "not-ready": [409, "Generation is not ready"] };

export const POST = async (request, { params }) => {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const { isPublic } = await request.json();
  if (typeof isPublic !== "boolean") {
    return new Response("Invalid isPublic", { status: 400 });
  }

  try {
    const result = await setPublished(id, userId, isPublic);
    if (result !== "ok") {
      const [status, body] = STATUS[result];
      return new Response(body, { status });
    }

    return Response.json({ id, isPublic });
  } catch (error) {
    console.error("Publish failed:", error);
    return new Response(error.message, { status: error.status || 500 });
  }
};
