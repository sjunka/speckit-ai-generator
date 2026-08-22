import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";

const globalKey = globalThis.__iaGeneratorMongoClient ?? Symbol.for("iaGeneratorMongoClient");

if (!globalThis[globalKey]) {
  globalThis[globalKey] = new MongoClient(uri);
}

export const db = async () => globalThis[globalKey];
export const generations = async () => (await db()).db("ia-generator").collection("generations");
