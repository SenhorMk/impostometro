"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { buscarAtividades, SUGESTOES_INICIAIS, type Atividade } from "@/lib/busca";
import type { CodigoOficial } from "@/lib/codigos";
import { lerValor } from "@/lib/formato";
import type { ResultadoCalculo } from "@/lib/tipos";
import type { RespostaBuscaOficial, ResultadoBuscaOficial } from "@/lib/busca-oficial-tipos";
import { contarEvento } from "@/lib/funil";
import { Resultado } from "./Resultado";

const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA",
  "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
];

const CAPITAIS: Record<string, number> = {
  AC: 1200401, AL: 2704302, AM: 1302603, AP: 1600303, BA: 2927408, CE: 2304400, DF: 5300108,
  ES: 3205309, GO: 5208707, MA: 2111300, MG: 3106200, MS: 5002704, MT: 5103403, PA: 1501402,
  PB: 2507507, PE: 2611606, PI: 2211001, PR: 4106902, RJ: 3304557, RN: 2408102, RO: 1100205,
  RR: 1400100, RS: 4314902, SC: 4205407, SE: 2800308, SP: 3550308, TO: 1721000,
};

type Escolha =
  | { modo: "atividade"; atividade: Atividade }
  | { modo: "codigo"; tipo: "ncm" | "nbs"; codigo: string; cClassTrib: string }
  | { modo: "oficial"; oficial: CodigoOficial; cClassTrib: string };

type Opcao =
  | { tipo: "atividade"; atividade: Atividade }
  | { tipo: "oficial"; oficial: CodigoOficial }
  | { tipo: "classificacao"; item: ResultadoBuscaOficial };

function lembrar<T>(chave: string, valor?: T): T | null {
  try {
    if (valor === undefined) return JSON.parse(localStorage.getItem(chave) ?? "null");
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    /* navegação anônima: tudo bem, só não lembramos */
  }
  return null;
}

/** As contas (login) estão configuradas neste site? Sem elas, nada de histórico. */
const CONTAS_LIGADAS = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

function descricaoDaEscolha(escolha: Escolha | null): string {
  if (escolha?.modo === "atividade") return escolha.atividade.nome;
  if (escolha?.modo === "codigo") return `${escolha.tipo.toUpperCase()} ${escolha.codigo}`;
  if (escolha?.modo === "oficial") return `${escolha.oficial.tipo.toUpperCase()} ${escolha.oficial.codigo}`;
  return "";
}

export function Calculadora() {
  const [consulta, setConsulta] = useState("");
  const [aberto, setAberto] = useState(false);
  const [destaque, setDestaque] = useState(0);
  const [escolha, setEscolha] = useState<Escolha | null>(null);
  const [modoCodigo, setModoCodigo] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [cClassTrib, setCClassTrib] = useState("000001");
  const [valor, setValor] = useState("");
  const [uf, setUf] = useState("SP");
  const [municipios, setMunicipios] = useState<[number, string][]>([]);
  const [municipio, setMunicipio] = useState<number>(CAPITAIS.SP);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null);
  const [oficiais, setOficiais] = useState<CodigoOficial[]>([]);
  const [classificacoes, setClassificacoes] = useState<ResultadoBuscaOficial[]>([]);
  const [buscandoOficiais, setBuscandoOficiais] = useState(false);
  const codigoRef = useRef<HTMLInputElement>(null);
  const resultadoRef = useRef<HTMLDivElement>(null);
  const listaId = useId();

  const sugestoes = useMemo(
    () => (consulta.trim().length >= 2 ? buscarAtividades(consulta) : SUGESTOES_INICIAIS),
    [consulta],
  );

  // T10: além do dicionário, busca nas tabelas oficiais de NCM e NBS da Receita.
  const termoOficial = escolha === null && consulta.trim().length >= 3 ? consulta.trim() : "";
  useEffect(() => {
    if (!termoOficial) return;
    let cancelado = false;
    const espera = setTimeout(() => {
      setBuscandoOficiais(true);
      fetch(`/api/codigos?q=${encodeURIComponent(termoOficial)}`)
        .then((r) => r.json())
        .then(async (lista: CodigoOficial[]) => {
          if (cancelado) return;
          setOficiais(lista);
          // Nada no dicionário nem nos produtos/serviços: procura nas descrições das classificações
          // (cClassTrib). Esse endpoint também registra a busca sem resultado, para crescer o dicionário.
          let achadas: ResultadoBuscaOficial[] = [];
          if (lista.length === 0 && buscarAtividades(termoOficial).length === 0) {
            const r = await fetch(`/api/busca-oficial?q=${encodeURIComponent(termoOficial)}`);
            if (r.ok) achadas = ((await r.json()) as RespostaBuscaOficial).resultados.filter((x) => x.tipo === "classificacao");
          }
          if (!cancelado) setClassificacoes(achadas);
        })
        .catch(() => {
          if (!cancelado) {
            setOficiais([]);
            setClassificacoes([]);
          }
        })
        .finally(() => !cancelado && setBuscandoOficiais(false));
    }, 250);
    return () => {
      cancelado = true;
      clearTimeout(espera);
    };
  }, [termoOficial]);

  const opcoes: Opcao[] = useMemo(
    () => [
      ...sugestoes.map((a) => ({ tipo: "atividade" as const, atividade: a })),
      ...(termoOficial ? oficiais.slice(0, sugestoes.length >= 3 ? 3 : 6) : []).map((o) => ({ tipo: "oficial" as const, oficial: o })),
      ...(termoOficial ? classificacoes : []).map((c) => ({ tipo: "classificacao" as const, item: c })),
    ],
    [sugestoes, oficiais, classificacoes, termoOficial],
  );

  // Carrega as cidades do estado. Na primeira vez, recupera o último estado/cidade
  // escolhidos neste navegador.
  const restaurado = useRef(false);
  useEffect(() => {
    let cancelado = false;
    fetch(`/api/municipios?uf=${uf}`)
      .then((r) => r.json())
      .then((lista: [number, string][]) => {
        if (cancelado) return;
        if (!restaurado.current) {
          restaurado.current = true;
          const salvo = lembrar<{ uf: string; municipio: number }>("calc:local");
          if (salvo && UFS.includes(salvo.uf) && salvo.uf !== uf) {
            setUf(salvo.uf); // recarrega com o estado salvo
            setMunicipio(salvo.municipio);
            return;
          }
          if (salvo && lista.some(([c]) => c === salvo.municipio)) {
            setMunicipios(lista);
            setMunicipio(salvo.municipio);
            return;
          }
        }
        setMunicipios(lista);
        setMunicipio((atual) => (lista.some(([c]) => c === atual) ? atual : (CAPITAIS[uf] ?? lista[0]?.[0])));
      })
      .catch(() => setMunicipios([]));
    return () => {
      cancelado = true;
    };
  }, [uf]);

  function escolherAtividade(a: Atividade) {
    setEscolha({ modo: "atividade", atividade: a });
    setConsulta(a.nome);
    setAberto(false);
    setErro(null);
  }

  function escolherOficial(o: CodigoOficial) {
    setEscolha({ modo: "oficial", oficial: o, cClassTrib: "000001" });
    setConsulta(o.descricao);
    setAberto(false);
    setErro(null);
  }

  /** Classificação achada pela descrição: preenche o cClassTrib e pede o NCM/NBS. */
  function escolherClassificacao(c: ResultadoBuscaOficial) {
    setEscolha(null);
    setCodigo("");
    setCClassTrib(c.codigo);
    setModoCodigo(true);
    setAberto(false);
    setErro(null);
    requestAnimationFrame(() => codigoRef.current?.focus());
  }

  function escolherOpcao(o: Opcao) {
    if (o.tipo === "atividade") escolherAtividade(o.atividade);
    else if (o.tipo === "oficial") escolherOficial(o.oficial);
    else escolherClassificacao(o.item);
  }

  function teclado(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!aberto && (e.key === "ArrowDown" || e.key === "ArrowUp")) setAberto(true);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setDestaque((d) => Math.min(d + 1, opcoes.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setDestaque((d) => Math.max(d - 1, 0));
    } else if (e.key === "Enter" && aberto && opcoes[destaque]) {
      e.preventDefault();
      escolherOpcao(opcoes[destaque]);
    } else if (e.key === "Escape") {
      setAberto(false);
    }
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    let pedidoBase: { tipo: "ncm" | "nbs"; codigo: string; cClassTrib: string };
    if (modoCodigo) {
      const limpo = codigo.replace(/\D/g, "");
      if (limpo.length !== 8 && limpo.length !== 9) {
        setErro("Digite um NCM (8 números) ou um NBS (9 números).");
        return;
      }
      pedidoBase = { tipo: limpo.length === 8 ? "ncm" : "nbs", codigo: limpo, cClassTrib };
      setEscolha({ modo: "codigo", ...pedidoBase });
    } else if (escolha?.modo === "atividade") {
      const a = escolha.atividade;
      pedidoBase = { tipo: a.tipo as "ncm" | "nbs", codigo: a.codigo, cClassTrib: a.cClassTrib };
    } else if (escolha?.modo === "oficial") {
      pedidoBase = { tipo: escolha.oficial.tipo, codigo: escolha.oficial.codigo, cClassTrib: escolha.cClassTrib };
    } else {
      setErro("Escolha na lista o que você vende.");
      setAberto(true);
      return;
    }

    const v = lerValor(valor);
    if (!v || v <= 0) {
      setErro("Informe o valor da venda.");
      return;
    }

    setCarregando(true);
    lembrar("calc:local", { uf, municipio });
    try {
      const r = await fetch("/api/calcular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pedidoBase, valor: v, municipio, uf }),
      });
      const json = (await r.json()) as ResultadoCalculo;
      setResultado(json);
      if (json.ok) {
        contarEvento("calculo_gratis");
        // T18: quem está logado ganha o cálculo no histórico. O módulo de login só carrega
        // quando as contas estão ligadas, para não pesar a página de quem não tem conta.
        if (CONTAS_LIGADAS) {
          const nome = municipios.find(([c]) => c === municipio)?.[1];
          const descricao = descricaoDaEscolha(
            modoCodigo ? { modo: "codigo", ...pedidoBase } : escolha,
          );
          void Promise.all([import("@/lib/historico"), import("@/lib/historico-navegador")]).then(([h, n]) =>
            n.salvarNoHistorico(h.calculoManual(json, descricao, nome ? `${nome}/${uf}` : uf)),
          );
        }
      }
      requestAnimationFrame(() =>
        resultadoRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
      );
    } catch {
      setResultado({ ok: false, estado: "FORA_DO_AR", mensagem: "Sem conexão. Verifique a internet e tente de novo." });
    } finally {
      setCarregando(false);
    }
  }

  const nomeCidade = municipios.find(([c]) => c === municipio)?.[1];

  return (
    <div className="w-full">
      <form onSubmit={enviar} className="space-y-4" noValidate>
        {/* 1. O que você vende? */}
        {!modoCodigo ? (
          <div className="relative">
            <label htmlFor="atividade" className="rotulo">
              O que você vende?
            </label>
            <input
              id="atividade"
              type="text"
              role="combobox"
              aria-expanded={aberto}
              aria-controls={listaId}
              aria-activedescendant={aberto && opcoes.length > 0 ? `${listaId}-${destaque}` : undefined}
              aria-autocomplete="list"
              autoComplete="off"
              placeholder="Ex.: pizzaria, corte de cabelo, roupas"
              className="campo"
              value={consulta}
              onChange={(e) => {
                setConsulta(e.target.value);
                setEscolha(null);
                setAberto(true);
                setDestaque(0);
              }}
              onFocus={() => setAberto(true)}
              onBlur={() => setTimeout(() => setAberto(false), 150)}
              onKeyDown={teclado}
            />
            {aberto && (
              <ul
                id={listaId}
                role="listbox"
                className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-borda bg-white py-1 shadow-lg"
              >
                {consulta.trim().length < 2 && (
                  <li className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-suave">Mais buscados</li>
                )}
                {opcoes.map((o, i) => (
                  <li
                    key={o.tipo === "atividade" ? o.atividade.id : o.tipo === "oficial" ? `${o.oficial.tipo}-${o.oficial.codigo}` : `cclasstrib-${o.item.codigo}`}
                    id={`${listaId}-${i}`}
                    role="option"
                    aria-selected={i === destaque}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      escolherOpcao(o);
                    }}
                    onMouseEnter={() => setDestaque(i)}
                    className={`cursor-pointer px-3 py-2.5 text-sm ${i === destaque ? "bg-marca-50 text-marca-900" : "text-tinta"} ${
                      o.tipo !== "atividade" && (i === 0 || opcoes[i - 1].tipo !== o.tipo) ? "border-t border-borda" : ""
                    }`}
                  >
                    {o.tipo === "oficial" && (i === 0 || opcoes[i - 1].tipo !== "oficial") && (
                      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-suave">Nas tabelas oficiais da Receita</span>
                    )}
                    {o.tipo === "classificacao" && (i === 0 || opcoes[i - 1].tipo !== "classificacao") && (
                      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-suave">Classificações da reforma</span>
                    )}
                    {o.tipo === "classificacao" ? (
                      <span className="block">
                        <span className="line-clamp-2">{o.item.descricao}</span>
                        <span className="mt-0.5 block text-xs text-suave">cClassTrib {o.item.codigo} · depois informe o NCM ou NBS</span>
                      </span>
                    ) : o.tipo === "atividade" ? (
                      <span className="flex items-center justify-between gap-3">
                        <span>{o.atividade.nome}</span>
                        <span className="shrink-0 text-xs text-suave">{o.atividade.tipo === "nbs" ? "serviço" : "produto"}</span>
                      </span>
                    ) : (
                      <span className="flex items-start justify-between gap-3">
                        <span className="line-clamp-2">{o.oficial.descricao}</span>
                        <span className="shrink-0 text-xs text-suave">
                          {o.oficial.tipo.toUpperCase()} {o.oficial.codigo}
                        </span>
                      </span>
                    )}
                  </li>
                ))}
                {opcoes.length === 0 && buscandoOficiais && <li className="px-3 py-3 text-sm text-suave">Procurando nas tabelas oficiais…</li>}
                {opcoes.length === 0 && !buscandoOficiais && consulta.trim().length >= 2 && (
                  <li className="px-3 py-3 text-sm text-suave">
                    Não achamos “{consulta}”.{" "}
                    <button
                      type="button"
                      className="font-medium text-marca-700 underline"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setModoCodigo(true);
                      }}
                    >
                      Digitar o código NCM ou NBS
                    </button>
                  </li>
                )}
              </ul>
            )}
            {escolha?.modo === "oficial" && (
              <div className="mt-2 rounded-xl border border-borda bg-white p-3 text-sm">
                <p className="text-suave">
                  Código oficial: <strong className="text-tinta">{escolha.oficial.tipo.toUpperCase()} {escolha.oficial.codigo}</strong>
                </p>
                {escolha.oficial.especiais.length > 0 && (
                  <div className="mt-2">
                    <label htmlFor="tratamento" className="rotulo">
                      Tratamento tributário
                    </label>
                    <select
                      id="tratamento"
                      className="campo"
                      value={escolha.cClassTrib}
                      onChange={(e) => setEscolha({ ...escolha, cClassTrib: e.target.value })}
                    >
                      <option value="000001">Tributação integral (000001)</option>
                      {escolha.oficial.especiais.map((c) => (
                        <option key={c.cClassTrib} value={c.cClassTrib}>
                          {c.descricao} ({c.cClassTrib})
                        </option>
                      ))}
                    </select>
                    <p className="mt-1.5 text-xs text-suave">
                      A lei prevê tratamento especial para este código em alguns casos. Escolha um deles só se a sua venda se
                      encaixa; na dúvida, confirme com o seu contador.
                    </p>
                  </div>
                )}
              </div>
            )}
            <button type="button" onClick={() => setModoCodigo(true)} className="mt-1.5 text-xs text-suave underline hover:text-tinta">
              Sei o código NCM ou NBS
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div>
              <label htmlFor="codigo" className="rotulo">
                Código NCM (produto) ou NBS (serviço)
              </label>
              <input
                id="codigo"
                ref={codigoRef}
                inputMode="numeric"
                placeholder="Ex.: 61091000"
                className="campo"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="cclasstrib" className="rotulo">
                cClassTrib
              </label>
              <input
                id="cclasstrib"
                inputMode="numeric"
                className="campo sm:w-32"
                value={cClassTrib}
                onChange={(e) => setCClassTrib(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
            </div>
            <p className="text-xs text-suave sm:col-span-2">
              000001 é a tributação integral. Não sabe o cClassTrib? Pergunte ao seu contador ou{" "}
              <button type="button" onClick={() => setModoCodigo(false)} className="font-medium text-marca-700 underline">
                volte para a busca
              </button>
              .
            </p>
          </div>
        )}

        {/* 2. Valor */}
        <div>
          <label htmlFor="valor" className="rotulo">
            Valor da venda
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-suave">R$</span>
            <input
              id="valor"
              inputMode="decimal"
              placeholder="1.000,00"
              className="campo pl-10"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </div>
        </div>

        {/* 3. Onde */}
        <div className="grid grid-cols-[5.5rem_1fr] gap-3">
          <div>
            <label htmlFor="uf" className="rotulo">
              Estado
            </label>
            <select id="uf" className="campo" value={uf} onChange={(e) => setUf(e.target.value)}>
              {UFS.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="municipio" className="rotulo">
              Cidade
            </label>
            <select
              id="municipio"
              className="campo"
              value={municipio}
              onChange={(e) => setMunicipio(Number(e.target.value))}
              disabled={municipios.length === 0}
            >
              {municipios.map(([c, n]) => (
                <option key={c} value={c}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        {erro && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {erro}
          </p>
        )}

        <button type="submit" disabled={carregando} className="botao-primario w-full py-3.5 text-base">
          {carregando ? "Calculando…" : "Calcular meu imposto de 2027"}
        </button>
        <p className="text-center text-xs text-suave">Grátis, sem cadastro. Mesma conta da calculadora oficial da Receita Federal.</p>
      </form>

      <div ref={resultadoRef} aria-live="polite">
        {resultado && (
          <div className="mt-6">
            <Resultado
              resultado={resultado}
              descricao={descricaoDaEscolha(escolha)}
              cidade={nomeCidade ? `${nomeCidade}/${uf}` : uf}
            />
          </div>
        )}
      </div>
    </div>
  );
}
