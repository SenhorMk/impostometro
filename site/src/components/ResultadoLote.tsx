"use client";

/**
 * Resultado de um lote de notas (T17), com a conta aberta de cada item.
 * Usado no importador e ao reabrir um lote do histórico (T18).
 */
import { useState } from "react";
import { dataBR, emPercentual, emReais } from "@/lib/formato";
import type { ItemCalculado, NotaCalculada } from "@/lib/lote";
import type { ItemNota, NotaLida } from "@/lib/nfe";
import { nomeDaPlanilha, planilhaDoLote } from "@/lib/planilha";
import { motivosNaoCalculados } from "@/lib/preparo";
import { ehRascunho, type Premissas } from "@/lib/premissas";

export type LoteCalculado = {
  notas: NotaCalculada[];
  versaoMotor: string;
  versaoTabelaMotor: string;
  versaoTabelaAliquotas: string;
  /** T35: revisão e origem das classificações. Ausente em lotes antigos do histórico. */
  premissas?: Premissas;
};
export type NotaParaMostrar = Pick<NotaLida, "chave" | "modelo" | "numero" | "serie" | "data" | "uf" | "itens">;

const reais = (centavos: number) => emReais(centavos / 100);

/** cobertura (T34): o que esta soma representa. Ausente ao reabrir do histórico. */
export type Cobertura = { resumo: string; parcial: boolean; motivos: string[] };

export function ResultadoLote({ resultado, notas, cobertura }: { resultado: LoteCalculado; notas: NotaParaMostrar[]; cobertura?: Cobertura }) {
  const t = resultado.notas.reduce(
    (s, n) => ({
      base: s.base + n.totais.baseCentavos,
      cbs: s.cbs + n.totais.cbsCentavos,
      ibs: s.ibs + n.totais.ibsCentavos,
      ok: s.ok + n.totais.itensCalculados,
      erros: s.erros + n.totais.itensComErro,
    }),
    { base: 0, cbs: 0, ibs: 0, ok: 0, erros: 0 },
  );
  const total = t.cbs + t.ibs;
  const aliq = resultado.notas.find((n) => n.aliquotas)?.aliquotas;
  const naoCalculados = motivosNaoCalculados(resultado.notas.flatMap((n) => n.itens));
  const p = resultado.premissas;
  const rascunho = ehRascunho(p);

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-borda bg-white shadow-sm">
        {rascunho && (
          <p className="border-b border-amber-300 bg-amber-100 px-5 py-3 text-sm text-amber-950" role="note">
            <strong>Rascunho, não revisado:</strong> {p!.itensSugeridos} {p!.itensSugeridos === 1 ? "item usou" : "itens usaram"} uma classificação
            sugerida, sem você confirmar. Confira as classificações antes de usar este total.
          </p>
        )}
        <div className="bg-marca-900 p-5 text-white sm:p-6">
          <p className="text-sm text-marca-100">
            {p && <>Revisão {p.revisao}{rascunho ? " (rascunho)" : ""} · </>}
            {resultado.notas.length} notas · {t.ok} itens calculados · base de {reais(t.base)}
          </p>
          <p className="mt-2 text-4xl font-bold tracking-tight">{reais(total)}</p>
          <p className="mt-1 text-sm text-marca-100">
            de CBS + IBS nessas vendas{t.base > 0 && <>, ou <strong className="text-white">{emPercentual((total / t.base) * 100)}</strong> da base</>}
          </p>
          {cobertura && (
            <p className="mt-2 text-xs text-marca-100">
              Soma das {resultado.notas.length} notas incluídas ({cobertura.resumo}).{" "}
              {cobertura.parcial ? <strong className="text-white">Cobertura parcial: {cobertura.motivos.join("; ")}.</strong> : "Não é a apuração oficial do mês."}
            </p>
          )}
        </div>
        <dl className="grid grid-cols-2 divide-x divide-borda border-b border-borda text-center">
          <div className="p-3">
            <dt className="text-xs text-suave">CBS (federal)</dt>
            <dd className="font-semibold">{reais(t.cbs)}</dd>
          </div>
          <div className="p-3">
            <dt className="text-xs text-suave">IBS (estado + município)</dt>
            <dd className="font-semibold">{reais(t.ibs)}</dd>
          </div>
        </dl>
        {t.erros > 0 && (
          <p className="border-b border-borda bg-red-50 px-5 py-3 text-sm text-red-800">
            {t.erros} {t.erros === 1 ? "item não foi calculado e ficou" : "itens não foram calculados e ficaram"} fora da soma:
            <span className="mt-1 block text-xs">
              {naoCalculados.map((m) => `${m.quantidade} × ${m.motivo}`).join(" · ")}
            </span>
          </p>
        )}
        <div className="space-y-1 p-5 text-xs text-suave">
          {p && (
            <p>
              Classificações: {p.itensDaNota} {p.itensDaNota === 1 ? "item" : "itens"} com a da nota, {p.itensConfirmados} confirmadas por você
              {p.confirmadoEm && ` em ${dataBR(p.confirmadoEm.slice(0, 10))}`}, {p.itensSugeridos} só sugeridas. Base estimada (sem o valor da CBS/IBS na nota) em{" "}
              {p.itensBaseEstimada} {p.itensBaseEstimada === 1 ? "item" : "itens"}.
            </p>
          )}
          {aliq && (
            <p>
              Alíquotas usadas: CBS {emPercentual(aliq.cbs)}, IBS estadual {emPercentual(aliq.ibsEstadual)} e municipal {emPercentual(aliq.ibsMunicipal)}
              {aliq.status === "provisorio" && " (provisórias: o Senado pode mudar a CBS de 2027 até 15/12/2026)"}.
            </p>
          )}
          <p>
            Calculadora oficial da Receita Federal (licença MIT) versão {resultado.versaoMotor}, tabelas {resultado.versaoTabelaMotor}, nossa tabela de alíquotas{" "}
            {resultado.versaoTabelaAliquotas}. Simulação: não substitui a apuração oficial nem o seu contador.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="botao-secundario" onClick={() => baixarPlanilha(resultado, notas)}>
          Baixar planilha para o contador
        </button>
        <span className="text-xs text-suave">Arquivo .csv que abre no Excel: uma linha por item, com base, CBS, IBS e o motivo do que não foi calculado.</span>
      </div>

      <ul className="space-y-3">
        {resultado.notas.map((n, k) => (
          <NotaResultado key={k} calculada={n} lida={notas[k]} />
        ))}
      </ul>
    </section>
  );
}

function NotaResultado({ calculada, lida }: { calculada: NotaCalculada; lida: NotaParaMostrar }) {
  const t = calculada.totais;
  return (
    <li className="rounded-2xl border border-borda bg-white">
      <details>
        <summary className="flex cursor-pointer flex-wrap items-baseline justify-between gap-x-4 gap-y-1 p-4">
          <span className="font-medium">
            {lida.modelo} {lida.numero}
            {lida.serie && `/${lida.serie}`} · emitida em {dataBR(lida.data)} · {lida.uf}
            {calculada.dataCalculo && calculada.dataCalculo !== lida.data && (
              <span className="block text-xs font-normal text-suave">Cenário calculado com a data de {dataBR(calculada.dataCalculo)}</span>
            )}
          </span>
          <span className="text-sm">
            {reais(t.cbsCentavos + t.ibsCentavos)} <span className="text-suave">sobre {reais(t.baseCentavos)}</span>
            {t.itensComErro > 0 && <span className="ml-2 text-red-700">· {t.itensComErro} com erro</span>}
          </span>
        </summary>
        <ul className="divide-y divide-borda border-t border-borda">
          {lida.itens.map((i) => {
            const c = calculada.itens.find((x) => x.numero === i.numero);
            return c ? <ItemResultado key={i.numero} item={i} calc={c} /> : null;
          })}
        </ul>
      </details>
    </li>
  );
}

function ItemResultado({ item, calc }: { item: ItemNota; calc: ItemCalculado }) {
  const [aberto, setAberto] = useState(false);
  if (!calc.ok) {
    return (
      <li className="bg-red-50/60 px-4 py-3 text-sm">
        <p className="font-medium">
          {item.numero}. {item.descricao || "Item sem descrição"} <span className="text-xs font-normal text-suave">NCM {item.ncm || "—"}</span>
        </p>
        <p className="mt-0.5 text-red-800">Não calculado: {calc.mensagem}</p>
      </li>
    );
  }
  return (
    <li className="px-4 py-3 text-sm">
      <button type="button" className="flex w-full items-start justify-between gap-3 text-left" onClick={() => setAberto(!aberto)} aria-expanded={aberto}>
        <span className="min-w-0">
          <span className="block font-medium">
            {item.numero}. {item.descricao || "Item sem descrição"}
          </span>
          <span className="text-xs text-suave">
            NCM {item.ncm} · base {reais(calc.baseCentavos ?? 0)}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block">{reais((calc.cbsCentavos ?? 0) + (calc.ibsCentavos ?? 0))}</span>
          <span className="text-xs text-marca-700 underline">{aberto ? "fechar" : "como chegamos nisso"}</span>
        </span>
      </button>
      {aberto && (
        <div className="mt-3 space-y-1.5 rounded-xl bg-fundo p-3 text-xs text-suave">
          <p>
            <strong className="text-tinta">Base:</strong> {reais(calc.baseCentavos ?? 0)}{" "}
            {item.origemBase === "nota"
              ? "(base da CBS/IBS informada na própria nota)"
              : "(estimada: valor do produto − desconto + frete + seguro + outras despesas da nota)"}
          </p>
          <p>
            <strong className="text-tinta">Classificação:</strong> {textoClassificacao(item)}
          </p>
          <p>
            <strong className="text-tinta">CBS:</strong> {reais(calc.cbsCentavos ?? 0)}
            {calc.aliquotaEfetivaCbs && ` · alíquota efetiva ${calc.aliquotaEfetivaCbs.replace(".", ",")}%`}
            {calc.reducaoCbs && ` · redução de ${calc.reducaoCbs.replace(".", ",")}%`}
          </p>
          <p>
            <strong className="text-tinta">IBS:</strong> {reais(calc.ibsCentavos ?? 0)}
          </p>
          {calc.memoria && (
            <p className="break-words font-mono text-[11px] leading-relaxed">
              <strong className="font-sans text-tinta">Memória de cálculo oficial (CBS):</strong> {calc.memoria}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

function textoClassificacao(item: ItemNota): string {
  const codigo = item.classificacaoUsada ?? item.cClassTrib;
  switch (item.origemClassificacao) {
    case "nota":
      return `${codigo} (veio na nota)`;
    case "confirmada":
      return `${codigo} (confirmada por você)`;
    case "sugerida":
      return `${codigo} (sugestão nossa, NÃO confirmada)`;
    default:
      // lotes antigos do histórico, antes do T35
      return item.cClassTrib ? `${item.cClassTrib} (veio na nota)` : "a que você confirmou na época";
  }
}

function baixarPlanilha(resultado: LoteCalculado, notas: NotaParaMostrar[]) {
  const csv = planilhaDoLote(resultado.notas, notas, resultado, resultado.premissas);
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeDaPlanilha(notas);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
