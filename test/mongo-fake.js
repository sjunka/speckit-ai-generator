import { ObjectId } from "mongodb";

export class FakeCollection {
  constructor() {
    this.docs = [];
  }

  async findOne(filter) {
    return this.docs.find((doc) => matches(doc, filter));
  }

  // Real ObjectIds, because the routes hand ids back to the client as strings
  // and parse them again on the way in.
  async insertOne(doc) {
    const _id = new ObjectId();
    this.docs.push({ _id, ...doc });
    return { insertedId: _id };
  }

  async updateOne(filter, update) {
    const doc = await this.findOne(filter);
    if (!doc) return { matchedCount: 0, modifiedCount: 0 };

    const $set = update.$set || update;
    Object.assign(doc, $set);
    return { matchedCount: 1, modifiedCount: 1 };
  }

  async countDocuments(filter = {}) {
    return this.docs.filter((doc) => matches(doc, filter)).length;
  }

  // Chainable, and lazy: nothing is read until toArray(). Implements only the
  // four stages the two paged reads use — a query needing a fifth extends this
  // fake rather than working around it.
  find(filter = {}) {
    const cursor = { sortSpec: null, skipCount: 0, limitCount: null };

    const api = {
      sort: (spec) => ((cursor.sortSpec = spec), api),
      skip: (n) => ((cursor.skipCount = n), api),
      limit: (n) => ((cursor.limitCount = n), api),
      toArray: async () => {
        let docs = this.docs.filter((doc) => matches(doc, filter));

        if (cursor.sortSpec) docs = [...docs].sort(comparator(cursor.sortSpec));

        docs = docs.slice(cursor.skipCount);
        return cursor.limitCount === null ? docs : docs.slice(0, cursor.limitCount);
      },
    };

    return api;
  }
}

// Exact match on each key, except a `{ $gte: value }` operand, which does a
// range comparison. Covers "generations today" style date-range counts.
// ObjectIds compare through .equals(): `===` misses every equal-but-distinct id.
function matches(doc, filter) {
  return Object.entries(filter).every(([key, val]) => {
    if (val && typeof val === "object" && "$gte" in val) {
      return doc[key] >= val.$gte;
    }
    if (val instanceof ObjectId) {
      return doc[key] instanceof ObjectId && val.equals(doc[key]);
    }
    return doc[key] === val;
  });
}

// One comparator per sort spec, applying each key in declaration order so the
// `_id` tiebreaker in `{ createdAt: -1, _id: -1 }` decides ties on createdAt.
function comparator(spec) {
  const keys = Object.entries(spec);

  return (a, b) => {
    for (const [key, direction] of keys) {
      const left = sortable(a[key]);
      const right = sortable(b[key]);
      if (left < right) return -direction;
      if (left > right) return direction;
    }
    return 0;
  };
}

const sortable = (value) => (value instanceof ObjectId ? value.toString() : value);
