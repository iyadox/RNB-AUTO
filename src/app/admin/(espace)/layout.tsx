import { eq } from "drizzle-orm";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { interventions } from "@/server/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const db = await getDb();
  const newOnes = await db.select({ id: interventions.id }).from(interventions).where(eq(interventions.status, "new"));
  return (
    <AdminShell userName={user.name} newCount={newOnes.length}>
      {children}
    </AdminShell>
  );
}
