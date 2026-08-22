import { ObjectId } from "mongodb";
import { generations } from "./db.js";

export const PAGE_SIZE = 12;

// The one shape every listing produces, on the server and over HTTP alike.
// The read-time defaults here are the whole migration story: no document is
// rewritten to gain emotion, level or isPublic.
const toItem = (doc) => ({
  id: doc._id.toString(),
  kind: doc.kind,
  status: doc.status,
  url: doc.url ?? null,
  emotion: doc.emotion ?? null,
  level: doc.level ?? null,
  isPublic: doc.isPublic === true,
  createdAt: new Date(doc.createdAt).toISOString(),
});

// The _id tiebreaker keeps paging stable when two documents share a timestamp.
// One document past the page is what answers hasMore without a second query.
const page = async (filter, n) => {
  const collection = await generations();

  const docs = await collection
    .find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .skip(n * PAGE_SIZE)
    .limit(PAGE_SIZE + 1)
    .toArray();

  return { items: docs.slice(0, PAGE_SIZE).map(toItem), hasMore: docs.length > PAGE_SIZE };
};

export const listByUser = async (userId, n = 0) => page({ userId }, n);

export const listPublic = async (n = 0) => page({ isPublic: true }, n);

// An id of the wrong shape is "not-found", never a 500.
const toObjectId = (id) => (ObjectId.isValid(id) ? new ObjectId(id) : null);

export const setPublished = async (id, userId, isPublic) => {
  const _id = toObjectId(id);
  if (!_id) return "not-found";

  const collection = await generations();

  // The userId in this filter is the whole ownership check: a non-owner's
  // attempt leaves the record byte-identical, and is indistinguishable from an
  // id that matches nothing.
  const doc = await collection.findOne({ _id, userId });
  if (!doc) return "not-found";

  // Readiness is checked only on the way up; unpublishing works at any status.
  if (isPublic && doc.status !== "ready") return "not-ready";

  await collection.updateOne({ _id }, { $set: { isPublic } });
  return "ok";
};
