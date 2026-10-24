/**
 * Petit service de l'espace de gestion (portée `/admin/`), utilisé UNIQUEMENT pour afficher la
 * notification « Nouvelle demande » : sur Android (et sur iPhone, espace ajouté à l'écran
 * d'accueil), le téléphone n'accepte les notifications que par ce biais.
 * Aucune mise en cache, aucune interception des requêtes, aucune donnée : le script est le même
 * pour tout le monde (il ne contient rien de privé).
 */
const SCRIPT = `
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || "/admin", self.location.origin);
  if (target.origin !== self.location.origin || !target.pathname.startsWith("/admin")) return;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if (new URL(client.url).pathname.startsWith("/admin") && "focus" in client) {
          return client.focus().then((focused) => (focused && "navigate" in focused ? focused.navigate(target.href) : undefined));
        }
      }
      return self.clients.openWindow(target.href);
    }),
  );
});
`;

export function GET() {
  return new Response(SCRIPT, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache",
      "Service-Worker-Allowed": "/admin/",
    },
  });
}
