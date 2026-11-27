import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Login (T13): o navegador fala direto com o Supabase usando a chave PUBLICÁVEL, que só
  // dá o que as regras do banco (RLS) permitem. Reaproveita as variáveis do T10.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL ?? "",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY ?? "",
    // T14: só diz SE a cobrança está ligada (nunca repassa as chaves secretas).
    NEXT_PUBLIC_ASSINATURA_ATIVA: process.env.ASAAS_API_KEY && process.env.SUPABASE_SECRET_KEY ? "1" : "",
    // T07: o DSN do Sentry é público por natureza (só serve para ENVIAR erros ao projeto).
    NEXT_PUBLIC_SENTRY_DSN: process.env.SENTRY_DSN ?? "",
    NEXT_PUBLIC_AMBIENTE: process.env.VERCEL_ENV ?? "local",
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
