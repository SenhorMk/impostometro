import type { MetadataRoute } from "next";
import { INDEXAR_SITE, URL_SITE } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  if (!INDEXAR_SITE) return { rules: { userAgent: "*", disallow: "/" } };

  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: new URL("/sitemap.xml", URL_SITE).href,
  };
}
