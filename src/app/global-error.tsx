"use client";

/** Dernier filet de sécurité : même si tout le reste plante, le client peut appeler. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, background: "#08090b", color: "#f5f3ee", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ maxWidth: 560, margin: "0 auto", padding: "96px 24px" }}>
          <p style={{ color: "#ffc400", fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>RNB AUTO</p>
          <h1 style={{ fontSize: 40, lineHeight: 1.1 }}>Un problème technique est survenu.</h1>
          <p style={{ color: "#c8ced6", fontSize: 18 }}>
            Le site rencontre une difficulté momentanée. Vous pouvez réessayer, ou revenir à l&apos;accueil pour nous appeler.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={reset}
              style={{ background: "#ffc400", color: "#08090b", border: 0, borderRadius: 16, padding: "16px 24px", fontWeight: 800, fontSize: 16 }}
            >
              Réessayer
            </button>
            <a href="/" style={{ color: "#f5f3ee", border: "1px solid #444", borderRadius: 16, padding: "16px 24px", fontWeight: 700, textDecoration: "none" }}>
              Accueil
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
