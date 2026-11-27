"use client";

/**
 * Assinatura na página da conta (T14): assinar, pagar, ver até quando vale e cancelar sozinho.
 * T37: o que aparece segue o que o servidor decidiu (/api/acesso). Assinar só aparece no modo "assinatura";
 * quem já tem assinatura sempre vê a situação e consegue cancelar, em qualquer modo.
 */
import { useEffect, useState } from "react";
import { temAcesso, type Assinatura } from "@/lib/assinatura";
import { PLANOS } from "@/lib/config";
import { dataBR, emReais } from "@/lib/formato";
import type { EstadoAcesso } from "@/lib/acesso-cliente";
import { cabecalhoLogin } from "@/lib/sessao";
import { supabase } from "@/lib/supabase-navegador";

type Linha = Assinatura & { link_pagamento: string | null; valor_centavos: number };

export function AssinaturaConta({ usuarioId, acesso }: { usuarioId: string; acesso: EstadoAcesso | null }) {
  const [linha, setLinha] = useState<Linha | null | undefined>(undefined);
  const [documento, setDocumento] = useState("");
  const [nome, setNome] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [confirmarCancelar, setConfirmarCancelar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    const { data } = await supabase()!
      .from("assinaturas")
      .select("status, valido_ate, link_pagamento, valor_centavos")
      .eq("usuario_id", usuarioId)
      .maybeSingle();
    setLinha((data as Linha | null) ?? null);
  }

  useEffect(() => {
    let vivo = true;
    supabase()!
      .from("assinaturas")
      .select("status, valido_ate, link_pagamento, valor_centavos")
      .eq("usuario_id", usuarioId)
      .maybeSingle()
      .then(({ data }) => vivo && setLinha((data as Linha | null) ?? null));
    return () => {
      vivo = false;
    };
  }, [usuarioId]);

  if (linha === undefined || !acesso) return <p className="rounded-2xl border border-borda bg-white p-5 text-sm text-suave">Carregando a assinatura…</p>;

  if (!linha && !acesso.vendeAssinatura) {
    return (
      <section className="rounded-2xl border border-borda bg-white p-5">
        <h2 className="text-lg font-semibold">Assinatura</h2>
        <p className="mt-1 text-sm text-suave">
          {acesso.situacao === "previa"
            ? `A assinatura abre em janeiro de 2027. Até lá, a importação de notas fica aberta como prévia, com até ${acesso.limiteNotas} notas por vez.`
            : "A assinatura ainda não está disponível. A simulação de uma venda continua grátis."}
        </p>
      </section>
    );
  }

  async function assinar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setOcupado(true);
    const r = await fetch("/api/assinatura", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await cabecalhoLogin()) },
      body: JSON.stringify({ documento, nome }),
    });
    const corpo = await r.json().catch(() => ({}));
    if (r.ok && corpo.link) {
      window.location.href = corpo.link;
      return;
    }
    setErro(corpo.erro ?? "Não conseguimos criar a assinatura. Tente de novo.");
    setOcupado(false);
  }

  async function cancelar() {
    setErro(null);
    setOcupado(true);
    const r = await fetch("/api/assinatura", { method: "DELETE", headers: await cabecalhoLogin() });
    const corpo = await r.json().catch(() => ({}));
    if (!r.ok) setErro(corpo.erro ?? "Não conseguimos cancelar agora. Tente de novo.");
    await carregar();
    setConfirmarCancelar(false);
    setOcupado(false);
  }

  const temAcessoAgora = temAcesso(linha);
  const preco = linha ? `${emReais(linha.valor_centavos / 100)}/mês` : `${PLANOS.assinante.preco}${PLANOS.assinante.periodo}`;
  const podeCancelar = acesso.cancelamentoDisponivel;
  const podeAssinar = acesso.vendeAssinatura && (!linha || linha.status === "cancelada" || linha.status === "suspensa" || (!temAcessoAgora && linha.status !== "pendente"));

  return (
    <section className="rounded-2xl border border-borda bg-white p-5">
      <h2 className="text-lg font-semibold">Assinatura</h2>

      {linha && temAcessoAgora && linha.status !== "cancelada" && (
        <>
          <p className="mt-1 text-sm">
            <strong className="text-marca-700">Assinante</strong> · {preco} · acesso até {dataBR(linha.valido_ate!)}
          </p>
          {linha.status === "atrasada" && (
            <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              A última cobrança está atrasada. Pague pelo e-mail do Asaas para não perder o acesso depois de {dataBR(linha.valido_ate!)}.
            </p>
          )}
          {!podeCancelar ? null : !confirmarCancelar ? (
            <button type="button" className="mt-4 text-sm text-suave underline hover:text-tinta" onClick={() => setConfirmarCancelar(true)}>
              Cancelar assinatura
            </button>
          ) : (
            <div className="mt-4 rounded-xl bg-fundo p-3 text-sm">
              <p>Cancelar agora? Não haverá novas cobranças e o acesso continua até {dataBR(linha.valido_ate!)}.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="botao-secundario px-4 py-2 text-sm" disabled={ocupado} onClick={cancelar}>
                  {ocupado ? "Cancelando…" : "Sim, cancelar"}
                </button>
                <button type="button" className="px-4 py-2 text-sm text-suave underline" onClick={() => setConfirmarCancelar(false)}>
                  Manter assinatura
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {linha?.status === "cancelada" && temAcessoAgora && (
        <p className="mt-1 text-sm text-suave">Assinatura cancelada. O acesso continua até {dataBR(linha.valido_ate!)} e não haverá novas cobranças.</p>
      )}

      {linha?.status === "pendente" && (
        <div className="mt-2 text-sm">
          <p className="text-suave">Esperando o primeiro pagamento. Assim que o Asaas confirmar, a importação de notas libera sozinha.</p>
          {linha.link_pagamento && (
            <a href={linha.link_pagamento} className="botao-primario mt-3" rel="noopener">
              Abrir a página de pagamento
            </a>
          )}
          {podeCancelar && (
            <button type="button" className="ml-3 text-sm text-suave underline" onClick={cancelar} disabled={ocupado}>
              Desistir
            </button>
          )}
        </div>
      )}

      {linha?.status === "suspensa" && (
        <p className="mt-2 rounded-xl bg-red-50 p-3 text-sm text-red-800">O pagamento foi estornado ou contestado, e a assinatura foi suspensa.</p>
      )}

      {!acesso.vendeAssinatura && linha && !temAcessoAgora && linha.status !== "pendente" && linha.status !== "suspensa" && (
        <p className="mt-1 text-sm text-suave">A sua assinatura terminou. Novas assinaturas estão fechadas no momento.</p>
      )}

      {podeAssinar && (
        <form onSubmit={assinar} className="mt-3 space-y-3" noValidate>
          <p className="text-sm text-suave">
            {preco}: importe o XML das notas do mês e veja a CBS e o IBS de cada venda. Pague com Pix, cartão ou boleto na página
            segura do Asaas. Cancele quando quiser, aqui mesmo.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="pag-nome" className="rotulo">
                Nome ou razão social de quem paga
              </label>
              <input id="pag-nome" className="campo" value={nome} onChange={(e) => setNome(e.target.value.slice(0, 100))} />
            </div>
            <div>
              <label htmlFor="pag-doc" className="rotulo">
                CPF ou CNPJ de quem paga
              </label>
              <input id="pag-doc" inputMode="numeric" className="campo" value={documento} onChange={(e) => setDocumento(e.target.value.slice(0, 18))} />
            </div>
          </div>
          <button type="submit" className="botao-primario" disabled={ocupado}>
            {ocupado ? "Abrindo o pagamento…" : `Assinar por ${preco}`}
          </button>
          <p className="text-xs text-suave">O Asaas pede CPF ou CNPJ para emitir a cobrança.</p>
        </form>
      )}
      {erro && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">{erro}</p>}
    </section>
  );
}
