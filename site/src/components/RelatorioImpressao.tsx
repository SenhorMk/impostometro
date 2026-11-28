"use client";

/**
 * Relatório do período para imprimir ou salvar em PDF (T27).
 *
 * Montado no navegador a partir do mesmo resultado da tela (src/lib/relatorio.ts): nada é
 * recalculado, nada vai para o servidor e não existe link público. Ao clicar, o relatório
 * é desenhado fora da página (portal no <body>), o navegador abre a janela de impressão
 * ("Salvar como PDF") e o relatório some depois. O CSS de impressão está em globals.css.
 */
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { SITE } from "@/lib/config";
import { dataBR, emPercentual, emReais } from "@/lib/formato";
import type { Relatorio } from "@/lib/relatorio";

const reais = (c: number | undefined) => (c === undefined ? "" : emReais(c / 100));
const pct = (t: string | undefined) => (t ? `${t.replace(".", ",")}%` : "");

export function RelatorioImpressao({ relatorio, aoTerminar }: { relatorio: Relatorio; aoTerminar: () => void }) {
  useEffect(() => {
    const fim = () => aoTerminar();
    window.addEventListener("afterprint", fim);
    // Espera o relatório ser desenhado antes de abrir a impressão.
    const t = window.setTimeout(() => window.print(), 50);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("afterprint", fim);
    };
  }, [aoTerminar]);

  const r = relatorio;
  const c = r.cobertura;
  const geradoEm = new Date(r.geradoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  return createPortal(
    <div id="relatorio-impressao" className="relatorio">
      <header>
        <p className="relatorio-marca">{SITE.nome} · relatório revisável do período</p>
        <h1>CBS e IBS das vendas: {r.periodo}</h1>
        <p>
          Empresa: <strong>{r.empresa}</strong> · {r.cenario} · gerado em {geradoEm}
        </p>
        {r.rascunho && <p className="relatorio-rascunho">RASCUNHO, NÃO REVISADO</p>}
      </header>

      <section>
        <h2>Resumo</h2>
        <table className="relatorio-resumo">
          <tbody>
            <tr>
              <th>Base dos itens calculados</th>
              <td>{reais(r.totais.baseCentavos)}</td>
            </tr>
            <tr>
              <th>CBS (federal)</th>
              <td>{reais(r.totais.cbsCentavos)}</td>
            </tr>
            <tr>
              <th>IBS (estado + município)</th>
              <td>{reais(r.totais.ibsCentavos)}</td>
            </tr>
            <tr>
              <th>CBS + IBS</th>
              <td>
                <strong>{reais(r.totais.totalCentavos)}</strong>
              </td>
            </tr>
            <tr>
              <th>Itens</th>
              <td>
                {r.totais.itensCalculados} calculados · {r.totais.itensNaoCalculados} não calculados (fora da soma)
              </td>
            </tr>
          </tbody>
        </table>
        <ul className="relatorio-avisos">
          {r.avisos.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Documentos</h2>
        <p>
          {r.notasIncluidas} {r.notasIncluidas === 1 ? "nota incluída" : "notas incluídas"} na soma
          {c?.datas && ` (emitidas de ${dataBR(c.datas.primeira)} a ${dataBR(c.datas.ultima)})`}.
        </p>
        {c?.fora && c.fora.length > 0 && (
          <ul>
            {c.fora.map((f) => (
              <li key={f.motivo}>
                Fora da soma: {f.nome}
                {f.numeros.length > 0 && ` (números ${f.numeros.join(", ")}${f.quantidade > f.numeros.length ? "…" : ""})`}.
              </li>
            ))}
          </ul>
        )}
        {c?.lacunas && c.lacunas.length > 0 && (
          <ul>
            {c.lacunas.map((l) => (
              <li key={`${l.modelo}-${l.serie}`}>
                Numeração com falta ({l.modelo} série {l.serie}): {l.faltando} {l.faltando === 1 ? "número" : "números"}, por exemplo{" "}
                {l.exemplos.join(", ")}.
              </li>
            ))}
          </ul>
        )}
        {c?.pendencias && c.pendencias.length > 0 && (
          <ul>
            {c.pendencias.map((p) => (
              <li key={p.explicacao}>
                Pendência ({p.quantidade}): {p.explicacao}
              </li>
            ))}
          </ul>
        )}
        {r.naoCalculados.length > 0 && (
          <ul>
            {r.naoCalculados.map((m) => (
              <li key={m.motivo}>
                Não calculado ({m.quantidade}): {m.motivo}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Premissas e versões</h2>
        {r.premissas && (
          <p>
            Classificações: {r.premissas.itensDaNota} da nota, {r.premissas.itensConfirmados} confirmadas pelo usuário, {r.premissas.itensSugeridos} só
            sugeridas. Base estimada em {r.premissas.itensBaseEstimada} {r.premissas.itensBaseEstimada === 1 ? "item" : "itens"}.
          </p>
        )}
        {r.aliquotas && (
          <p>
            Alíquotas nominais: CBS {emPercentual(r.aliquotas.cbs)}, IBS estadual {emPercentual(r.aliquotas.ibsEstadual)}, IBS municipal{" "}
            {emPercentual(r.aliquotas.ibsMunicipal)}
            {r.aliquotas.provisoria && " (provisórias)"}.
          </p>
        )}
        <p>
          Calculadora oficial da Receita Federal (licença MIT) versão {r.versoes.motor}, tabelas {r.versoes.tabelaMotor}, tabela de alíquotas{" "}
          {r.versoes.tabelaAliquotas}. A memória de cálculo oficial de cada item está na planilha.
        </p>
      </section>

      <section>
        <h2>Detalhe por nota e item</h2>
        <table className="relatorio-detalhe">
          <thead>
            <tr>
              <th>Nota</th>
              <th>Item</th>
              <th>NCM · CFOP</th>
              <th>cClassTrib</th>
              <th className="num">Base</th>
              <th className="num">CBS</th>
              <th className="num">IBS</th>
            </tr>
          </thead>
          <tbody>
            {r.linhas.map((l) => (
              <tr key={`${l.nota.chave}-${l.item}`} className={l.calculado ? undefined : "relatorio-erro"}>
                <td>
                  {l.nota.modelo} {l.nota.numero}
                  {l.nota.serie && `/${l.nota.serie}`}
                  <br />
                  {dataBR(l.nota.data)} · {l.nota.uf}
                </td>
                <td>
                  {l.item}. {l.descricao || "sem descrição"}
                  {!l.calculado && (
                    <>
                      <br />
                      <em>Não calculado: {l.motivo}</em>
                    </>
                  )}
                </td>
                <td>
                  {l.ncm || "—"} · {l.cfop || "—"}
                </td>
                <td>
                  {l.cClassTrib || "—"}
                  <br />
                  <small>{l.origemClassificacao}</small>
                </td>
                <td className="num">
                  {reais(l.baseCentavos)}
                  {l.calculado && l.baseEstimada && (
                    <>
                      <br />
                      <small>estimada</small>
                    </>
                  )}
                </td>
                <td className="num">
                  {reais(l.cbsCentavos)}
                  {l.aliquotaEfetivaCbs && (
                    <>
                      <br />
                      <small>{pct(l.aliquotaEfetivaCbs)}</small>
                    </>
                  )}
                </td>
                <td className="num">{reais(l.ibsCentavos)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan={4}>Total dos itens calculados</th>
              <th className="num">{reais(r.totais.baseCentavos)}</th>
              <th className="num">{reais(r.totais.cbsCentavos)}</th>
              <th className="num">{reais(r.totais.ibsCentavos)}</th>
            </tr>
          </tfoot>
        </table>
      </section>

      <footer>
        {SITE.nome} é um site independente, não é do governo nem tem ligação com a Receita Federal. Simulação: não é o imposto definitivo a
        recolher nem substitui a apuração do seu contador.
      </footer>
    </div>,
    document.body,
  );
}
