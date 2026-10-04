import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: { default: "Espace RNB AUTO", template: "%s · Espace RNB AUTO" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#0d0f12" };

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="theme-admin">{children}</div>;
}
