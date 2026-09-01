import type { Persistence } from "../services/persistence.js";
import { MemoryStore } from "../services/store.js";
import { PostgresStore } from "./postgres-store.js";

export function createPersistence(): Persistence {
  const url = process.env.DATABASE_URL;
  if (url) return new PostgresStore(url);
  if (process.env.NODE_ENV === "production")
    throw new Error("DATABASE_URL is required in production");
  return new MemoryStore();
}
