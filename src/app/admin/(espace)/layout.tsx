import { after } from "next/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { watchSummary } from "@/server/interventions/dashboard";
import { runMaintenance } from "@/server/maintenance";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const db = await getDb();
  const watch = await watchSummary(db);
  // Entretien de secours si aucune tâche planifiée n'est configurée (au plus toutes les 6 h).
  after(() => runMaintenance(db).catch((error: unknown) => console.error("[entretien]", error)));
  return (
    <AdminShell userName={user.name} watch={watch}>
      {children}
    </AdminShell>
  );
}
