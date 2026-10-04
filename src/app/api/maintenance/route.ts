/**
 * Entretien quotidien (tâche planifiée de l'hébergeur, voir vercel.json).
 * Protégé par la variable d'environnement CRON_SECRET (en-tête « Authorization: Bearer … »).
 */
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/server/db/client";
import { runMaintenance } from "@/server/maintenance";

export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ ok: false }, { status: 401 });
  const report = await runMaintenance(await getDb(), { force: true });
  return NextResponse.json({ ok: true, ...report });
}
