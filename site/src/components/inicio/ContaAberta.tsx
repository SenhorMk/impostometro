import { emPercentual, emReais } from "@/lib/formato";
import type { ResultadoCalculo } from "@/lib/tipos";

/**
 * A conta em blocos: valor × alíquota × parte que se paga = imposto.
 * Todos os números vêm do porte (exemplo calculado em lib/exemplos.ts).
 */
const Bloco = ({ rotulo, valor, nota, forte }: { rotulo: string; valor: string; nota?: string; forte?: boolean }) => (
  <div className={`rounded-xl px-3 py-2.5 text-center ${forte ? "bg-marca-700 text-white" : "border border-borda bg-white"}`}>
    <p className={`text-[11px] ${forte ? "text-marca-100" : "text-suave"}`}>{rotulo}</p>
    <p className="font-mono text-base font-bold sm:text-lg">{valor}</p>
    {nota && <p className={`text-[10px] ${forte ? "text-marca-100" : "text-suave"}`}>{nota}</p>}
  </div>
);
const Sinal = ({ s }: { s: string }) => <span aria-hidden className="text-lg font-bold text-suave">{s}</span>;

export function ContaAberta({ resultado, descricao }: { resultado: ResultadoCalculo; descricao: string }) {
  if (!resultado.ok) {
    return (
      <div className="rounded-2xl border border-borda bg-fundo p-6 text-sm text-suave">
        Exemplo não calculado: {resultado.mensagem}
      </div>
    );
  }
  const { base, cbs, ibsTotal, total, fundamentacao } = resultado;
  const paga = Math.round((100 - cbs.reducao) * 100) / 100;

  return (
    <div className="rounded-2xl border border-borda bg-fundo p-5 sm:p-6">
      <p className="text-sm font-medium text-suave">Exemplo: {descricao} de {emReais(base)}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Bloco rotulo="Valor da venda" valor={emReais(base)} />
        <Sinal s="×" />
        <Bloco rotulo="Alíquota da CBS" valor={emPercentual(cbs.aliquota)} nota={resultado.periodoAliquotas.status === "provisorio" ? "provisória" : undefined} />
        {cbs.reducao > 0 && (
          <>
            <Sinal s="×" />
            <Bloco rotulo="Parte que se paga" valor={`${paga.toLocaleString("pt-BR")}%`} nota={`redução de ${cbs.reducao.toLocaleString("pt-BR")}%${fundamentacao ? `, ${fundamentacao}` : ""}`} />
          </>
        )}
        <Sinal s="=" />
        <Bloco rotulo="CBS" valor={emReais(cbs.valor)} forte />
      </div>
      <dl className="mt-5 space-y-1.5 border-t border-borda pt-4 text-sm">
        <div className="flex justify-between"><dt className="text-suave">Alíquota efetiva da CBS</dt><dd className="font-mono">{emPercentual(cbs.aliquotaEfetiva)}</dd></div>
        <div className="flex justify-between"><dt className="text-suave">IBS (fase de teste)</dt><dd className="font-mono">{emReais(ibsTotal)}</dd></div>
        <div className="flex justify-between font-bold"><dt>Total de CBS + IBS</dt><dd className="font-mono">{emReais(total)}</dd></div>
      </dl>
      {cbs.memoria && (
        <blockquote className="mt-4 border-l-2 border-marca-600 pl-3 text-xs italic leading-relaxed text-suave">
          Memória de cálculo oficial: “{cbs.memoria}”
        </blockquote>
      )}
    </div>
  );
}
