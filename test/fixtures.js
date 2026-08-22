// A 1x1 transparent PNG.
export const PHOTO_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

export const PHOTO_DATA_URL = `data:image/png;base64,${PHOTO_BASE64}`;

export const BLOB_URL = "https://blob.test/image-1.png";
export const VIDEO_URL = "https://blob.test/video-1.mp4";
export const PROVIDER_JOB_ID = "provider-job-1";
export const JOB_ID = "job-12345";

// The three Item shapes the listing screens have to render. They match
// lib/generations.js's mapper exactly, including its read-time defaults — a
// fixture that drifts from the mapper gives green tests and a broken screen.

// Ready image carrying an emotion and a level.
export const ITEM_IMAGE = {
  id: "6702a1b2c3d4e5f601020304",
  kind: "image",
  status: "ready",
  url: BLOB_URL,
  emotion: "angry",
  level: "quite",
  isPublic: false,
  createdAt: "2026-08-21T10:00:00.000Z",
};

// Video still rendering: no url yet, and no emotion, because POST /api/video
// does not record one.
export const ITEM_PENDING_VIDEO = {
  id: "6702a1b2c3d4e5f601020305",
  kind: "video",
  status: "pending",
  url: null,
  emotion: null,
  level: null,
  isPublic: false,
  createdAt: "2026-08-20T10:00:00.000Z",
};

// Created before this feature: no emotion and no published flag were stored,
// so both read as their defaults rather than failing.
export const ITEM_PRE_002 = {
  id: "6702a1b2c3d4e5f601020306",
  kind: "image",
  status: "ready",
  url: "https://blob.test/image-legacy.png",
  emotion: null,
  level: null,
  isPublic: false,
  createdAt: "2026-08-01T10:00:00.000Z",
};
