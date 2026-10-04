import { ImageResponse } from "next/og";

export const alt = "RNB AUTO — Dépannage et remorquage à Bobigny et en Île-de-France";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(160deg, #1b2532 0%, #0d0f12 55%, #08090b 100%)",
          color: "#f5f3ee",
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <svg width="88" height="88" viewBox="0 0 48 48">
            <path d="M24 1.5 46.5 24 24 46.5 1.5 24Z" fill="#f5f3ee" />
            <path d="M24 5.5 42.5 24 24 42.5 5.5 24Z" fill="#ffc400" />
            <circle cx="24" cy="13.2" r="2.2" fill="none" stroke="#08090b" strokeWidth="2.2" />
            <path d="M24 15.6V27.3a5.4 5.4 0 1 1-5.4-5.4" fill="none" stroke="#08090b" strokeWidth="3.1" strokeLinecap="round" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: 4 }}>RNB AUTO</div>
            <div style={{ fontSize: 22, color: "#ffc400", letterSpacing: 8 }}>DÉPANNAGE · REMORQUAGE</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 96, fontWeight: 900, lineHeight: 1 }}>Besoin d&apos;un</div>
          <div style={{ fontSize: 96, fontWeight: 900, lineHeight: 1, color: "#ffc400" }}>dépannage ?</div>
          <div style={{ fontSize: 30, marginTop: 24, color: "#c8ced6" }}>
            Bobigny · Seine-Saint-Denis · Paris · Île-de-France — prix estimé en 1 minute
          </div>
        </div>
        <div style={{ display: "flex", height: 14, background: "#ffc400", borderRadius: 8 }} />
      </div>
    ),
    size,
  );
}
