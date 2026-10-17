// lib/mongodb.ts
import { MongoClient, ServerApiVersion, type Document } from "mongodb";

let uri: string;
if (!process.env.MONGODB_URI) {
  console.warn('Missing MONGODB_URI; using fallback for build');
  uri = 'mongodb://localhost:27017/jobbers';
} else {
  uri = process.env.MONGODB_URI;
}
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

let client: MongoClient;

declare global {
  var _mongoClient: MongoClient | undefined;
}

if (process.env.NODE_ENV === "development") {
  if (!globalThis._mongoClient) {
    globalThis._mongoClient = new MongoClient(uri, options);
  }
  client = globalThis._mongoClient;
} else {
  client = new MongoClient(uri, options);
}

export default client;

export async function getCollection<TSchema extends Document>(
  collectionName: string
) {
  const connectedClient = await client.connect();
  return connectedClient.db().collection<TSchema>(collectionName);
}

/**
 * Safely serializes MongoDB documents for React Client Components.
 * Transforms ObjectIds to strings and Dates to ISO strings, stripping custom
 * BSON prototypes / toJSON methods to adhere strictly to Next.js boundary rules.
 */
export function serializeMongo<T>(data: T): T {
  if (data === null || data === undefined) return data;
  return JSON.parse(JSON.stringify(data)) as T;
}
