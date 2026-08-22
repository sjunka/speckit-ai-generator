import { MongoClient } from "mongodb";

// Cached on globalThis so Next's dev-mode module reloading reuses one client
// instead of opening a new connection pool per reload (spec v3 §6).
export const db = async () => {
  if (!globalThis._mongo) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI environment variable not set");
    }
    globalThis._mongo = new MongoClient(uri).connect();
  }

  const client = await globalThis._mongo;
  return client.db("ia-generator");
};

export const generations = async () => (await db()).collection("generations");
