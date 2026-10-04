import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0d0f12" }}>
        <svg width="140" height="140" viewBox="0 0 48 48">
          <path d="M24 1.5 46.5 24 24 46.5 1.5 24Z" fill="#f5f3ee" />
          <path d="M24 5.5 42.5 24 24 42.5 5.5 24Z" fill="#ffc400" />
          <circle cx="24" cy="13.2" r="2.2" fill="none" stroke="#08090b" strokeWidth="2.2" />
          <path d="M24 15.6V27.3a5.4 5.4 0 1 1-5.4-5.4" fill="none" stroke="#08090b" strokeWidth="3.1" strokeLinecap="round" />
          <path d="m18.6 21.9-1.9 2.2" stroke="#08090b" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      </div>
    ),
    size,
  );
}
