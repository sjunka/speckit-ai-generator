import { generations } from "@/lib/db.js";

// The provider's videoUrl is cross-origin and has no CORS headers, so the
// browser can't fetch() it directly (needed to build a shareable File).
// Stream it through our own origin instead.
export const GET = async (_request, { params }) => {
  const { id } = await params;
  const record = await (await generations()).findOne({ jobId: id });

  if (!record?.url) return new Response("Not found", { status: 404 });

  const upstream = await fetch(record.url);
  if (!upstream.ok) return new Response("Not found", { status: 404 });

  return new Response(upstream.body, {
    headers: { "Content-Type": upstream.headers.get("content-type") || "video/mp4" },
  });
};
