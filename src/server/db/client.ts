/**
 * Connexion à la base de données.
 *
 * - Production : PostgreSQL (DATABASE_URL=postgres://… ou POSTGRES_URL, ex. Neon, Supabase, Docker).
 * - Développement local : PGlite (PostgreSQL embarqué, aucune installation), DATABASE_URL=pglite:./.data/pglite.
 *   Les migrations et les données de départ sont alors appliquées automatiquement au premier accès.
 */
import path from "node:path";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

export class DatabaseUnavailableError extends Error {}

type DbHandle = { db: Db; kind: "postgres" | "pglite"; close: () => Promise<void> };

export function databaseUrl(): string {
  return (process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "").trim();
}

export function isPostgresUrl(url: string): boolean {
  return url.startsWith("postgres://") || url.startsWith("postgresql://");
}

export const MIGRATIONS_FOLDER = path.join(process.cwd(), "drizzle");

function pglitePath(url: string): string {
  if (url.startsWith("pglite:")) return url.slice("pglite:".length) || "./.data/pglite";
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_PGLITE !== "1") {
    throw new DatabaseUnavailableError(
      "DATABASE_URL manquante : configurez l'adresse de votre base PostgreSQL (voir docs/08-installation-et-deploiement.md).",
    );
  }
  return "./.data/pglite";
}

/** Ouvre une connexion. `autoSetup` applique migrations et données de départ (PGlite local). */
export async function openDatabase(options: { autoSetup: boolean }): Promise<DbHandle> {
  const url = databaseUrl();
  if (isPostgresUrl(url)) {
    const { default: postgres } = await import("postgres");
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const client = postgres(url, {
      max: Number(process.env.DATABASE_POOL_MAX ?? 5),
      prepare: false,
      idle_timeout: 20,
      connect_timeout: 10,
      onnotice: () => {},
    });
    // Le JSON est renvoyé brut et décodé une seule fois par Drizzle (sinon « "5" » deviendrait 5).
    const parsers = (client as unknown as { options: { parsers: Record<number, (value: string) => unknown> } }).options.parsers;
    parsers[114] = (value: string) => value;
    parsers[3802] = (value: string) => value;
    const db = drizzle({ client, schema }) as unknown as Db;
    return { db, kind: "postgres", close: () => client.end({ timeout: 5 }) };
  }

  // PGlite : un seul processus peut l'ouvrir. Pendant « next build », les pages sont générées
  // en parallèle : on ne l'ouvre pas, les pages utilisent les valeurs par défaut puis se mettent à jour.
  if (process.env.NEXT_PHASE === "phase-production-build") {
    throw new DatabaseUnavailableError("Base locale non utilisée pendant la construction du site.");
  }
  const dataDir = pglitePath(url);
  const { mkdirSync } = await import("node:fs");
  mkdirSync(path.dirname(path.resolve(/*turbopackIgnore: true*/ dataDir)), { recursive: true });
  const { PGlite, types } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  // Le JSON est renvoyé brut et décodé une seule fois par Drizzle, comme avec PostgreSQL.
  const raw = (value: string) => value;
  const client = new PGlite(dataDir, { parsers: { [types.JSON]: raw, [types.JSONB]: raw } });
  await client.waitReady;
  const db = drizzle({ client, schema }) as unknown as Db;
  if (options.autoSetup) {
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    await migrate(drizzle({ client, schema }), { migrationsFolder: MIGRATIONS_FOLDER });
    const { ensureSeedData } = await import("./seed");
    await ensureSeedData(db);
  }
  return { db, kind: "pglite", close: () => client.close() };
}

type GlobalWithDb = typeof globalThis & { __rnbDbPromise?: Promise<DbHandle> };

/** Connexion partagée par l'application (conservée entre les rechargements à chaud). */
export async function getDb(): Promise<Db> {
  const g = globalThis as GlobalWithDb;
  if (!g.__rnbDbPromise) {
    g.__rnbDbPromise = openDatabase({ autoSetup: !isPostgresUrl(databaseUrl()) }).catch((error: unknown) => {
      g.__rnbDbPromise = undefined;
      throw error;
    });
  }
  return (await g.__rnbDbPromise).db;
}
