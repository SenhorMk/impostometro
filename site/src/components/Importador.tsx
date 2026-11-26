"use client";

/**
 * Importação de XML de notas (T16) e cálculo do lote (T17).
 *
 * Tudo que envolve o ARQUIVO acontece aqui no navegador: abrir o .zip, ler o XML
 * e jogar fora o que é do cliente final (nome, CPF, endereço). Para o servidor só
 * vão os dados fiscais de cada item (NCM, valor, quantidade, classificação, data e
 * município), em pedidos de até 50 notas.
 */
import { unzipSync } from "fflate";
import { useMemo, useState } from "react";
import { dataBR, emPercentual, emReais } from "@/lib/formato";
import type { ItemCalculado, NotaCalculada, NotaParaCalcular, RespostaLote } from "@/lib/lote";
import { lerNota, type ItemNota, type NotaLida } from "@/lib/nfe";

const LIMITE_NOTAS = 500;
const NOTAS_POR_PEDIDO = 50;
const LIMITE_BYTES = 200 * 1024 * 1024; // 200 MB somando todos os arquivos

type Rejeitada = { arquivo: string; motivo: string };
type InfoCodigo = { descricao: string; especiais: { cClassTrib: string; descricao: string }[] } | null;
type Resultado = { notas: NotaCalculada[]; versaoMotor: string; versaoTabelaMotor: string; versaoTabelaAliquotas: string };

const ncmValido = (ncm: string) => /^\d{8}$/.test(ncm);
const precisaClassificar = (i: ItemNota) => !i.cClassTrib && ncmValido(i.ncm);
const reais = (centavos: number) => emReais(centavos / 100);

/** Abre os arquivos escolhidos (XML soltos ou .zip) e devolve os textos dos XMLs. */
async function abrirArquivos(arquivos: File[]): Promise<{ xmls: { nome: string; texto: string }[]; rejeitadas: Rejeitada[] }> {
  const xmls: { nome: string; texto: string }[] = [];
  const rejeitadas: Rejeitada[] = [];
  const decodificar = new TextDecoder("utf-8");
  for (const f of arquivos) {
    const nome = f.name.toLowerCase();
    if (nome.endsWith(".zip")) {
      try {
        const conteudo = unzipSync(new Uint8Array(await f.arrayBuffer()), { filter: (a) => a.name.toLowerCase().endsWith(".xml") });
        const nomes = Object.keys(conteudo);
        if (nomes.length === 0) rejeitadas.push({ arquivo: f.name, motivo: "O .zip não tem nenhum arquivo .xml." });
        for (const n of nomes) xmls.push({ nome: `${f.name} › ${n.split("/").pop()}`, texto: decodificar.decode(conteudo[n]) });
      } catch {
        rejeitadas.push({ arquivo: f.name, motivo: "Não conseguimos abrir este .zip." });
      }
    } else if (nome.endsWith(".xml")) {
      xmls.push({ nome: f.name, texto: await f.text() });
    } else {
      rejeitadas.push({ arquivo: f.name, motivo: "Envie arquivos .xml ou .zip." });
    }
  }
  return { xmls, rejeitadas };
}

export function Importador() {
  const [notas, setNotas] = useState<NotaLida[]>([]);
  const [rejeitadas, setRejeitadas] = useState<Rejeitada[]>([]);
  const [lendo, setLendo] = useState(false);
  const [infoCodigos, setInfoCodigos] = useState<Record<string, InfoCodigo>>({});
  const [escolhas, setEscolhas] = useState<Record<string, string>>({});
  const [confirmado, setConfirmado] = useState(false);
  const [progresso, setProgresso] = useState<{ feitas: number; total: number } | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  /** NCMs dos itens que vieram sem cClassTrib, com quantos itens cada um tem. */
  const aClassificar = useMemo(() => {
    const m = new Map<string, { ncm: string; itens: number; exemplo: string }>();
    for (const n of notas)
      for (const i of n.itens)
        if (precisaClassificar(i)) {
          const g = m.get(i.ncm) ?? { ncm: i.ncm, itens: 0, exemplo: i.descricao };
          g.itens++;
          m.set(i.ncm, g);
        }
    return [...m.values()].sort((a, b) => b.itens - a.itens);
  }, [notas]);

  const totalItens = notas.reduce((s, n) => s + n.itens.length, 0);

  async function escolherArquivos(lista: FileList | null) {
    const arquivos = Array.from(lista ?? []);
    if (arquivos.length === 0) return;
    setErro(null);
    setResultado(null);
    setConfirmado(false);
    if (arquivos.reduce((s, f) => s + f.size, 0) > LIMITE_BYTES) {
      setErro("Os arquivos passam de 200 MB. Envie as notas em partes menores.");
      return;
    }
    setLendo(true);
    try {
      const { xmls, rejeitadas: rej } = await abrirArquivos(arquivos);
      const lidas: NotaLida[] = [];
      const vistas = new Set<string>();
      for (const x of xmls) {
        const r = lerNota(x.nome, x.texto);
        if (!r.ok) rej.push({ arquivo: r.arquivo, motivo: r.motivo });
        else if (r.nota.chave && vistas.has(r.nota.chave)) rej.push({ arquivo: x.nome, motivo: "Nota repetida (mesma chave de acesso de outro arquivo)." });
        else if (lidas.length >= LIMITE_NOTAS) rej.push({ arquivo: x.nome, motivo: `Passou do limite de ${LIMITE_NOTAS} notas por lote.` });
        else {
          vistas.add(r.nota.chave);
          lidas.push(r.nota);
        }
      }
      setNotas(lidas);
      setRejeitadas(rej);

      const ncms = [...new Set(lidas.flatMap((n) => n.itens.filter(precisaClassificar).map((i) => i.ncm)))];
      setEscolhas(Object.fromEntries(ncms.map((c) => [c, "000001"])));
      if (ncms.length > 0) {
        const r = await fetch(`/api/codigos?codigos=${ncms.slice(0, 500).join(",")}`);
        if (r.ok) setInfoCodigos(await r.json());
      }
    } catch (e) {
      console.error(e);
      setErro("Não conseguimos ler os arquivos. Tente de novo.");
    } finally {
      setLendo(false);
    }
  }

  async function calcular() {
    setErro(null);
    setResultado(null);
    // Cada nota vira um pedido só com dados fiscais. Itens sem NCM válido não são enviados.
    const pedidos: NotaParaCalcular[] = notas.map((n, idx) => ({
      chave: (n.chave || `arquivo-${idx}`).slice(0, 60),
      data: n.data,
      municipio: n.municipio,
      uf: n.uf,
      itens: n.itens
        .filter((i) => ncmValido(i.ncm))
        .map((i) => ({
          numero: i.numero,
          ncm: i.ncm,
          baseCentavos: Math.max(0, i.baseCentavos),
          quantidade: i.quantidade,
          unidade: i.unidade,
          cClassTrib: i.cClassTrib ?? escolhas[i.ncm] ?? "000001",
        })),
    }));

    const calculadas: (NotaCalculada | null)[] = pedidos.map(() => null);
    const comItens = pedidos.map((p, idx) => ({ p, idx })).filter((x) => x.p.itens.length > 0);
    let versoes = { versaoMotor: "", versaoTabelaMotor: "", versaoTabelaAliquotas: "" };
    setProgresso({ feitas: 0, total: notas.length });
    try {
      for (let k = 0; k < comItens.length; k += NOTAS_POR_PEDIDO) {
        const parte = comItens.slice(k, k + NOTAS_POR_PEDIDO);
        const r = await fetch("/api/calcular-lote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notas: parte.map((x) => x.p) }),
        });
        const corpo = await r.json();
        if (!r.ok) throw new Error(corpo?.erro ?? "Falha no cálculo.");
        const resp = corpo as RespostaLote;
        versoes = { versaoMotor: resp.versaoMotor, versaoTabelaMotor: resp.versaoTabelaMotor, versaoTabelaAliquotas: resp.versaoTabelaAliquotas };
        resp.notas.forEach((nc, j) => (calculadas[parte[j].idx] = nc));
        setProgresso({ feitas: Math.min(k + NOTAS_POR_PEDIDO, comItens.length), total: comItens.length });
      }
    } catch (e) {
      setErro(`O cálculo parou no meio: ${(e as Error).message} Nada foi somado.`);
      setProgresso(null);
      return;
    }

    // Junta o que voltou com os itens que nem foram enviados (sem NCM válido).
    const final = notas.map((n, idx): NotaCalculada => {
      const nc = calculadas[idx];
      const porNumero = new Map((nc?.itens ?? []).map((i) => [i.numero, i]));
      const itens = n.itens.map(
        (i): ItemCalculado =>
          porNumero.get(i.numero) ?? {
            numero: i.numero,
            estado: "SEM_NCM",
            ok: false,
            mensagem: i.ncm ? `O NCM "${i.ncm}" da nota não tem 8 números.` : "A nota não informa o NCM deste item.",
          },
      );
      const totais = nc?.totais ?? { baseCentavos: 0, cbsCentavos: 0, ibsCentavos: 0, itensCalculados: 0, itensComErro: 0 };
      return {
        chave: n.chave,
        dataCalculo: nc?.dataCalculo ?? n.data,
        aliquotas: nc?.aliquotas,
        itens,
        totais: { ...totais, itensComErro: itens.filter((i) => !i.ok).length },
      };
    });
    setResultado({ notas: final, ...versoes });
    setProgresso(null);
  }

  function recomecar() {
    setNotas([]);
    setRejeitadas([]);
    setResultado(null);
    setConfirmado(false);
    setErro(null);
  }

  return (
    <div className="space-y-6">
      {notas.length === 0 && !lendo && (
        <label
          htmlFor="arquivos"
          className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-borda bg-white px-6 py-12 text-center hover:border-marca-500"
        >
          <span className="text-lg font-semibold text-tinta">Escolha os XMLs das suas notas</span>
          <span className="mt-1 text-sm text-suave">Vários arquivos .xml ou um .zip, até {LIMITE_NOTAS} notas (NF-e e NFC-e de venda)</span>
          <span className="botao-primario mt-5 px-5 py-2.5 text-sm">Escolher arquivos</span>
          <input
            id="arquivos"
            type="file"
            accept=".xml,.zip,text/xml,application/xml,application/zip"
            multiple
            className="sr-only"
            onChange={(e) => escolherArquivos(e.target.files)}
          />
        </label>
      )}

      {lendo && <p className="rounded-2xl border border-borda bg-white p-6 text-center text-suave">Lendo as notas no seu computador…</p>}
      {erro && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{erro}</p>}

      {(notas.length > 0 || rejeitadas.length > 0) && !lendo && (
        <section className="rounded-2xl border border-borda bg-white p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">
              {notas.length} {notas.length === 1 ? "nota lida" : "notas lidas"} · {totalItens} {totalItens === 1 ? "item" : "itens"}
            </h2>
            <button type="button" onClick={recomecar} className="text-sm text-suave underline hover:text-tinta">
              Escolher outros arquivos
            </button>
          </div>
          {rejeitadas.length > 0 && (
            <details className="mt-3 text-sm" open={notas.length === 0}>
              <summary className="cursor-pointer text-amber-800">
                {rejeitadas.length} {rejeitadas.length === 1 ? "arquivo ficou de fora" : "arquivos ficaram de fora"}
              </summary>
              <ul className="mt-2 space-y-1">
                {rejeitadas.map((r, k) => (
                  <li key={k} className="break-words text-suave">
                    <strong className="text-tinta">{r.arquivo}</strong>: {r.motivo}
                  </li>
                ))}
              </ul>
            </details>
          )}
          {notas.some((n) => n.avisos.length > 0) && (
            <details className="mt-2 text-sm">
              <summary className="cursor-pointer text-amber-800">Avisos da leitura</summary>
              <ul className="mt-2 space-y-1 text-suave">
                {notas.flatMap((n) => n.avisos.map((a, k) => <li key={`${n.arquivo}-${k}`}>{n.modelo} {n.numero}: {a}</li>))}
              </ul>
            </details>
          )}
          {notas.some((n) => n.data < "2027-01-01") && (
            <p className="mt-3 text-sm text-suave">
              Notas de antes de 2027 são calculadas como se fossem de 01/01/2027, porque a CBS e o IBS só começam em 2027.
            </p>
          )}
        </section>
      )}

      {notas.length > 0 && !resultado && !lendo && (
        <section className="rounded-2xl border border-borda bg-white p-5">
          {aClassificar.length > 0 ? (
            <>
              <h2 className="text-lg font-semibold">Confira a classificação dos produtos</h2>
              <p className="mt-1 text-sm text-suave">
                Estas notas ainda não trazem a classificação da reforma (cClassTrib). Sugerimos <strong>tributação integral (000001)</strong>,
                que é o caso da maioria dos produtos. Se algum tem redução ou isenção prevista em lei, escolha abaixo.
              </p>
              <ul className="mt-4 divide-y divide-borda">
                {aClassificar.map((g) => {
                  const info = infoCodigos[g.ncm];
                  return (
                    <li key={g.ncm} className="grid gap-2 py-3 sm:grid-cols-[1fr_minmax(0,18rem)] sm:items-center">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          NCM {g.ncm} · {g.itens} {g.itens === 1 ? "item" : "itens"}
                        </p>
                        <p className="truncate text-xs text-suave">Ex.: {g.exemplo || "sem descrição"}</p>
                        {info && <p className="line-clamp-2 text-xs text-suave">Tabela oficial: {info.descricao}</p>}
                        {info === null && <p className="text-xs text-amber-800">Este NCM não está na tabela oficial de 2027: a calculadora deve recusar.</p>}
                      </div>
                      <select
                        aria-label={`Classificação do NCM ${g.ncm}`}
                        className="campo text-sm"
                        value={escolhas[g.ncm] ?? "000001"}
                        onChange={(e) => {
                          setEscolhas({ ...escolhas, [g.ncm]: e.target.value });
                          setConfirmado(false);
                        }}
                      >
                        <option value="000001">000001 · Tributação integral</option>
                        {info?.especiais.map((c) => (
                          <option key={c.cClassTrib} value={c.cClassTrib}>
                            {c.cClassTrib} · {c.descricao.slice(0, 80)}
                          </option>
                        ))}
                      </select>
                    </li>
                  );
                })}
              </ul>
              <label className="mt-4 flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1" checked={confirmado} onChange={(e) => setConfirmado(e.target.checked)} />
                <span>Conferi e confirmo as classificações acima. Sei que a escolha errada muda o imposto.</span>
              </label>
            </>
          ) : (
            <p className="text-sm text-suave">Todos os itens já trazem a classificação da reforma (cClassTrib) na nota. Vamos usar a da nota.</p>
          )}
          <button
            type="button"
            className="botao-primario mt-4 w-full px-5 py-3 sm:w-auto"
            disabled={(aClassificar.length > 0 && !confirmado) || progresso !== null}
            onClick={calcular}
          >
            {progresso ? `Calculando… ${progresso.feitas} de ${progresso.total} notas` : `Calcular ${notas.length} ${notas.length === 1 ? "nota" : "notas"}`}
          </button>
        </section>
      )}

      {resultado && <ResultadoLote resultado={resultado} notas={notas} />}
    </div>
  );
}

function ResultadoLote({ resultado, notas }: { resultado: Resultado; notas: NotaLida[] }) {
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

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-borda bg-white shadow-sm">
        <div className="bg-marca-900 p-5 text-white sm:p-6">
          <p className="text-sm text-marca-100">
            {resultado.notas.length} notas · {t.ok} itens calculados · base de {reais(t.base)}
          </p>
          <p className="mt-2 text-4xl font-bold tracking-tight">{reais(total)}</p>
          <p className="mt-1 text-sm text-marca-100">
            de CBS + IBS nessas vendas{t.base > 0 && <>, ou <strong className="text-white">{emPercentual((total / t.base) * 100)}</strong> da base</>}
          </p>
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
            {t.erros} {t.erros === 1 ? "item não foi calculado e ficou" : "itens não foram calculados e ficaram"} fora da soma. Veja o motivo em cada nota.
          </p>
        )}
        <div className="space-y-1 p-5 text-xs text-suave">
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

      <ul className="space-y-3">
        {resultado.notas.map((n, k) => (
          <NotaResultado key={k} calculada={n} lida={notas[k]} />
        ))}
      </ul>
    </section>
  );
}

function NotaResultado({ calculada, lida }: { calculada: NotaCalculada; lida: NotaLida }) {
  const t = calculada.totais;
  return (
    <li className="rounded-2xl border border-borda bg-white">
      <details>
        <summary className="flex cursor-pointer flex-wrap items-baseline justify-between gap-x-4 gap-y-1 p-4">
          <span className="font-medium">
            {lida.modelo} {lida.numero}
            {lida.serie && `/${lida.serie}`} · {dataBR(lida.data)} · {lida.uf}
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
            <strong className="text-tinta">Classificação:</strong> {item.cClassTrib ? `${item.cClassTrib} (da nota)` : "a que você confirmou"}
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
