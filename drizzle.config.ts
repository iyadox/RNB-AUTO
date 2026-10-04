import { defineConfig } from "drizzle-kit";

// Sert uniquement à générer les migrations SQL (npm run db:generate).
// L'application applique ensuite ces migrations avec scripts/migrate.ts.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  strict: true,
  verbose: true,
});
