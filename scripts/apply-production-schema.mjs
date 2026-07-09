/**
 * Applies scripts/production-schema.sql when SUPABASE_DB_URL is set.
 *
 * Get the connection string from Supabase → Project Settings → Database → URI
 * (use "Session pooler" or direct). Add to .env.local:
 *   SUPABASE_DB_URL=postgresql://postgres.[ref]:[password]@...
 *
 * Then: node scripts/apply-production-schema.mjs
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");

function loadEnvLocal() {
  try {
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    /* no .env.local */
  }
}

loadEnvLocal();

const dbUrl = process.env.SUPABASE_DB_URL?.trim();
if (!dbUrl) {
  console.error(
    "Missing SUPABASE_DB_URL in .env.local.\n" +
      "Paste your Postgres URI from Supabase → Settings → Database, then re-run.\n" +
      "Alternatively, copy scripts/production-schema.sql into the Supabase SQL Editor and run it.",
  );
  process.exit(1);
}

const sql = readFileSync(resolve(root, "scripts/production-schema.sql"), "utf8");

const { default: pg } = await import("pg");
const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(sql);
  console.log("Production schema applied successfully.");
} catch (err) {
  console.error("Schema apply failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
