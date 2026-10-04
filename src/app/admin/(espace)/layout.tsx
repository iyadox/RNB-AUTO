import { eq } from "drizzle-orm";
import { after } from "next/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { interventions } from "@/server/db/schema";
import { runMaintenance } from "@/server/maintenance";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const db = await getDb();
  const newOnes = await db.select({ id: interventions.id }).from(interventions).where(eq(interventions.status, "new"));
  // Entretien de secours si aucune tâche planifiée n'est configurée (au plus toutes les 6 h).
  after(() => runMaintenance(db).catch((error: unknown) => console.error("[entretien]", error)));
  return (
    <AdminShell userName={user.name} newCount={newOnes.length}>
      {children}
    </AdminShell>
  );
}
