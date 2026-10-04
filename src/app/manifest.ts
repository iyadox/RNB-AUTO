import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RNB AUTO — Dépannage et remorquage",
    short_name: "RNB AUTO",
    description: "Dépannage et remorquage à Bobigny et en Île-de-France.",
    start_url: "/",
    display: "standalone",
    background_color: "#08090b",
    theme_color: "#0d0f12",
    lang: "fr",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
