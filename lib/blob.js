import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const extensions = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "video/mp4": "mp4",
};

// ponytail: dev-only disk fallback so /api/image works without a real
// BLOB_READ_WRITE_TOKEN. Never used in production — Vercel's filesystem is
// read-only/ephemeral there, and this write would silently vanish or throw.
// Files land in public/uploads, which Next.js serves as-is; the URL is only
// reachable from this machine, so Higgsfield can't fetch a *source* photo
// stored this way unless the dev server is tunnelled (e.g. ngrok). Storing
// the *generated* result for the browser to display works fine either way.
const localStore = async (buffer, contentType) => {
  const filename = `${crypto.randomUUID()}.${extensions[contentType] || "bin"}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);

  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/uploads/${filename}`;
};

export const store = async (buffer, contentType, forceRemote = false) => {
  if (
    !forceRemote &&
    !process.env.BLOB_READ_WRITE_TOKEN &&
    process.env.NODE_ENV !== "production"
  ) {
    return localStore(buffer, contentType);
  }

  const { url } = await put(
    `generations/${crypto.randomUUID()}.${extensions[contentType] || "bin"}`,
    buffer,
    { access: "public", contentType }
  );
  return url;
};
