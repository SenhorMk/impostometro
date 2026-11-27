"use client";

/**
 * Porta da importação de notas (T14 + T37). Mostra o que o SERVIDOR decidiu (via /api/acesso):
 * prévia com limite, assinante liberado, ou o motivo de não poder e o próximo passo.
 * Esconder o importador aqui é só para orientar: /api/calcular-lote aplica a mesma regra.
 */
import Link from "next/link";
import { useAcesso } from "@/lib/acesso-cliente";
import { Importador } from "./Importador";

export function PortaoAssinante() {
  const acesso = useAcesso();

  if (!acesso) return <p className="rounded-2xl border border-borda bg-white p-6 text-center text-suave">Conferindo o seu acesso…</p>;

  if (acesso.situacao === "liberado") return <Importador limiteNotas={acesso.limiteNotas} />;

  if (acesso.situacao === "previa")
    return (
      <>
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="note">
          <strong>{acesso.mensagem}</strong> O resultado é o mesmo da versão completa, que vai importar até 500 notas de uma vez.
        </p>
        <Importador limiteNotas={acesso.limiteNotas} />
      </>
    );

  const titulo =
    acesso.situacao === "entrar" || acesso.situacao === "assinar" ? "Importar notas é para assinantes" : "Importação indisponível agora";
  return (
    <div className="rounded-2xl border border-borda bg-white p-6 text-center">
      <h2 className="text-lg font-semibold">{titulo}</h2>
      <p className="mt-2 text-sm text-suave">{acesso.mensagem}</p>
      {acesso.situacao !== "indisponivel" && (
        <p className="mt-2 text-sm text-suave">Com a assinatura, você envia os XMLs do mês e vê a CBS e o IBS de cada item.</p>
      )}
      {acesso.proximoPasso && (
        <Link href={acesso.proximoPasso.href} className="botao-primario mt-5">
          {acesso.proximoPasso.texto}
        </Link>
      )}
    </div>
  );
}
