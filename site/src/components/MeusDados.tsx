"use client";

/**
 * "Seus dados" em Minha conta (LGPD, T41): baixar a cópia de tudo o que a conta guarda
 * (acesso e portabilidade, art. 18, II e V) e onde exercer os outros direitos.
 * O arquivo é montado no próprio navegador, com o login da pessoa: nada passa pelo
 * servidor do site e não existe link público para ele.
 */
import Link from "next/link";
import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { VERSAO_TERMOS } from "@/lib/contas";
import { juntarDados } from "@/lib/lgpd-navegador";
import { montarExportacao, nomeArquivoExportacao } from "@/lib/privacidade";
import { supabase } from "@/lib/supabase-navegador";

export function MeusDados({ usuario }: { usuario: User }) {
  const [estado, setEstado] = useState<"pronto" | "juntando" | "baixado" | "erro">("pronto");

  async function baixar() {
    setEstado("juntando");
    try {
      const sb = supabase()!;
      const agora = new Date();
      const arquivo = montarExportacao(await juntarDados(sb, usuario), agora, VERSAO_TERMOS);
      const blob = new Blob([JSON.stringify(arquivo, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nomeArquivoExportacao(agora);
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      // Só a contagem do dia, sem identificar ninguém. Se o SQL ainda não rodou, tudo bem.
      void sb.rpc("registrar_dados_baixados").then(() => undefined);
      setEstado("baixado");
    } catch (e) {
      console.warn("Não foi possível juntar os dados", e);
      setEstado("erro");
    }
  }

  return (
    <section className="rounded-2xl border border-borda bg-white p-5 text-sm">
      <h2 className="text-lg font-semibold">Seus dados</h2>
      <p className="mt-1 text-suave">
        Baixe uma cópia de tudo o que a sua conta guarda (e-mail, aceites, empresa, assinatura e histórico) num arquivo aberto (JSON),
        para conferir ou levar para outro serviço. O que cada dado é, por que guardamos e por quanto tempo está na{" "}
        <Link href="/privacidade" className="text-marca-700 underline">
          política de privacidade
        </Link>
        .
      </p>
      <button type="button" onClick={baixar} disabled={estado === "juntando"} className="botao-secundario mt-4 disabled:opacity-60">
        {estado === "juntando" ? "Juntando os dados…" : "Baixar meus dados"}
      </button>
      {estado === "baixado" && <p className="mt-3 text-marca-700">Pronto. O arquivo foi para a pasta de downloads do seu navegador.</p>}
      {estado === "erro" && (
        <p className="mt-3 rounded-xl bg-red-50 p-3 text-red-800">
          Não conseguimos juntar os dados agora. Tente de novo ou peça pelo{" "}
          <Link href="/contato" className="underline">
            contato
          </Link>
          .
        </p>
      )}
      <p className="mt-4 text-suave">
        Para corrigir, use os dados da empresa acima. Para apagar, apague um cálculo no histórico ou a conta inteira abaixo. Outros pedidos
        (trocar o e-mail, se opor a um uso, saber mais) vão pelo{" "}
        <Link href="/contato" className="text-marca-700 underline">
          contato
        </Link>
        .
      </p>
    </section>
  );
}
