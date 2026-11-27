"use client";

/**
 * O que o servidor decidiu sobre o acesso desta pessoa (T37), para a tela.
 * Pergunta a /api/acesso de novo quando a pessoa entra ou sai da conta.
 * A tela nunca decide sozinha: se não der para perguntar, mostra "indisponível".
 */
import { useEffect, useState } from "react";
import type { Situacao } from "./acesso-regras";
import { cabecalhoLogin, useSessao } from "./sessao";

export type EstadoAcesso = {
  situacao: Situacao;
  limiteNotas: number;
  mensagem: string;
  proximoPasso: { texto: string; href: string } | null;
  vendeAssinatura: boolean;
  cancelamentoDisponivel: boolean;
};

const FALHA: EstadoAcesso = {
  situacao: "indisponivel",
  limiteNotas: 0,
  mensagem: "Não conseguimos conferir o seu acesso agora. Recarregue a página em alguns instantes.",
  proximoPasso: null,
  vendeAssinatura: false,
  cancelamentoDisponivel: false,
};

/** null enquanto carrega. */
export function useAcesso(): EstadoAcesso | null {
  const sessao = useSessao();
  const carregandoSessao = sessao.configurado && sessao.carregando;
  const usuarioId = sessao.configurado ? (sessao.usuario?.id ?? "") : "";
  const [estado, setEstado] = useState<{ chave: string; valor: EstadoAcesso } | null>(null);

  useEffect(() => {
    if (carregandoSessao) return;
    let vivo = true;
    (async () => {
      try {
        const r = await fetch("/api/acesso", { headers: await cabecalhoLogin(), cache: "no-store" });
        const valor = r.ok ? ((await r.json()) as EstadoAcesso) : FALHA;
        if (vivo) setEstado({ chave: usuarioId, valor });
      } catch {
        if (vivo) setEstado({ chave: usuarioId, valor: FALHA });
      }
    })();
    return () => {
      vivo = false;
    };
  }, [carregandoSessao, usuarioId]);

  if (carregandoSessao || !estado || estado.chave !== usuarioId) return null;
  return estado.valor;
}
