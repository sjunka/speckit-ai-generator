import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { generations } from "@/lib/db";
import { store } from "@/lib/blob";
import { generateImage } from "@/lib/higgsfield";
import { assertEnabled } from "@/lib/settings";

export async function POST(request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await assertEnabled();
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 503 });
  }

  try {
    const { photo, hint } = await request.json();

    if (!photo) {
      return NextResponse.json({ error: "Missing photo" }, { status: 400 });
    }

    const photoUrl = await store(Buffer.from(photo.replace(/^data:image\/[a-z]+;base64,/, ""), "base64"), "image/png");
    const { buffer, contentType } = await generateImage(photoUrl, hint);
    const generatedUrl = await store(buffer, contentType);
    const collection = await generations();
    const createdAt = new Date();

    const result = await collection.insertOne({
      userId,
      kind: "image",
      status: "ready",
      url: generatedUrl,
      createdAt,
    });

    return NextResponse.json({ imageUrl: generatedUrl, id: result.insertedId }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
