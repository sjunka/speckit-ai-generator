export class FakeCollection {
  constructor() {
    this.docs = [];
  }

  async findOne(filter) {
    return this.docs.find((doc) => matches(doc, filter));
  }

  async insertOne(doc) {
    const id = Date.now().toString();
    this.docs.push({ _id: id, ...doc });
    return { insertedId: id };
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
}

// Exact match on each key, except a `{ $gte: value }` operand, which does a
// range comparison. Covers "generations today" style date-range counts.
function matches(doc, filter) {
  return Object.entries(filter).every(([key, val]) => {
    if (val && typeof val === "object" && "$gte" in val) {
      return doc[key] >= val.$gte;
    }
    return doc[key] === val;
  });
}
