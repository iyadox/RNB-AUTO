import type { MetadataRoute } from "next";
import { siteUrl } from "@/core/site-url";

const PAGES: { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/demande", priority: 0.9, changeFrequency: "monthly" },
  { path: "/depannage", priority: 0.8, changeFrequency: "monthly" },
  { path: "/remorquage", priority: 0.8, changeFrequency: "monthly" },
  { path: "/zones-d-intervention", priority: 0.7, changeFrequency: "monthly" },
  { path: "/panne-autoroute", priority: 0.7, changeFrequency: "monthly" },
  { path: "/questions-frequentes", priority: 0.6, changeFrequency: "monthly" },
  { path: "/entreprise", priority: 0.5, changeFrequency: "yearly" },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" },
  { path: "/conditions-d-intervention", priority: 0.3, changeFrequency: "yearly" },
  { path: "/mentions-legales", priority: 0.2, changeFrequency: "yearly" },
  { path: "/confidentialite", priority: 0.2, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return PAGES.map((page) => ({ url: `${base}${page.path}`, priority: page.priority, changeFrequency: page.changeFrequency }));
}
