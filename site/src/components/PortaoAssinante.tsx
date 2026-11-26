"use client";

/**
 * Plano grátis × assinante na tela (T14). Com a cobrança ligada, só assinante vê o importador.
 * A trava de verdade fica no servidor (/api/calcular-lote); aqui é só para orientar a pessoa.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { temAcesso, type Assinatura } from "@/lib/assinatura";
import { ASSINATURA_ATIVA, useSessao } from "@/lib/sessao";
import { supabase } from "@/lib/supabase-navegador";

export function PortaoAssinante({ children }: { children: React.ReactNode }) {
  const sessao = useSessao();
  const usuario = sessao.configurado ? sessao.usuario : null;
  const [assinatura, setAssinatura] = useState<{ id: string; a: Assinatura | null } | null>(null);

  useEffect(() => {
    if (!ASSINATURA_ATIVA || !usuario) return;
    let vivo = true;
    supabase()!
      .from("assinaturas")
      .select("status, valido_ate")
      .eq("usuario_id", usuario.id)
      .maybeSingle()
      .then(({ data }) => vivo && setAssinatura({ id: usuario.id, a: data as Assinatura | null }));
    return () => {
      vivo = false;
    };
  }, [usuario]);

  if (!ASSINATURA_ATIVA || !sessao.configurado) return <>{children}</>;
  if (sessao.carregando || (usuario && assinatura?.id !== usuario.id))
    return <p className="rounded-2xl border border-borda bg-white p-6 text-center text-suave">Conferindo a sua assinatura…</p>;
  if (usuario && temAcesso(assinatura!.a)) return <>{children}</>;

  return (
    <div className="rounded-2xl border border-borda bg-white p-6 text-center">
      <h2 className="text-lg font-semibold">Importar notas é para assinantes</h2>
      <p className="mt-2 text-sm text-suave">
        A simulação de uma venda continua grátis. Com a assinatura, você envia os XMLs do mês e vê a CBS e o IBS de cada item.
      </p>
      <Link href={usuario ? "/conta" : "/entrar"} className="botao-primario mt-5">
        {usuario ? "Assinar na minha conta" : "Entrar para assinar"}
      </Link>
    </div>
  );
}
