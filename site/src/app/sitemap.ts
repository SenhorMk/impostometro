import type { MetadataRoute } from "next";
import { INDEXAR_SITE, URL_SITE } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!INDEXAR_SITE) return [];

  // /entrar é provisória; APIs não são páginas para os resultados de busca.
  return ["/", "/termos", "/privacidade"].map((caminho) => ({
    url: new URL(caminho, URL_SITE).href,
  }));
}
