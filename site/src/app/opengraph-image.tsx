import { ImageResponse } from "next/og";
import { SITE } from "@/lib/config";

/**
 * Imagem que aparece quando alguém compartilha o link no WhatsApp, LinkedIn etc.
 * Gerada no build a partir deste código (sem arquivo de imagem no repositório).
 */
export const alt = "Calculadora de CBS e IBS de 2027: quanto sua empresa vai pagar de imposto";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function ImagemCompartilhamento() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#faf9f5",
          color: "#141414",
          borderBottom: "24px solid #141414",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 34, fontWeight: 700 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 4,
              background: "#141414",
              color: "#faf9f5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
            }}
          >
            %
          </div>
          {SITE.nome}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", flexWrap: "wrap", fontSize: 72, fontWeight: 800, lineHeight: 1.1, letterSpacing: -2 }}>
            Quanto de imposto a sua empresa paga&nbsp;<span style={{ background: "#fbe88a" }}>a partir de 2027</span>
          </div>
          <div style={{ marginTop: 24, fontSize: 32, color: "#57554f" }}>
            CBS e IBS em 2 minutos. Grátis, sem cadastro e com a conta aberta.
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 24, color: "#57554f" }}>
          Site independente, não é do governo. Usa a calculadora de código aberto da Receita Federal (licença MIT).
        </div>
      </div>
    ),
    size,
  );
}
