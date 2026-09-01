import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Pool } from "pg";

export async function migrate(
  connectionString = process.env.DATABASE_URL,
): Promise<void> {
  if (!connectionString)
    throw new Error("DATABASE_URL is required for migrations");
  const pool = new Pool({ connectionString, max: 1 });
  try {
    await pool.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
    );
    const directory = path.resolve(process.cwd(), "apps/api/migrations");
    const files = (await readdir(directory))
      .filter((file) => /^\d+.*\.sql$/.test(file))
      .sort();
    for (const file of files) {
      const exists = await pool.query(
        "SELECT 1 FROM schema_migrations WHERE version=$1",
        [file],
      );
      if (exists.rowCount) continue;
      const sql = await readFile(path.join(directory, file), "utf8");
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (version) VALUES ($1)",
          [file],
        );
        await client.query("COMMIT");
        process.stdout.write(`Applied migration ${file}\n`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    }
  } finally {
    await pool.end();
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await migrate();
}
