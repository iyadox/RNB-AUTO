import "server-only";

/** Premier lancement : y a-t-il déjà un compte, et faut-il le code d'installation ? */
import { count } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { users } from "@/server/db/schema";

export async function hasAnyUser(): Promise<boolean> {
  const db = await getDb();
  const [row] = await db.select({ n: count() }).from(users);
  return (row?.n ?? 0) > 0;
}

/** La création du premier compte exige le code SETUP_TOKEN en production (ou s'il est défini). */
export function setupRequiresToken(): boolean {
  return process.env.NODE_ENV === "production" || Boolean(process.env.SETUP_TOKEN?.trim());
}
