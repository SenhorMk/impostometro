import Link from "next/link";

/**
 * Explicação visual da transição (EC 132/2023 e LC 214/2025): quanto do imposto antigo
 * (ICMS e ISS) ainda existe a cada ano. Os percentuais são os da lei, não são cálculo:
 * o ICMS e o ISS caem 10% em 2029, 20% em 2030, 30% em 2031, 40% em 2032 e acabam em 2033.
 * Detalhes e fontes: /artigos/linha-do-tempo-2026-a-2033.
 */
const ANOS = [
  { ano: "2026", antigo: 100, novo: "Teste: CBS 0,9% e IBS 0,1% só informados na nota", destaque: false },
  { ano: "2027", antigo: 100, novo: "CBS no lugar de PIS e Cofins. IBS em teste (0,1%)", destaque: true },
  { ano: "2028", antigo: 100, novo: "Igual a 2027", destaque: false },
  { ano: "2029", antigo: 90, novo: "ICMS e ISS 10% menores; IBS sobe", destaque: false },
  { ano: "2030", antigo: 80, novo: "ICMS e ISS 20% menores", destaque: false },
  { ano: "2031", antigo: 70, novo: "ICMS e ISS 30% menores", destaque: false },
  { ano: "2032", antigo: 60, novo: "ICMS e ISS 40% menores", destaque: false },
  { ano: "2033", antigo: 0, novo: "ICMS e ISS acabam. Só CBS e IBS", destaque: false },
];

export function LinhaDoTempo() {
  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-4 text-xs text-marca-100">
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-5 rounded-sm bg-white/25" /> ICMS e ISS (imposto antigo)</span>
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-5 rounded-sm bg-destaque" /> IBS (imposto novo de estados e municípios)</span>
      </div>
      <ol className="space-y-3">
        {ANOS.map(({ ano, antigo, novo, destaque }) => (
          <li key={ano} className="grid grid-cols-[3.25rem_1fr] items-center gap-3 sm:grid-cols-[3.5rem_1fr_16rem]">
            <span className={`text-sm font-bold ${destaque ? "text-destaque" : "text-white"}`}>{ano}</span>
            <div
              className={`flex h-6 overflow-hidden rounded-md bg-destaque ${destaque ? "ring-2 ring-destaque ring-offset-2 ring-offset-marca-900" : ""}`}
              role="img"
              aria-label={`${ano}: ICMS e ISS em ${antigo}% do nível atual`}
            >
              {antigo > 0 && (
                <div className="barra-crescer h-full bg-[#3d6b60]" style={{ width: `${antigo}%` }} />
              )}
            </div>
            <span className="col-span-2 -mt-1 text-xs leading-snug text-marca-100 sm:col-span-1 sm:mt-0">{novo}</span>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-sm text-marca-100">
        A CBS (federal) entra inteira já em 2027. Fonte:{" "}
        <a href="https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc132.htm" className="underline underline-offset-4">
          Emenda Constitucional 132/2023 (art. 125 a 129 do ADCT)
        </a>
        .{" "}
        <Link href="/artigos/linha-do-tempo-2026-a-2033" className="font-semibold text-white underline underline-offset-4">
          Entenda ano a ano, com as fontes
        </Link>
      </p>
    </div>
  );
}
