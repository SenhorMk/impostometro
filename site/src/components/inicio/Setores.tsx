import Link from "next/link";
import { atividadePorId, calcularExemplo, EXEMPLO_PADRAO } from "@/lib/exemplos";
import { emPercentual } from "@/lib/formato";

/** Setores mais buscados. Cada cartão leva à página "Imposto em 2027 para..." do setor. */
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
  const cartoes = await Promise.all(
    SETORES_EM_DESTAQUE.map(async (id) => ({ atividade: atividadePorId(id)!, resultado: await calcularExemplo(id) })),
  );

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {cartoes.map(({ atividade, resultado }) => (
        <li key={atividade.id}>
          <Link
            href={`/imposto-2027/${atividade.id}`}
            className="group flex h-full flex-col justify-between rounded-2xl border border-borda bg-white p-4 transition hover:-translate-y-0.5 hover:border-marca-600 hover:shadow-lg hover:shadow-marca-900/5"
          >
            <span className="text-sm font-medium leading-snug">{atividade.nome}</span>
            <span className="mt-3 flex items-end justify-between gap-2">
              {resultado.ok ? (
                <span>
                  <span className="block text-xl font-bold text-marca-800">{emPercentual(resultado.percentualSobreVenda)}</span>
                  <span className="text-[11px] text-suave">de CBS + IBS na venda</span>
                </span>
              ) : (
                <span className="text-xs text-suave">não calculado</span>
              )}
              <span aria-hidden className="text-marca-600 transition group-hover:translate-x-0.5">→</span>
            </span>
          </Link>
        </li>
      ))}
      <li className="col-span-2 text-xs text-suave sm:col-span-3 lg:col-span-4">
        Percentual sobre uma venda de exemplo em {EXEMPLO_PADRAO.cidade}, com a alíquota provisória de 2027, antes de créditos de compras.{" "}
        <Link href="/imposto-2027" className="font-medium text-marca-800 underline underline-offset-4">Ver todos os setores</Link>
      </li>
    </ul>
  );
}
