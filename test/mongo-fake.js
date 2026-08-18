export class FakeCollection {
  constructor() {
    this.docs = [];
  }

  async findOne(filter) {
    return this.docs.find((doc) => {
      return Object.entries(filter).every(([key, val]) => doc[key] === val);
    });
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
    return this.docs.filter((doc) => {
      return Object.entries(filter).every(([key, val]) => doc[key] === val);
    }).length;
  }
}
