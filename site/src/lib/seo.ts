/** Endereço público decidido no T04; sem configuração, não pedir indexação. */
const endereco = process.env.SITE_URL?.trim();
export const URL_SITE = new URL(endereco || "http://localhost:3000");

if (
  !["http:", "https:"].includes(URL_SITE.protocol) ||
  URL_SITE.username || URL_SITE.password ||
  URL_SITE.pathname !== "/" || URL_SITE.search || URL_SITE.hash
) {
  throw new Error("SITE_URL deve ser o endereço raiz do site, sem caminho, credenciais ou parâmetros.");
}

// Prévias continuam bloqueadas mesmo quando herdam SITE_URL de produção.
export const INDEXAR_SITE = Boolean(endereco) &&
  URL_SITE.protocol === "https:" &&
  process.env.NODE_ENV === "production" &&
  (!process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production");
