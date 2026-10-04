/**
 * Applique les migrations de la base (npm run db:migrate).
 * Avec PGlite (développement local), applique aussi les données de départ.
 */
import { loadEnvConfig } from "@next/env";
import { databaseUrl, isPostgresUrl, MIGRATIONS_FOLDER, openDatabase } from "../src/server/db/client";

loadEnvConfig(process.cwd());

async function main() {
  const url = databaseUrl();
  if (isPostgresUrl(url)) {
    const { default: postgres } = await import("postgres");
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    const client = postgres(url, { max: 1, onnotice: () => {} });
    try {
      await migrate(drizzle({ client }), { migrationsFolder: MIGRATIONS_FOLDER });
    } finally {
      await client.end({ timeout: 5 });
    }
    console.log("✔ Base PostgreSQL à jour.");
    return;
  }
  if (!url && process.env.VERCEL) {
    throw new Error(
      "DATABASE_URL est vide. Sur Vercel : Storage → créez une base Postgres (Neon) et reliez-la au projet, puis redéployez.",
    );
  }
  const handle = await openDatabase({ autoSetup: true });
  await handle.close();
  console.log("✔ Base locale (PGlite) prête.");
}

main().catch((error: unknown) => {
  console.error("✖ Migration impossible :", error instanceof Error ? error.message : error);
  process.exit(1);
});
