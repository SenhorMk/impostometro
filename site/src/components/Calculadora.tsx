"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { buscarAtividades, SUGESTOES_INICIAIS, type Atividade } from "@/lib/busca";
import { lerValor } from "@/lib/formato";
import type { ResultadoCalculo } from "@/lib/tipos";
import type { RespostaBuscaOficial, ResultadoBuscaOficial } from "@/lib/busca-oficial-tipos";
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
  | { modo: "codigo"; tipo: "ncm" | "nbs"; codigo: string; cClassTrib: string };

function lembrar<T>(chave: string, valor?: T): T | null {
  try {
    if (valor === undefined) return JSON.parse(localStorage.getItem(chave) ?? "null");
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    /* navegação anônima: tudo bem, só não lembramos */
  }
  return null;
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
  const [buscaOficial, setBuscaOficial] = useState<{
    consulta: string;
    resposta?: RespostaBuscaOficial;
    erro?: boolean;
  } | null>(null);
  const [selecionadoOficial, setSelecionadoOficial] = useState<ResultadoBuscaOficial | null>(null);
  const codigoRef = useRef<HTMLInputElement>(null);
  const classificacaoRef = useRef<HTMLInputElement>(null);
  const resultadoRef = useRef<HTMLDivElement>(null);
  const listaId = useId();

  const sugestoes = useMemo(
    () => (consulta.trim().length >= 2 ? buscarAtividades(consulta) : SUGESTOES_INICIAIS),
    [consulta],
  );
  const consultaOficial = aberto && !modoCodigo && consulta.trim().length >= 2 && sugestoes.length === 0
    ? consulta.trim() : "";
  const buscaAtual = buscaOficial?.consulta === consultaOficial ? buscaOficial : null;
  const oficiais = buscaAtual?.resposta?.resultados ?? [];
  const quantidade = sugestoes.length || oficiais.length;

  useEffect(() => {
    if (!consultaOficial) return;
    const controlador = new AbortController();
    const espera = setTimeout(async () => {
      try {
        const r = await fetch(`/api/busca-oficial?q=${encodeURIComponent(consultaOficial)}`, { signal: controlador.signal });
        if (!r.ok) throw new Error("Falha na busca");
        const resposta = await r.json() as RespostaBuscaOficial;
        if (!controlador.signal.aborted) setBuscaOficial({ consulta: consultaOficial, resposta });
      } catch {
        if (!controlador.signal.aborted) setBuscaOficial({ consulta: consultaOficial, erro: true });
      }
    }, 250);
    return () => {
      clearTimeout(espera);
      controlador.abort();
    };
  }, [consultaOficial]);

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
    setSelecionadoOficial(null);
    setResultado(null);
  }

  function escolherOficial(item: ResultadoBuscaOficial) {
    setSelecionadoOficial(item);
    setEscolha(null);
    setResultado(null);
    setCodigo(item.tipo === "classificacao" ? "" : item.codigo);
    setCClassTrib(item.tipo === "classificacao" ? item.codigo : "");
    setModoCodigo(true);
    setAberto(false);
    setErro(null);
    requestAnimationFrame(() => {
      (item.tipo === "classificacao" ? codigoRef : classificacaoRef).current?.focus();
    });
  }

  function teclado(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!aberto && (e.key === "ArrowDown" || e.key === "ArrowUp")) setAberto(true);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setDestaque((d) => Math.min(d + 1, Math.max(quantidade - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setDestaque((d) => Math.max(d - 1, 0));
    } else if (e.key === "Enter" && aberto) {
      e.preventDefault();
      if (sugestoes[destaque]) escolherAtividade(sugestoes[destaque]);
      else if (oficiais[destaque]) escolherOficial(oficiais[destaque]);
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
      if (!/^\d{6}$/.test(cClassTrib)) {
        setErro("Informe a classificação tributária (cClassTrib, 6 números).");
        classificacaoRef.current?.focus();
        return;
      }
      pedidoBase = { tipo: limpo.length === 8 ? "ncm" : "nbs", codigo: limpo, cClassTrib };
      setEscolha({ modo: "codigo", ...pedidoBase });
    } else if (escolha?.modo === "atividade") {
      const a = escolha.atividade;
      pedidoBase = { tipo: a.tipo as "ncm" | "nbs", codigo: a.codigo, cClassTrib: a.cClassTrib };
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
              aria-autocomplete="list"
              aria-activedescendant={aberto && quantidade > 0 ? `${listaId}-${destaque}` : undefined}
              maxLength={120}
              autoComplete="off"
              placeholder="Ex.: pizzaria, corte de cabelo, roupas"
              className="campo"
              value={consulta}
              onChange={(e) => {
                setConsulta(e.target.value);
                setEscolha(null);
                setResultado(null);
                setSelecionadoOficial(null);
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
                {sugestoes.map((a, i) => (
                  <li
                    key={a.id}
                    id={`${listaId}-${i}`}
                    role="option"
                    aria-selected={i === destaque}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      escolherAtividade(a);
                    }}
                    onMouseEnter={() => setDestaque(i)}
                    className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-sm ${
                      i === destaque ? "bg-marca-50 text-marca-900" : "text-tinta"
                    }`}
                  >
                    <span>{a.nome}</span>
                    <span className="shrink-0 text-xs text-suave">{a.tipo === "nbs" ? "serviço" : "produto"}</span>
                  </li>
                ))}
                {consultaOficial && !buscaAtual && (
                  <li role="presentation" className="px-3 py-3 text-sm text-suave"><span role="status">Buscando nas tabelas da Receita…</span></li>
                )}
                {oficiais.length > 0 && (
                  <li role="presentation" className="px-3 py-2 text-xs text-suave">Tabela da Receita · {buscaAtual?.resposta?.versaoTabela}</li>
                )}
                {oficiais.map((item, i) => (
                  <li
                    key={`${item.tipo}:${item.codigo}`}
                    id={`${listaId}-${i}`}
                    role="option"
                    aria-selected={i === destaque}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      escolherOficial(item);
                    }}
                    onMouseEnter={() => setDestaque(i)}
                    className={`cursor-pointer px-3 py-2.5 text-sm ${i === destaque ? "bg-marca-50 text-marca-900" : "text-tinta"}`}
                  >
                    <span className="block">{item.descricao}</span>
                    <span className="mt-1 block text-xs text-suave">
                      {item.tipo === "classificacao" ? `cClassTrib ${item.codigo} · informe também o NCM ou NBS` : "Informe também a classificação tributária"}
                    </span>
                  </li>
                ))}
                {consultaOficial && buscaAtual && oficiais.length === 0 && (
                  <li className="px-3 py-3 text-sm text-suave">
                    {buscaAtual.erro ? "Não conseguimos consultar as tabelas agora. Tente novamente ou informe os códigos." : `Não achamos “${consulta}” no dicionário nem nas tabelas consultadas.`}{" "}
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
            <button type="button" onClick={() => setModoCodigo(true)} className="mt-1.5 text-xs text-suave underline hover:text-tinta">
              Sei o código NCM ou NBS
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            {selecionadoOficial && (
              <p className="rounded-lg bg-marca-50 p-3 text-sm text-marca-900 sm:col-span-2">
                Selecionado na tabela da Receita: {selecionadoOficial.descricao}.
                {" "}Complete o campo em branco e confirme o enquadramento com seu contador.
              </p>
            )}
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
                ref={classificacaoRef}
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
              descricao={
                escolha?.modo === "atividade"
                  ? escolha.atividade.nome
                  : escolha?.modo === "codigo"
                    ? `${escolha.tipo.toUpperCase()} ${escolha.codigo}`
                    : ""
              }
              cidade={nomeCidade ? `${nomeCidade}/${uf}` : uf}
            />
          </div>
        )}
      </div>
    </div>
  );
}
