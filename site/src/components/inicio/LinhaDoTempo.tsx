/**
 * Gráfico do calendário da troca (EC 132/2023, art. 125 a 129 do ADCT).
 * Mostra quanto do ICMS e do ISS ainda existe a cada ano. Os percentuais são os da lei,
 * não são cálculo: caem 10% em 2029, 20% em 2030, 30% em 2031, 40% em 2032 e acabam em 2033.
 */
const ANOS: { ano: string; antigo: number; nota: string; destaque?: boolean }[] = [
  { ano: "2026", antigo: 100, nota: "Teste: CBS 0,9% e IBS 0,1% só informados na nota" },
  { ano: "2027", antigo: 100, nota: "CBS substitui PIS e Cofins. IBS em teste, 0,1%", destaque: true },
  { ano: "2028", antigo: 100, nota: "Igual a 2027" },
  { ano: "2029", antigo: 90, nota: "ICMS e ISS 10% menores" },
  { ano: "2030", antigo: 80, nota: "20% menores" },
  { ano: "2031", antigo: 70, nota: "30% menores" },
  { ano: "2032", antigo: 60, nota: "40% menores" },
  { ano: "2033", antigo: 0, nota: "ICMS e ISS acabam" },
];

export function LinhaDoTempo() {
  return (
    <figure>
      <figcaption className="mb-4 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-suave">
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 bg-tinta" /> ICMS e ISS (imposto antigo)</span>
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 bg-marca-600" /> IBS (estados e municípios)</span>
      </figcaption>
      <ol className="border-t border-tinta">
        {ANOS.map(({ ano, antigo, nota, destaque }) => (
          <li
            key={ano}
            className={`grid grid-cols-[3.25rem_1fr] items-center gap-x-4 gap-y-1 border-b border-borda py-2.5 sm:grid-cols-[3.5rem_minmax(0,1fr)_15rem] ${destaque ? "bg-marcatexto/40" : ""}`}
          >
            <span className={`pl-1 font-mono text-sm ${destaque ? "font-semibold" : ""}`}>{ano}</span>
            <div className="flex h-4 bg-marca-600" role="img" aria-label={`${ano}: ICMS e ISS em ${antigo}% do nível atual`}>
              {antigo > 0 && <div className="barra-crescer h-full bg-tinta" style={{ width: `${antigo}%` }} />}
            </div>
            <span className="col-start-2 text-xs leading-snug text-suave sm:col-start-3">{nota}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-suave">
        A CBS (federal) entra inteira já em 2027. Fonte:{" "}
        <a href="https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc132.htm" className="underline underline-offset-2 hover:text-tinta">
          Emenda Constitucional 132/2023, art. 125 a 129 do ADCT
        </a>
        .
      </p>
    </figure>
  );
}
