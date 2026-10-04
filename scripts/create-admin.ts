/**
 * Crée (ou réinitialise) un compte administrateur.
 *
 *   npm run admin:create -- --email vous@exemple.fr --name "Prénom" --password "MotDePasse123"
 *
 * Sans arguments, les informations sont demandées une par une.
 */
import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { loadEnvConfig } from "@next/env";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { hashPassword, passwordProblem } from "../src/server/auth/password";
import { openDatabase } from "../src/server/db/client";
import { sessions, users } from "../src/server/db/schema";

loadEnvConfig(process.cwd());

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function ask(question: string, hidden = false): Promise<string> {
  let muted = false;
  const output = new Writable({
    write(chunk, _encoding, callback) {
      if (!muted) process.stdout.write(chunk);
      callback();
    },
  });
  const rl = createInterface({ input: process.stdin, output, terminal: true });
  const answerPromise = rl.question(question);
  muted = hidden;
  const answer = await answerPromise;
  rl.close();
  if (hidden) process.stdout.write("\n");
  return answer.trim();
}

async function main() {
  const email = (arg("email") ?? (await ask("Email de connexion : "))).toLowerCase();
  if (!z.email().safeParse(email).success) throw new Error("Adresse email invalide.");
  const name = arg("name") ?? ((await ask("Nom affiché (ex. Administrateur) : ")) || "Administrateur");
  const password = arg("password") ?? (await ask("Mot de passe (10 caractères minimum) : ", true));
  const problem = passwordProblem(password);
  if (problem) throw new Error(problem);

  const handle = await openDatabase({ autoSetup: true });
  try {
    const passwordHash = await hashPassword(password);
    const [existing] = await handle.db.select().from(users).where(eq(users.email, email));
    if (existing) {
      await handle.db
        .update(users)
        .set({ passwordHash, name, active: true, passwordChangedAt: new Date() })
        .where(eq(users.id, existing.id));
      await handle.db.delete(sessions).where(eq(sessions.userId, existing.id));
      console.log(`✔ Mot de passe réinitialisé pour ${email}.`);
    } else {
      await handle.db.insert(users).values({ email, name, passwordHash, role: "admin" });
      console.log(`✔ Compte administrateur créé : ${email}`);
    }
  } finally {
    await handle.close();
  }
}

main().catch((error: unknown) => {
  console.error("✖", error instanceof Error ? error.message : error);
  process.exit(1);
});
