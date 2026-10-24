/**
 * Version HTML de l'email « nouvelle demande » : lisible sur téléphone, avec un gros bouton
 * pour ouvrir la demande et un lien pour rappeler le client. Toute donnée est échappée.
 */

export type NewRequestEmail = {
  companyName: string;
  reference: string;
  contactName: string;
  contactPhone: string;
  pickup: string;
  destination: string;
  vehicle: string;
  problem: string;
  estimate: string | null;
  url: string;
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}

export function newRequestEmailHtml(data: NewRequestEmail): string {
  const e = escapeHtml;
  const row = (label: string, value: string) =>
    `<tr><td style="padding:8px 0;color:#5b6270;font-size:14px;vertical-align:top;width:130px">${e(label)}</td><td style="padding:8px 0;font-size:16px;font-weight:700;color:#0d0f12">${e(value)}</td></tr>`;
  const phoneHref = `tel:${data.contactPhone.replace(/[^\d+]/g, "")}`;
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(data.reference)}</title></head>
<body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:16px 0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden">
<tr><td style="background:#0d0f12;padding:20px 24px;color:#ffffff">
<p style="margin:0;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#ffc400;font-weight:700">Nouvelle demande</p>
<p style="margin:6px 0 0;font-size:22px;font-weight:800">${e(data.contactName)}</p>
<p style="margin:4px 0 0;font-size:14px;color:#c7cbd3">${e(data.reference)} · ${e(data.companyName)}</p>
</td></tr>
<tr><td style="padding:20px 24px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${row("Téléphone", data.contactPhone)}
${row("Prise en charge", data.pickup)}
${row("Destination", data.destination)}
${row("Véhicule", data.vehicle)}
${row("Situation", data.problem)}
${row("Estimation montrée", data.estimate ?? "Aucune : à rappeler pour un prix")}
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px"><tr>
<td style="padding-right:6px" width="50%"><a href="${e(data.url)}" style="display:block;background:#ffc400;color:#0d0f12;text-decoration:none;text-align:center;font-weight:800;font-size:16px;padding:16px 8px;border-radius:14px">Ouvrir la demande</a></td>
<td style="padding-left:6px" width="50%"><a href="${e(phoneHref)}" style="display:block;background:#0d0f12;color:#ffffff;text-decoration:none;text-align:center;font-weight:800;font-size:16px;padding:16px 8px;border-radius:14px">Appeler le client</a></td>
</tr></table>
</td></tr>
<tr><td style="padding:14px 24px 22px;color:#8a909c;font-size:12px">Email automatique de votre espace de gestion. La demande est aussi visible dans l'espace, même sans email.</td></tr>
</table></td></tr></table>
</body></html>`;
}
