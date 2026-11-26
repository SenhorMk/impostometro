"use client";

/** Sessão de login no navegador (T13): quem está logado, ou ninguém. */
import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "./supabase-navegador";

export type Sessao = { configurado: false } | { configurado: true; carregando: boolean; usuario: User | null };

export function useSessao(): Sessao {
  const sb = supabase();
  const [estado, setEstado] = useState<{ carregando: boolean; usuario: User | null }>({ carregando: true, usuario: null });
  useEffect(() => {
    if (!sb) return;
    let vivo = true;
    sb.auth.getSession().then(({ data }) => vivo && setEstado({ carregando: false, usuario: data.session?.user ?? null }));
    const { data } = sb.auth.onAuthStateChange((_evento, sessao) => vivo && setEstado({ carregando: false, usuario: sessao?.user ?? null }));
    return () => {
      vivo = false;
      data.subscription.unsubscribe();
    };
  }, [sb]);
  return sb ? { configurado: true, ...estado } : { configurado: false };
}
