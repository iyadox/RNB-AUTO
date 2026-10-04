"use server";

/** Connexion, déconnexion et création du premier compte administrateur. */
import { timingSafeEqual } from "node:crypto";
import { count, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword, passwordProblem, verifyPassword } from "@/server/auth/password";
import { createSession, destroySession } from "@/server/auth/session";
import { setupRequiresToken } from "@/server/auth/setup";
import { getDb } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { hashIdentifier, rateLimit, rateLimitByIp } from "@/server/security/rate-limit";

export type FormState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

// Empreinte factice : même temps de calcul que l'adresse email existe ou non.
const DUMMY_HASH = "scrypt$131072$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";

const loginSchema = z.object({
  email: z.email({ error: "Adresse email invalide." }).transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1, { error: "Indiquez votre mot de passe." }).max(200),
});

export async function loginAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Identifiants invalides." };
  const { email, password } = parsed.data;

  const byIp = await rateLimitByIp("connexion", 20, 900);
  const byEmail = await rateLimit(`connexion-email:${hashIdentifier(email)}`, 8, 900);
  if (!byIp.ok || !byEmail.ok) {
    return { error: "Trop de tentatives. Pour votre sécurité, réessayez dans 15 minutes." };
  }

  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid || !user.active) return { error: "Email ou mot de passe incorrect." };

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  await createSession(user.id);
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/connexion");
}

function sameSecret(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

const setupSchema = z
  .object({
    token: z.string().max(500).optional().default(""),
    name: z.string().trim().min(2, { error: "Indiquez un nom." }).max(80),
    email: z.email({ error: "Adresse email invalide." }).transform((v) => v.toLowerCase().trim()),
    password: z.string().max(200),
    confirm: z.string().max(200),
  })
  .refine((v) => v.password === v.confirm, { error: "Les deux mots de passe sont différents.", path: ["confirm"] });

export async function setupAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const limit = await rateLimitByIp("installation", 10, 900);
  if (!limit.ok) return { error: "Trop de tentatives. Réessayez dans 15 minutes." };

  const parsed = setupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] ??= issue.message;
    return { error: "Vérifiez le formulaire.", fieldErrors };
  }
  const { token, name, email, password } = parsed.data;
  const problem = passwordProblem(password);
  if (problem) return { error: problem, fieldErrors: { password: problem } };

  if (setupRequiresToken()) {
    const expected = process.env.SETUP_TOKEN?.trim();
    if (!expected) {
      return { error: "La variable SETUP_TOKEN n'est pas configurée sur le serveur. Ajoutez-la puis redéployez." };
    }
    if (!sameSecret(token.trim(), expected)) return { error: "Code d'installation incorrect.", fieldErrors: { token: "Code incorrect." } };
  }

  const db = await getDb();
  const created = await db.transaction(async (tx) => {
    const [existing] = await tx.select({ n: count() }).from(users);
    if ((existing?.n ?? 0) > 0) return null;
    const [user] = await tx
      .insert(users)
      .values({ name, email, passwordHash: await hashPassword(password), role: "admin" })
      .returning({ id: users.id });
    return user ?? null;
  });
  if (!created) redirect("/admin/connexion");
  await createSession(created.id);
  redirect("/admin");
}
