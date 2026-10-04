import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import { siteUrl } from "@/core/site-url";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "RNB AUTO — Dépannage et remorquage à Bobigny et en Île-de-France",
    template: "%s · RNB AUTO",
  },
  description:
    "Dépannage et remorquage à Bobigny, en Seine-Saint-Denis, à Paris et en Île-de-France. Prix estimé en moins d'une minute, confirmé avant l'intervention. Appel, WhatsApp ou demande en ligne.",
  applicationName: "RNB AUTO",
  formatDetection: { telephone: false, address: false, email: false },
  openGraph: { type: "website", locale: "fr_FR", siteName: "RNB AUTO" },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0d0f12",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={archivo.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
