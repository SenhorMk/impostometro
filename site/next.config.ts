import type { NextConfig } from "next";

/**
 * Cabeçalhos de segurança em todas as respostas (revisão de nov/2026). Explicação de cada
 * um em docs/seguranca.md.
 *
 * CSP (Content-Security-Policy): diz ao navegador de onde a página pode carregar coisas.
 * Usamos a versão "sem nonce" da documentação do Next (node_modules/next/dist/docs/01-app/
 * 02-guides/content-security-policy.md) para não perder as páginas estáticas: scripts só do
 * próprio site (os inline do Next precisam de 'unsafe-inline'), conexões só com o próprio
 * site, o Supabase e o Sentry, e ninguém pode colocar o site dentro de um iframe.
 */
const desenvolvimento = process.env.NODE_ENV === "development";
const previa = process.env.VERCEL_ENV === "preview"; // barra de comentários da Vercel nas prévias
const supabase = process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).origin : "";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${desenvolvimento ? " 'unsafe-eval'" : ""}${previa ? " https://vercel.live" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' blob: data:${previa ? " https://vercel.live https://vercel.com" : ""}`,
  "font-src 'self'",
  `connect-src 'self'${supabase ? ` ${supabase} ${supabase.replace(/^https:/, "wss:")}` : ""} https://*.ingest.sentry.io https://*.ingest.us.sentry.io${previa ? " https://vercel.live wss://ws-us3.pusher.com" : ""}`,
  `frame-src ${previa ? "https://vercel.live" : "'none'"}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(desenvolvimento ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const cabecalhosSeguranca = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  poweredByHeader: false, // não anuncia "X-Powered-By: Next.js"
  async headers() {
    return [
      { source: "/:path*", headers: cabecalhosSeguranca },
      // Respostas da API com dados de conta nunca ficam guardadas em cache compartilhado.
      { source: "/api/assinatura", headers: [{ key: "Cache-Control", value: "no-store" }] },
      { source: "/api/calcular-lote", headers: [{ key: "Cache-Control", value: "no-store" }] },
      { source: "/api/acesso", headers: [{ key: "Cache-Control", value: "private, no-store" }] },
    ];
  },
  // Login (T13): o navegador fala direto com o Supabase usando a chave PUBLICÁVEL, que só
  // dá o que as regras do banco (RLS) permitem. Reaproveita as variáveis do T10.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL ?? "",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY ?? "",
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
