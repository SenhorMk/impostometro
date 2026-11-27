import Link from "next/link";
import { atividadePorId, calcularExemplo } from "@/lib/exemplos";
import { emPercentual, emReais } from "@/lib/formato";

/** Setores mais buscados, em tabela. Cada linha leva à página "Imposto de ... em 2027". */
export const SETORES_EM_DESTAQUE = [
  "restaurante",
  "cabeleireiro",
  "clinica-medica",
  "ensino-fundamental",
  "roupas",
  "advogado",
  "software-encomenda",
  "hotel",
  "mecanica",
  "farmacia",
  "mercado-arroz",
  "contador",
];

export async function Setores() {
  const linhas = await Promise.all(
    SETORES_EM_DESTAQUE.map(async (id) => ({ atividade: atividadePorId(id)!, resultado: await calcularExemplo(id) })),
  );

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-y border-tinta text-left font-mono text-[11px] uppercase tracking-[0.12em] text-suave">
          <th scope="col" className="py-2.5 pr-3 font-normal">Atividade</th>
          <th scope="col" className="hidden py-2.5 pr-3 font-normal sm:table-cell">Redução</th>
          <th scope="col" className="py-2.5 pr-3 text-right font-normal">Imposto</th>
          <th scope="col" className="py-2.5 text-right font-normal">%</th>
        </tr>
      </thead>
      <tbody>
        {linhas.map(({ atividade, resultado }) => (
          <tr key={atividade.id} className="group border-b border-borda">
            <th scope="row" className="py-3 pr-3 text-left font-normal">
              <Link href={`/imposto-2027/${atividade.id}`} className="underline decoration-borda underline-offset-4 group-hover:decoration-tinta">
                {atividade.nome}
              </Link>
            </th>
            {resultado.ok ? (
              <>
                <td className="hidden py-3 pr-3 text-suave sm:table-cell">
                  {resultado.semAliquota ? "sem imposto" : resultado.cbs.reducao > 0 ? `${resultado.cbs.reducao.toLocaleString("pt-BR")}%` : "—"}
                </td>
                <td className="py-3 pr-3 text-right font-mono tabular-nums">{emReais(resultado.total)}</td>
                <td className="py-3 text-right font-mono tabular-nums text-suave">{emPercentual(resultado.percentualSobreVenda)}</td>
              </>
            ) : (
              <td colSpan={3} className="py-3 text-right text-suave">não calculado</td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
