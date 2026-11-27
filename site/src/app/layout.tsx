import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from "next/font/google";
import { SITE } from "@/lib/config";
import { INDEXAR_SITE, URL_SITE } from "@/lib/seo";
import "./globals.css";

// Identidade: títulos em serifa editorial (Newsreader), texto em IBM Plex Sans e números
// em IBM Plex Mono, como num documento fiscal. Todas de código aberto (SIL OFL).
const textoFonte = IBM_Plex_Sans({ variable: "--fonte-texto", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const numerosFonte = IBM_Plex_Mono({ variable: "--fonte-numeros", subsets: ["latin"], weight: ["400", "500", "600"] });
const tituloFonte = Newsreader({ variable: "--fonte-titulo", subsets: ["latin"], weight: ["500", "600", "700"], style: ["normal", "italic"] });

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
  twitter: { card: "summary_large_image" },
  applicationName: SITE.nome,
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: "#faf9f5" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${textoFonte.variable} ${numerosFonte.variable} ${tituloFonte.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
