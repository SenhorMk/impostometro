"use client";

import Link from "next/link";
import { useState } from "react";
import { dataBR, emPercentual, emReais } from "@/lib/formato";
import type { ResultadoCalculo } from "@/lib/tipos";

type Props = { resultado: ResultadoCalculo; descricao: string; cidade: string };

export function Resultado({ resultado, descricao, cidade }: Props) {
  const [aberta, setAberta] = useState(false);

  if (!resultado.ok) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p className="font-semibold text-amber-900">Não foi possível calcular</p>
        <p className="mt-1 text-sm text-amber-900">{resultado.mensagem}</p>
        <p className="mt-3 text-xs text-amber-800">
          Nunca mostramos um número inventado: quando a calculadora oficial não calcula, dizemos o porquê.
        </p>
      </div>
    );
  }

  const r = resultado;
  const provisorio = r.periodoAliquotas.status === "provisorio";

  return (
    <div className="overflow-hidden rounded-md border border-tinta bg-white">
      <div className="border-b border-tinta bg-white p-5 sm:p-6">
        <p className="text-sm text-suave">
          {descricao} · {emReais(r.base)} · {cidade}
        </p>
        {r.semAliquota ? (
          <>
            <p className="mt-2 font-serif text-3xl font-semibold tracking-tight">Sem CBS e IBS</p>
            <p className="mt-1 text-sm text-suave">
              Esta operação não tem alíquota ({r.fundamentacao ?? "imunidade ou não incidência"}).
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 font-serif text-4xl font-semibold tracking-tight sm:text-5xl"><span className="marcatexto">{emReais(r.total)}</span></p>
            <p className="mt-1 text-sm text-suave">
              de CBS + IBS nessa venda, ou <strong className="text-tinta">{emPercentual(r.percentualSobreVenda)}</strong> do
              valor
            </p>
          </>
        )}
      </div>

      {!r.semAliquota && (
        <dl className="grid grid-cols-3 divide-x divide-borda border-b border-borda text-center">
          <Linha titulo="CBS (federal)" valor={r.cbs.valor} pct={r.cbs.aliquotaEfetiva} />
          <Linha titulo="IBS estadual" valor={r.ibsEstadual.valor} pct={r.ibsEstadual.aliquotaEfetiva} />
          <Linha titulo="IBS municipal" valor={r.ibsMunicipal.valor} pct={r.ibsMunicipal.aliquotaEfetiva} />
        </dl>
      )}

      <div className="p-5 sm:p-6">
        {r.cbs.reducao > 0 && (
          <p className="mb-3 inline-flex items-center gap-1.5 bg-marcatexto/60 px-2 py-0.5 text-sm font-medium text-tinta">
            Seu setor tem redução de {emPercentual(r.cbs.reducao).replace(",00", "")} na alíquota
          </p>
        )}

        <button
          type="button"
          onClick={() => setAberta((a) => !a)}
          aria-expanded={aberta}
          className="flex w-full items-center justify-between rounded-xl border border-borda px-4 py-3 text-left font-medium hover:bg-fundo"
        >
          <span>Como chegamos nesse número</span>
          <span aria-hidden className={`transition-transform ${aberta ? "rotate-180" : ""}`}>
            ▾
          </span>
        </button>

        {aberta && <ContaAberta r={r} />}

        <p className="mt-4 text-xs leading-relaxed text-suave">
          {provisorio && (
            <>
              <strong>Alíquota provisória:</strong> a CBS de 2027 ainda pode mudar até 15/12/2026.{" "}
            </>
          )}
          Simulação feita com as regras e tabelas da calculadora oficial da Receita Federal (versão {r.versaoMotor}). Não substitui o seu
          contador. Este site não é do governo.
        </p>

        <div className="mt-5 rounded-xl bg-fundo p-4">
          <p className="font-medium">Quer o total do mês, nota por nota?</p>
          <p className="mt-1 text-sm text-suave">
            Assinantes enviam os XMLs das notas e veem a CBS e o IBS de todas as vendas de uma vez.
          </p>
          <Link href="/#planos" className="mt-3 inline-block text-sm font-semibold text-marca-700 underline">
            Ver como funciona a assinatura
          </Link>
        </div>
      </div>
    </div>
  );
}

function Linha({ titulo, valor, pct }: { titulo: string; valor: number; pct: number }) {
  return (
    <div className="px-2 py-4">
      <dt className="text-xs text-suave">{titulo}</dt>
      <dd className="mt-1 font-mono font-semibold tabular-nums">{emReais(valor)}</dd>
      <dd className="text-xs tabular-nums text-suave">{emPercentual(pct)}</dd>
    </div>
  );
}

/** T12: a conta aberta, passo a passo, em português simples. */
function ContaAberta({ r }: { r: Extract<ResultadoCalculo, { ok: true }> }) {
  if (r.semAliquota) {
    return (
      <div className="mt-4 space-y-3 text-sm">
        <p>{r.cbs.memoria}</p>
        <Rodape r={r} />
      </div>
    );
  }
  const fator = 100 - r.cbs.reducao;
  return (
    <div className="mt-4 space-y-5 text-sm">
      <ol className="space-y-3">
        <Passo n={1} titulo="Valor da venda (base de cálculo)">
          {emReais(r.base)}
        </Passo>
        <Passo n={2} titulo="Alíquota da CBS em 2027">
          {emPercentual(r.cbs.aliquota)}{" "}
          <span className="text-suave">({r.periodoAliquotas.status === "provisorio" ? "provisória" : "oficial"})</span>
          <p className="mt-1 text-suave">{r.periodoAliquotas.explicacaoCbs}</p>
        </Passo>
        <Passo n={3} titulo="Redução do seu setor">
          {r.cbs.reducao > 0 ? (
            <>
              {emPercentual(r.cbs.reducao).replace(",00", "")}, então você paga {fator}% da alíquota
              {r.fundamentacao && (
                <span className="text-suave"> ({r.fundamentacao} da Lei Complementar 214/2025)</span>
              )}
            </>
          ) : (
            <>Nenhuma: tributação integral{r.fundamentacao && <span className="text-suave"> ({r.fundamentacao})</span>}</>
          )}
        </Passo>
        <Passo n={4} titulo="CBS">
          <span className="font-mono text-[13px]">
            {emReais(r.base)} × {emPercentual(r.cbs.aliquotaEfetiva)} = <strong>{emReais(r.cbs.valor)}</strong>
          </span>
        </Passo>
        <Passo n={5} titulo="IBS (fase de teste em 2027)">
          <span className="font-mono text-[13px]">
            estadual {emReais(r.ibsEstadual.valor)} + municipal {emReais(r.ibsMunicipal.valor)} ={" "}
            <strong>{emReais(r.ibsTotal)}</strong>
          </span>
          <p className="mt-1 text-suave">{r.periodoAliquotas.explicacaoIbs}</p>
        </Passo>
        <Passo n={6} titulo="Total">
          <span className="font-mono text-[13px]">
            {emReais(r.cbs.valor)} + {emReais(r.ibsTotal)} = <strong>{emReais(r.total)}</strong>
          </span>
        </Passo>
      </ol>

      {r.cbs.memoria && (
        <blockquote className="border-l-4 border-marca-200 pl-3 text-suave">
          <p className="text-xs font-medium uppercase tracking-wide">Memória de cálculo oficial da Receita</p>
          <p className="mt-1 italic">“{r.cbs.memoria}”</p>
        </blockquote>
      )}

      <Rodape r={r} />
    </div>
  );
}

function Passo({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-marca-100 text-xs font-bold text-marca-800">
        {n}
      </span>
      <div>
        <p className="font-medium">{titulo}</p>
        <div className="mt-0.5">{children}</div>
      </div>
    </li>
  );
}

function Rodape({ r }: { r: Extract<ResultadoCalculo, { ok: true }> }) {
  return (
    <div className="rounded-xl bg-fundo p-3 text-xs text-suave">
      <p>
        Data da venda considerada: {dataBR(r.dataFatoGerador)} · Calculadora oficial {r.versaoMotor} · Tabelas oficiais{" "}
        {r.versaoTabelaMotor} · Nossa tabela de alíquotas de {dataBR(r.versaoTabelaAliquotas)}
      </p>
      <p className="mt-2">Fontes das alíquotas:</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-4">
        {r.periodoAliquotas.fontes.map((f) => (
          <li key={f.url}>
            <a href={f.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-tinta">
              {f.titulo}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
