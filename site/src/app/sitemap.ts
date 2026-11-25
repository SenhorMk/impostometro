import type { MetadataRoute } from "next";
import { INDEXAR_SITE, URL_SITE } from "@/lib/seo";
import { ARTIGOS } from "@/dados/conteudo";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!INDEXAR_SITE) return [];

  // /entrar é provisória; APIs não são páginas para os resultados de busca.
  return ["/", "/termos", "/privacidade", "/artigos", "/glossario", ...ARTIGOS.map(({ slug }) => `/artigos/${slug}`)].map((caminho) => ({
    url: new URL(caminho, URL_SITE).href,
  }));
}
