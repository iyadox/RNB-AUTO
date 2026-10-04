/**
 * Ajoute les données de départ manquantes (npm run db:seed). Sans risque à relancer :
 * les valeurs déjà enregistrées ne sont jamais modifiées.
 */
import { loadEnvConfig } from "@next/env";
import { databaseUrl, isPostgresUrl, openDatabase } from "../src/server/db/client";
import { ensureSeedData } from "../src/server/db/seed";

loadEnvConfig(process.cwd());

async function main() {
  const handle = await openDatabase({ autoSetup: false });
  try {
    if (!isPostgresUrl(databaseUrl())) {
      const { migrate } = await import("drizzle-orm/pglite/migrator");
      const { MIGRATIONS_FOLDER } = await import("../src/server/db/client");
      await migrate(handle.db as never, { migrationsFolder: MIGRATIONS_FOLDER });
    }
    const result = await ensureSeedData(handle.db);
    console.log(
      result.inserted > 0
        ? `✔ Données de départ : ${result.inserted} élément(s) ajouté(s)${result.versionCreated ? ", nouvelle version des tarifs créée" : ""}.`
        : "✔ Données de départ déjà présentes.",
    );
  } finally {
    await handle.close();
  }
}

main().catch((error: unknown) => {
  console.error("✖ Initialisation impossible :", error instanceof Error ? error.message : error);
  process.exit(1);
});
