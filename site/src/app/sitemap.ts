import type { MetadataRoute } from "next";
import { INDEXAR_SITE, URL_SITE } from "@/lib/seo";
import { ARTIGOS } from "@/dados/conteudo";
import { ATIVIDADES } from "@/lib/exemplos";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!INDEXAR_SITE) return [];

  // /entrar é provisória; APIs não são páginas para os resultados de busca.
  const datas = new Map(ARTIGOS.map(({ slug, atualizadoEm }) => [`/artigos/${slug}`, atualizadoEm]));
  return [
    "/",
    "/imposto-2027",
    ...ATIVIDADES.map(({ id }) => `/imposto-2027/${id}`),
    "/artigos",
    ...ARTIGOS.map(({ slug }) => `/artigos/${slug}`),
    "/glossario",
    "/termos",
    "/privacidade",
  ].map((caminho) => ({
    url: new URL(caminho, URL_SITE).href,
    ...(datas.get(caminho) ? { lastModified: datas.get(caminho) } : {}),
  }));
}
