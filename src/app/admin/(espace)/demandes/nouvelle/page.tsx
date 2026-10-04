import type { Metadata } from "next";
import { QuoteSimulator } from "@/components/admin/quote-simulator";
import { Alert, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { isSimulationMode } from "@/server/geo/service";
import { loadSimulatorData } from "@/server/pricing-admin/simulator";

export const metadata: Metadata = { title: "Nouvelle demande" };

export default async function NewRequestPage() {
  await requireAdmin();
  const db = await getDb();
  const data = await loadSimulatorData(db);
  return (
    <>
      <PageHeader
        title="Nouvelle demande"
        description="Un client vous appelle : calculez le prix à annoncer, puis enregistrez sa demande."
        back={{ href: "/admin/demandes", label: "Demandes" }}
      />
      {isSimulationMode() ? (
        <div className="mb-5">
          <Alert tone="danger" title="Mode simulation des trajets">
            Les distances sont approximatives tant que la variable GEO_PROVIDER vaut « simulation ».
          </Alert>
        </div>
      ) : null}
      <QuoteSimulator
        mode="phone"
        vehicles={data.vehicles}
        situations={data.situations}
        now={data.now}
        depot={data.depot}
        fuelPriceMillis={data.fuel.priceTtcMillis}
        minimum={data.minimum}
      />
    </>
  );
}
