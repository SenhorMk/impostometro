"use client";

/**
 * Entrar ou criar conta (T13): Google ou link mágico por e-mail, pelo login do Supabase.
 * Não existe senha. Criar a conta exige aceitar os termos e a política de privacidade.
 */
import Link from "next/link";
import { useState } from "react";
import { VERSAO_TERMOS } from "@/lib/contas";
import { useSessao } from "@/lib/sessao";
import { supabase } from "@/lib/supabase-navegador";

export const CHAVE_ACEITE = "termos-aceitos";

function lembrarAceite() {
  try {
    localStorage.setItem(CHAVE_ACEITE, VERSAO_TERMOS);
  } catch {
    /* sem localStorage: a conta pede o aceite de novo na primeira entrada */
  }
}

export function Entrar() {
  const sessao = useSessao();
  const [aceito, setAceito] = useState(false);
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  if (!sessao.configurado) {
    return (
      <div className="rounded-3xl border border-borda p-7 text-center">
        <p className="text-sm font-medium text-marca-700">Contas de assinante</p>
        <h1 className="mt-2 text-2xl font-bold">As contas abrem em janeiro de 2027</h1>
        <p className="mt-3 text-sm leading-relaxed text-suave">
          Com a conta você vai poder enviar o XML das notas do mês e ver a CBS e o IBS de todas as vendas, com histórico. Vai ser só
          entrar com o Google ou com um link enviado para o seu e-mail, sem senha nova.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-suave">Enquanto isso, a simulação continua grátis e sem cadastro.</p>
        <Link href="/#calculadora" className="botao-primario mt-6 w-full">
          Fazer uma simulação grátis
        </Link>
      </div>
    );
  }

  if (sessao.usuario) {
    return (
      <div className="rounded-3xl border border-borda p-7 text-center">
        <h1 className="text-2xl font-bold">Você já entrou</h1>
        <p className="mt-2 text-sm text-suave">{sessao.usuario.email}</p>
        <Link href="/conta" className="botao-primario mt-6 w-full">
          Ir para a minha conta
        </Link>
      </div>
    );
  }

  const destino = () => `${window.location.origin}/conta`;

  async function comGoogle() {
    setErro(null);
    lembrarAceite();
    const { error } = await supabase()!.auth.signInWithOAuth({ provider: "google", options: { redirectTo: destino() } });
    if (error) setErro("Não conseguimos abrir o login do Google. Tente o link por e-mail.");
  }

  async function comEmail(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErro("Confira o e-mail.");
      return;
    }
    setEnviando(true);
    lembrarAceite();
    const { error } = await supabase()!.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: destino(), data: { termos_versao: VERSAO_TERMOS } },
    });
    setEnviando(false);
    if (error) setErro(error.status === 429 ? "Muitos pedidos seguidos. Espere um minuto e tente de novo." : "Não conseguimos enviar o link. Tente de novo.");
    else setEnviado(email.trim());
  }

  if (enviado) {
    return (
      <div className="rounded-3xl border border-borda p-7 text-center" role="status">
        <h1 className="text-2xl font-bold">Confira o seu e-mail</h1>
        <p className="mt-3 text-sm leading-relaxed text-suave">
          Enviamos um link de acesso para <strong className="text-tinta">{enviado}</strong>. Abra o link neste mesmo navegador para entrar.
          Não chegou? Olhe a caixa de spam.
        </p>
        <button type="button" className="mt-5 text-sm text-suave underline" onClick={() => setEnviado(null)}>
          Usar outro e-mail
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-borda p-7">
      <p className="text-sm font-medium text-marca-700">Conta de assinante</p>
      <h1 className="mt-1 text-2xl font-bold">Entrar ou criar conta</h1>
      <p className="mt-2 text-sm text-suave">Sem senha nova: entre com o Google ou receba um link no seu e-mail.</p>

      <label className="mt-5 flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-1" checked={aceito} onChange={(e) => setAceito(e.target.checked)} />
        <span>
          Li e aceito os{" "}
          <Link href="/termos" className="font-medium text-marca-700 underline" target="_blank">
            termos de uso
          </Link>{" "}
          e a{" "}
          <Link href="/privacidade" className="font-medium text-marca-700 underline" target="_blank">
            política de privacidade
          </Link>
          .
        </span>
      </label>

      <button type="button" onClick={comGoogle} disabled={!aceito} className="botao-secundario mt-5 w-full disabled:opacity-60">
        Entrar com o Google
      </button>

      <div className="my-5 flex items-center gap-3 text-xs text-suave">
        <span className="h-px flex-1 bg-borda" /> ou <span className="h-px flex-1 bg-borda" />
      </div>

      <form onSubmit={comEmail} noValidate>
        <label htmlFor="email" className="rotulo">
          Seu e-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="campo"
          placeholder="voce@empresa.com.br"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" disabled={!aceito || enviando} className="botao-primario mt-3 w-full">
          {enviando ? "Enviando…" : "Receber link de acesso"}
        </button>
      </form>
      {!aceito && <p className="mt-3 text-xs text-suave">Marque o aceite dos termos para continuar.</p>}
      {erro && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">{erro}</p>}
    </div>
  );
}
