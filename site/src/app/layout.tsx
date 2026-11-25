import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SITE } from "@/lib/config";
import { INDEXAR_SITE, URL_SITE } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: URL_SITE,
  robots: { index: INDEXAR_SITE, follow: true },
  title: {
    default: "Como calcular meu imposto em 2027? Calculadora de CBS e IBS grátis",
    template: `%s | ${SITE.nome}`,
  },
  description: SITE.descricao,
  openGraph: {
    title: "Quanto sua empresa vai pagar de imposto em 2027?",
    description: SITE.descricao,
    locale: "pt_BR",
    type: "website",
    siteName: SITE.nome,
  },
};

export const viewport: Viewport = { themeColor: "#0b3d33" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
