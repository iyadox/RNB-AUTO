import { STATUS_META, type InterventionStatus } from "@/core/interventions/status";
import { Badge } from "@/components/admin/ui";
import { Icon } from "@/components/ui/icon";

export function StatusBadge({ status }: { status: InterventionStatus }) {
  const meta = STATUS_META[status];
  return (
    <Badge tone={meta.tone === "muted" ? "neutral" : meta.tone}>
      <Icon name={meta.icon} size={12} strokeWidth={3} />
      {meta.label}
    </Badge>
  );
}
