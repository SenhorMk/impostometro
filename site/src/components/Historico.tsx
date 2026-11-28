"use client";

/**
 * Histórico de cálculos da conta (T18).
 * Lista com data, origem (manual ou XML) e totais. Reabrir mostra o resultado exatamente
 * como saiu na hora, com a versão da calculadora e das alíquotas usadas: nada é recalculado.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { emPercentual, emReais } from "@/lib/formato";
import type { CalculoSalvo, Detalhe } from "@/lib/historico";
import { abrirDoHistorico, apagarDoHistorico, listarHistorico } from "@/lib/historico-navegador";
import { useSessao } from "@/lib/sessao";
import { Resultado } from "./Resultado";
import { ResultadoLote } from "./ResultadoLote";

const reais = (centavos: number) => emReais(centavos / 100);
const quando = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

type Aberto = { id: string; estado: "carregando" | "erro" } | { id: string; estado: "pronto"; detalhe: Detalhe | null };

export function Historico() {
  const sessao = useSessao();
  const usuario = sessao.configurado ? sessao.usuario : null;
  const [lista, setLista] = useState<{ dono: string; itens: CalculoSalvo[] } | { dono: string; erro: true } | null>(null);
  const [aberto, setAberto] = useState<Aberto | null>(null);
  const [apagando, setApagando] = useState<string | null>(null);
  const [erroApagar, setErroApagar] = useState(false);

  useEffect(() => {
    if (!usuario) return;
    let vivo = true;
    listarHistorico().then(
      (itens) => vivo && setLista({ dono: usuario.id, itens }),
      () => vivo && setLista({ dono: usuario.id, erro: true }),
    );
    return () => {
      vivo = false;
    };
  }, [usuario]);

  if (!sessao.configurado || (!sessao.carregando && !usuario)) {
    return (
      <div className="rounded-3xl border border-borda p-7 text-center">
        <h1 className="text-2xl font-bold">Histórico de cálculos</h1>
        <p className="mt-3 text-sm text-suave">
          {sessao.configurado ? "Entre na sua conta para ver os cálculos guardados." : "As contas abrem em janeiro de 2027."}
        </p>
        <Link href="/entrar" className="botao-primario mt-6 w-full">
          Entrar
        </Link>
      </div>
    );
  }

  const carregada = lista && usuario && lista.dono === usuario.id ? lista : null;

  async function abrir(id: string) {
    if (aberto?.id === id) return setAberto(null);
    setAberto({ id, estado: "carregando" });
    try {
      const detalhe = await abrirDoHistorico(id);
      setAberto((a) => (a?.id === id ? { id, estado: "pronto", detalhe } : a));
    } catch {
      setAberto((a) => (a?.id === id ? { id, estado: "erro" } : a));
    }
  }

  async function apagar(id: string) {
    setApagando(id);
    setErroApagar(false);
    try {
      await apagarDoHistorico(id);
      setLista((l) => (l && "itens" in l ? { ...l, itens: l.itens.filter((c) => c.id !== id) } : l));
      if (aberto?.id === id) setAberto(null);
    } catch {
      setErroApagar(true);
    } finally {
      setApagando(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/conta" className="text-sm text-suave underline hover:text-tinta">
          ← Minha conta
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Histórico de cálculos</h1>
        <p className="mt-1 text-sm text-suave">
          Cada simulação e cada lote de XML que você calcula logado fica guardado aqui, com a versão da calculadora e das
          alíquotas usadas. Assim dá para comparar meses mesmo depois que as regras mudarem.
        </p>
      </div>

      {erroApagar && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">Não conseguimos apagar agora. Tente de novo.</p>}

      {!carregada ? (
        <p className="rounded-2xl border border-borda p-5 text-center text-suave">Carregando o histórico…</p>
      ) : "erro" in carregada ? (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-800">Não conseguimos carregar o histórico agora. Recarregue a página.</p>
      ) : carregada.itens.length === 0 ? (
        <div className="rounded-2xl border border-borda bg-white p-6 text-center">
          <p className="font-medium">Nenhum cálculo guardado ainda</p>
          <p className="mt-1 text-sm text-suave">Faça uma simulação ou importe as notas do mês: o resultado aparece aqui.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/#calculadora" className="botao-secundario">
              Fazer uma simulação
            </Link>
            <Link href="/importar" className="botao-primario">
              Importar notas
            </Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {carregada.itens.map((c) => {
            const total = c.cbs_centavos + c.ibs_centavos;
            const estaAberto = aberto?.id === c.id;
            return (
              <li key={c.id} className="rounded-2xl border border-borda bg-white">
                <div className="flex flex-wrap items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="text-xs text-suave">
                      {quando.format(new Date(c.criado_em))} ·{" "}
                      <span className="rounded-full bg-marca-50 px-2 py-0.5 font-medium text-marca-800">
                        {c.origem === "xml" ? "XML de notas" : "Simulação manual"}
                      </span>
                    </p>
                    <p className="mt-1 font-medium">{c.titulo}</p>
                    <p className="mt-0.5 text-sm text-suave">
                      CBS {reais(c.cbs_centavos)} · IBS {reais(c.ibs_centavos)} · base {reais(c.base_centavos)}
                      {c.itens_com_erro > 0 && <span className="text-red-700"> · {c.itens_com_erro} sem cálculo</span>}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-lg font-semibold">{reais(total)}</p>
                    {c.base_centavos > 0 && <p className="text-xs text-suave">{emPercentual((total / c.base_centavos) * 100)} da base</p>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 border-t border-borda px-4 py-2 text-sm">
                  <button type="button" className="font-medium text-marca-700 underline" onClick={() => abrir(c.id)} aria-expanded={estaAberto}>
                    {estaAberto ? "Fechar" : "Reabrir"}
                  </button>
                  <button
                    type="button"
                    className="text-suave underline hover:text-red-700 disabled:opacity-60"
                    disabled={apagando === c.id}
                    onClick={() => apagar(c.id)}
                  >
                    {apagando === c.id ? "Apagando…" : "Apagar"}
                  </button>
                </div>
                {estaAberto && aberto && (
                  <div className="space-y-4 border-t border-borda bg-fundo p-4">
                    <Versoes c={c} />
                    {aberto.estado === "carregando" && <p className="text-sm text-suave">Abrindo…</p>}
                    {aberto.estado === "erro" && <p className="text-sm text-red-800">Não conseguimos abrir este cálculo agora. Tente de novo.</p>}
                    {aberto.estado === "pronto" && <DetalheSalvo detalhe={aberto.detalhe} c={c} />}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Versoes({ c }: { c: CalculoSalvo }) {
  return (
    <dl className="grid gap-2 rounded-xl border border-borda bg-white p-3 text-xs sm:grid-cols-3">
      <div>
        <dt className="text-suave">Calculadora da Receita</dt>
        <dd className="font-medium">versão {c.versao_motor}</dd>
      </div>
      <div>
        <dt className="text-suave">Tabelas da calculadora</dt>
        <dd className="font-medium">{c.versao_tabela_motor}</dd>
      </div>
      <div>
        <dt className="text-suave">Nossa tabela de alíquotas</dt>
        <dd className="font-medium">{c.versao_tabela_aliquotas}</dd>
      </div>
    </dl>
  );
}

function DetalheSalvo({ detalhe, c }: { detalhe: Detalhe | null; c: CalculoSalvo }) {
  if (!detalhe) {
    return (
      <p className="text-sm text-suave">
        Este lote era grande demais para guardar item a item. Ficaram guardados os totais acima e as versões usadas.
      </p>
    );
  }
  if (detalhe.tipo === "manual") {
    return <Resultado resultado={detalhe.resultado} descricao={detalhe.descricao} cidade={detalhe.cidade} />;
  }
  return (
    <ResultadoLote
      resultado={{
        notas: detalhe.notas,
        versaoMotor: c.versao_motor,
        versaoTabelaMotor: c.versao_tabela_motor,
        versaoTabelaAliquotas: c.versao_tabela_aliquotas,
        premissas: detalhe.premissas,
      }}
      notas={detalhe.lidas}
      cobertura={detalhe.cobertura}
    />
  );
}
