import type { MetadataRoute } from "next";
import { siteUrl } from "@/core/site-url";

/** Le suivi d'une demande est personnel (lien à jeton) : jamais exploré. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/suivi/"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
