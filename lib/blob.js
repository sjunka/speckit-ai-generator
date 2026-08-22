import { put } from "@vercel/blob";
import fs from "fs/promises";
import path from "path";

function asBuffer(value) {
  if (Buffer.isBuffer(value)) return value;
  if (typeof value === "string") {
    const match = value.match(/^data:.*;base64,(.*)$/i);
    if (match) return Buffer.from(match[1], "base64");
    return Buffer.from(value);
  }
  if (value instanceof ArrayBuffer) return Buffer.from(value);
  if (ArrayBuffer.isView(value)) return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  return Buffer.from(String(value));
}

export const store = async (buffer, contentType, forceRemote = false) => {
  const payload = asBuffer(buffer);

  if (!forceRemote && !process.env.BLOB_READ_WRITE_TOKEN && process.env.NODE_ENV !== "production") {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${(contentType || "image/png").split("/")[1] || "png"}`;
    const filePath = path.join(uploadsDir, filename);
    await fs.writeFile(filePath, payload);
    // Ceiling: Vercel's filesystem is ephemeral and a local upload cannot be reached by the provider unless the dev server is tunnelled.
    return `/uploads/${filename}`;
  }

  const { url } = await put(`upload-${Date.now()}.${(contentType || "image/png").split("/")[1] || "png"}`, payload, {
    access: "public",
    contentType,
  });

  return url;
};
