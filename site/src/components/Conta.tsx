"use client";

/**
 * Minha conta: aceite dos termos (T13), dados da empresa (T15), sair e apagar a conta (T13).
 * Fala direto com o Supabase; as regras do banco (RLS) garantem que cada conta só
 * lê e altera as próprias linhas.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { REGIMES, UFS, VERSAO_TERMOS, validarEmpresa, type Empresa } from "@/lib/contas";
import { useAcesso, type EstadoAcesso } from "@/lib/acesso-cliente";
import { contarEvento } from "@/lib/funil";
import { cabecalhoLogin, useSessao } from "@/lib/sessao";
import { supabase } from "@/lib/supabase-navegador";
import { AssinaturaConta } from "./AssinaturaConta";
import { CHAVE_ACEITE } from "./Entrar";

function aceitePendente(): boolean {
  try {
    return localStorage.getItem(CHAVE_ACEITE) === VERSAO_TERMOS;
  } catch {
    return false;
  }
}

export function Conta() {
  const sessao = useSessao();
  const router = useRouter();
  const acesso = useAcesso();
  const [perfil, setPerfil] = useState<"carregando" | "ok" | "falta" | "erro">("carregando");

  const usuario = sessao.configurado ? sessao.usuario : null;

  useEffect(() => {
    if (!usuario) return;
    const sb = supabase()!;
    (async () => {
      const { data, error } = await sb.from("perfis").select("termos_versao").eq("usuario_id", usuario.id).maybeSingle();
      if (error) return setPerfil("erro");
      if (data) return setPerfil("ok");
      // Primeira entrada: grava o aceite feito na tela de entrar (no Google não dá para mandar junto).
      if (aceitePendente() || usuario.user_metadata?.termos_versao === VERSAO_TERMOS) {
        const r = await sb.from("perfis").insert({ usuario_id: usuario.id, termos_versao: VERSAO_TERMOS });
        if (!r.error) contarEvento("cadastro");
        return setPerfil(r.error ? "erro" : "ok");
      }
      setPerfil("falta");
    })();
  }, [usuario]);

  if (!sessao.configurado || (!sessao.carregando && !sessao.usuario)) {
    // Link de e-mail vencido ou já usado: o Supabase volta com o erro no endereço.
    // (Só chega aqui no navegador: no servidor a sessão ainda está "carregando".)
    const p = sessao.configurado ? new URLSearchParams(window.location.search + "&" + window.location.hash.slice(1)) : null;
    const erroLink = p?.get("error") ? "O link de acesso venceu ou já foi usado. Peça um novo." : null;
    return (
      <div className="rounded-3xl border border-borda p-7 text-center">
        <h1 className="text-2xl font-bold">Minha conta</h1>
        {erroLink && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{erroLink}</p>}
        <p className="mt-3 text-sm text-suave">{sessao.configurado ? "Você não está logado." : "As contas abrem em janeiro de 2027."}</p>
        <Link href="/entrar" className="botao-primario mt-6 w-full">
          Entrar
        </Link>
      </div>
    );
  }

  if (sessao.carregando || !usuario || perfil === "carregando") {
    return <p className="rounded-3xl border border-borda p-7 text-center text-suave">Carregando a sua conta…</p>;
  }

  async function aceitar() {
    const r = await supabase()!.from("perfis").insert({ usuario_id: usuario!.id, termos_versao: VERSAO_TERMOS });
    if (!r.error) contarEvento("cadastro");
    setPerfil(r.error ? "erro" : "ok");
  }

  async function sair() {
    await supabase()!.auth.signOut();
    router.push("/");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Minha conta</h1>
          <p className="mt-1 text-sm text-suave">{usuario.email}</p>
        </div>
        <button type="button" onClick={sair} className="text-sm text-suave underline hover:text-tinta">
          Sair
        </button>
      </div>

      {perfil === "erro" && (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-800">Não conseguimos carregar a sua conta agora. Recarregue a página.</p>
      )}

      {perfil === "falta" ? (
        <section className="rounded-2xl border border-borda bg-white p-5">
          <h2 className="text-lg font-semibold">Falta um passo</h2>
          <p className="mt-1 text-sm text-suave">
            Para usar a conta, aceite os{" "}
            <Link href="/termos" className="text-marca-700 underline" target="_blank">
              termos de uso
            </Link>{" "}
            e a{" "}
            <Link href="/privacidade" className="text-marca-700 underline" target="_blank">
              política de privacidade
            </Link>
            .
          </p>
          <button type="button" onClick={aceitar} className="botao-primario mt-4">
            Li e aceito
          </button>
        </section>
      ) : perfil === "ok" ? (
        <>
          <AssinaturaConta usuarioId={usuario.id} acesso={acesso} />
          <FormEmpresa usuarioId={usuario.id} />
          <section className="rounded-2xl border border-borda bg-white p-5">
            <h2 className="text-lg font-semibold">Notas do mês</h2>
            <p className="mt-1 text-sm text-suave">Envie os XMLs das suas vendas e veja a CBS e o IBS de cada item.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/importar" className="botao-primario">
                Importar notas
              </Link>
              <Link href="/conta/historico" className="botao-secundario">
                Ver histórico de cálculos
              </Link>
            </div>
          </section>
        </>
      ) : null}

      <ApagarConta acesso={acesso} usuarioId={usuario.id} />
    </div>
  );
}

function FormEmpresa({ usuarioId }: { usuarioId: string }) {
  const [form, setForm] = useState({ uf: "SP", municipio: 0, regime: "", cnpj: "", razaoSocial: "" });
  const [municipios, setMunicipios] = useState<[number, string][]>([]);
  const [estado, setEstado] = useState<"carregando" | "pronto" | "salvando" | "salvo">("carregando");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    supabase()!
      .from("empresas")
      .select("uf, municipio, regime, cnpj, razao_social")
      .eq("usuario_id", usuarioId)
      .maybeSingle()
      .then(({ data }) => {
        const e = data as Empresa | null;
        if (e) setForm({ uf: e.uf, municipio: e.municipio, regime: e.regime, cnpj: e.cnpj ?? "", razaoSocial: e.razao_social ?? "" });
        setEstado("pronto");
      });
  }, [usuarioId]);

  useEffect(() => {
    let vivo = true;
    fetch(`/api/municipios?uf=${form.uf}`)
      .then((r) => r.json())
      .then((lista: [number, string][]) => {
        if (!vivo) return;
        setMunicipios(lista);
        setForm((f) => (lista.some(([c]) => c === f.municipio) ? f : { ...f, municipio: 0 }));
      })
      .catch(() => vivo && setMunicipios([]));
    return () => {
      vivo = false;
    };
  }, [form.uf]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const v = validarEmpresa(form);
    if (typeof v === "string") return setErro(v);
    setErro(null);
    setEstado("salvando");
    const { error } = await supabase()!
      .from("empresas")
      .upsert({ usuario_id: usuarioId, ...v, atualizado_em: new Date().toISOString() });
    if (error) {
      setErro("Não conseguimos salvar. Tente de novo.");
      setEstado("pronto");
    } else setEstado("salvo");
  }

  const mudar = (campo: keyof typeof form, valor: string | number) => {
    setForm({ ...form, [campo]: valor });
    if (estado === "salvo") setEstado("pronto");
  };

  return (
    <section className="rounded-2xl border border-borda bg-white p-5">
      <h2 className="text-lg font-semibold">Sua empresa</h2>
      <p className="mt-1 text-sm text-suave">Informe uma vez e não precisa repetir em cada cálculo.</p>
      {estado === "carregando" ? (
        <p className="mt-4 text-sm text-suave">Carregando…</p>
      ) : (
        <form onSubmit={salvar} className="mt-4 space-y-4" noValidate>
          <div className="grid grid-cols-[5.5rem_1fr] gap-3">
            <div>
              <label htmlFor="emp-uf" className="rotulo">
                Estado
              </label>
              <select id="emp-uf" className="campo" value={form.uf} onChange={(e) => mudar("uf", e.target.value)}>
                {UFS.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="emp-municipio" className="rotulo">
                Cidade
              </label>
              <select
                id="emp-municipio"
                className="campo"
                value={form.municipio}
                onChange={(e) => mudar("municipio", Number(e.target.value))}
                disabled={municipios.length === 0}
              >
                <option value={0}>Escolha a cidade</option>
                {municipios.map(([c, n]) => (
                  <option key={c} value={c}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="emp-regime" className="rotulo">
              Regime de tributação
            </label>
            <select id="emp-regime" className="campo" value={form.regime} onChange={(e) => mudar("regime", e.target.value)}>
              <option value="">Escolha o regime</option>
              {REGIMES.map((r) => (
                <option key={r.valor} value={r.valor}>
                  {r.nome}
                </option>
              ))}
            </select>
            {form.regime !== "" && form.regime !== "regular" && (
              <p className="mt-1.5 text-xs text-suave">
                Por enquanto os cálculos seguem o regime regular. A calculadora oficial ainda não cobre todo o Simples Nacional.
              </p>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="emp-cnpj" className="rotulo">
                CNPJ <span className="font-normal text-suave">(opcional)</span>
              </label>
              <input
                id="emp-cnpj"
                inputMode="numeric"
                className="campo"
                placeholder="00.000.000/0000-00"
                value={form.cnpj}
                onChange={(e) => mudar("cnpj", e.target.value.slice(0, 18))}
              />
            </div>
            <div>
              <label htmlFor="emp-razao" className="rotulo">
                Razão social <span className="font-normal text-suave">(opcional)</span>
              </label>
              <input id="emp-razao" className="campo" value={form.razaoSocial} onChange={(e) => mudar("razaoSocial", e.target.value.slice(0, 150))} />
            </div>
          </div>
          {erro && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{erro}</p>}
          <div className="flex items-center gap-3">
            <button type="submit" className="botao-primario" disabled={estado === "salvando"}>
              {estado === "salvando" ? "Salvando…" : "Salvar empresa"}
            </button>
            {estado === "salvo" && (
              <span className="text-sm text-marca-700" role="status">
                Salvo.
              </span>
            )}
          </div>
        </form>
      )}
    </section>
  );
}

function ApagarConta({ acesso, usuarioId }: { acesso: EstadoAcesso | null; usuarioId: string }) {
  const router = useRouter();
  const [confirmacao, setConfirmacao] = useState("");
  const [apagando, setApagando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function apagar() {
    setApagando(true);
    const sb = supabase()!;
    // T14: antes de apagar, encerra a assinatura no Asaas para não haver cobranças futuras.
    // T37: vale em qualquer modo. Se o cancelamento estiver fora do ar e houver assinatura viva, não apaga.
    if (acesso?.cancelamentoDisponivel) {
      const r = await fetch("/api/assinatura", { method: "DELETE", headers: await cabecalhoLogin() });
      if (!r.ok) {
        setErro("Não conseguimos cancelar a assinatura antes de apagar a conta. Tente de novo.");
        setApagando(false);
        return;
      }
    } else {
      const { data, error } = await sb.from("assinaturas").select("status, asaas_assinatura_id, link_pagamento").eq("usuario_id", usuarioId).maybeSingle();
      // "cancelada" com link = voltou a assinar e a cobrança nova ainda está aberta no Asaas.
      if (error || (data?.asaas_assinatura_id && (data.status !== "cancelada" || data.link_pagamento))) {
        setErro("Não conseguimos cancelar a sua assinatura agora, então a conta não foi apagada. Tente mais tarde ou fale com a gente.");
        setApagando(false);
        return;
      }
    }
    const { error } = await sb.rpc("apagar_minha_conta");
    if (error) {
      setErro("Não conseguimos apagar a conta agora. Tente de novo ou fale com a gente.");
      setApagando(false);
      return;
    }
    await sb.auth.signOut({ scope: "local" });
    router.push("/?conta=apagada");
  }

  return (
    <details className="rounded-2xl border border-borda bg-white p-5 text-sm">
      <summary className="cursor-pointer font-medium text-red-800">Apagar minha conta</summary>
      <p className="mt-3 text-suave">
        Apaga para sempre a conta, os dados da empresa e o aceite dos termos, e cancela a assinatura. Não dá para desfazer. Os XMLs das notas nunca ficaram
        guardados conosco.
      </p>
      <label htmlFor="confirmar-apagar" className="rotulo mt-3">
        Para confirmar, digite APAGAR
      </label>
      <input id="confirmar-apagar" className="campo" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} autoComplete="off" />
      <button
        type="button"
        onClick={apagar}
        disabled={confirmacao.trim().toUpperCase() !== "APAGAR" || apagando}
        className="mt-3 inline-flex items-center justify-center rounded-xl bg-red-700 px-5 py-3 font-semibold text-white hover:bg-red-800 disabled:opacity-60"
      >
        {apagando ? "Apagando…" : "Apagar conta para sempre"}
      </button>
      {erro && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-red-800">{erro}</p>}
    </details>
  );
}
