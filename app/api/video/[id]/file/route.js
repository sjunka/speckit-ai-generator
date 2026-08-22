import { NextResponse } from "next/server";
import { generations } from "@/lib/db";

export async function GET(request, context = {}) {
  const routeParams = await (request?.params ?? context?.params ?? Promise.resolve({}));
  const { id } = routeParams || {};

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const collection = await generations();
  const record = await collection.findOne({ jobId: id });

  if (!record || !record.url) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const response = await fetch(record.url);

  if (!response.ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let blob;

  if (typeof response.arrayBuffer === "function") {
    blob = await response.arrayBuffer();
  } else if (typeof response.text === "function") {
    blob = Buffer.from(await response.text());
  } else if (typeof response.body === "string") {
    blob = Buffer.from(response.body);
  } else if (response.body instanceof ArrayBuffer) {
    blob = Buffer.from(response.body);
  } else if (response.body instanceof Uint8Array) {
    blob = Buffer.from(response.body);
  } else {
    blob = Buffer.from(String(response.body || ""));
  }

  return new NextResponse(blob, {
    status: 200,
    headers: {
      "Content-Type": response.headers.get("content-type") || "video/mp4",
      "Content-Disposition": `attachment; filename="video-${id}.mp4"`,
    },
  });
}
