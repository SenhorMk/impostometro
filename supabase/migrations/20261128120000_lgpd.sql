-- LGPD (28/11/2026): histórico de aceites, limpeza de contas inativas e registro dos pedidos
-- dos titulares. Rodar UMA vez no SQL Editor do Supabase, DEPOIS do 20261127210000_revisao_seguranca.sql.
-- Pode rodar de novo sem estragar nada.
--
-- O que muda (explicação completa em docs/lgpd.md):
--  1. aceites_termos: cada aceite dos termos e da privacidade fica registrado (versão e data),
--     sem apagar os anteriores. A função aceitar_termos(versao) grava o aceite e atualiza o perfil.
--     Assim, quando a política muda, quem já tem conta aceita a versão nova e fica o histórico (T41).
--  2. lgpd_registro: conta por dia quantos pedidos de titulares foram atendidos (contas apagadas
--     pela pessoa, contas apagadas por inatividade, cópias dos dados baixadas). Só números, sem
--     identificar ninguém: serve para provar que os pedidos são atendidos (art. 37 e art. 6º, X).
--  3. apagar_contas_inativas(): todo mês apaga as contas sem nenhum acesso há 24 meses e sem
--     assinatura viva (T42). Tudo da conta some junto (cascade), como no "apagar minha conta".

-- 1. Histórico de aceites ----------------------------------------------------------------
create table if not exists public.aceites_termos (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  versao text not null check (char_length(versao) between 1 and 20),
  aceito_em timestamptz not null default now()
);

create index if not exists aceites_termos_usuario_idx on public.aceites_termos (usuario_id, aceito_em desc);

alter table public.aceites_termos enable row level security;
revoke all on public.aceites_termos from public, anon, authenticated;
grant select on public.aceites_termos to authenticated; -- gravar só pela função abaixo
grant all on public.aceites_termos to service_role;

drop policy if exists ler_os_proprios_aceites on public.aceites_termos;
create policy ler_os_proprios_aceites on public.aceites_termos
  for select to authenticated
  using (usuario_id = (select auth.uid()));

-- Os aceites que já existem (guardados só no perfil) entram no histórico uma vez.
insert into public.aceites_termos (usuario_id, versao, aceito_em)
select p.usuario_id, p.termos_versao, p.termos_aceitos_em
from public.perfis p
where not exists (select 1 from public.aceites_termos a where a.usuario_id = p.usuario_id);

create or replace function public.aceitar_termos(versao text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'sem login' using errcode = '42501';
  end if;
  if aceitar_termos.versao is null or char_length(aceitar_termos.versao) not between 1 and 20 then
    raise exception 'versão inválida' using errcode = '22023';
  end if;
  -- Clique repetido na mesma versão não cria linha nova.
  if exists (select 1 from public.perfis p where p.usuario_id = auth.uid() and p.termos_versao = aceitar_termos.versao) then
    return;
  end if;
  insert into public.perfis (usuario_id, termos_versao, termos_aceitos_em)
  values (auth.uid(), aceitar_termos.versao, now())
  on conflict (usuario_id) do update set termos_versao = excluded.termos_versao, termos_aceitos_em = excluded.termos_aceitos_em;
  insert into public.aceites_termos (usuario_id, versao) values (auth.uid(), aceitar_termos.versao);
end;
$$;

revoke all on function public.aceitar_termos(text) from public, anon;
grant execute on function public.aceitar_termos(text) to authenticated;

-- 2. Registro dos pedidos dos titulares (só contadores) ----------------------------------
create table if not exists public.lgpd_registro (
  dia date not null,
  tipo text not null check (tipo in ('conta_apagada', 'conta_inativa_apagada', 'dados_baixados')),
  total integer not null default 0 check (total >= 0),
  primary key (dia, tipo)
);

alter table public.lgpd_registro enable row level security;
revoke all on public.lgpd_registro from public, anon, authenticated;
grant all on public.lgpd_registro to service_role;

create or replace function public.registrar_lgpd(tipo text, quantos integer default 1)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.lgpd_registro (dia, tipo, total)
  values ((now() at time zone 'America/Sao_Paulo')::date, registrar_lgpd.tipo, registrar_lgpd.quantos)
  on conflict (dia, tipo) do update set total = public.lgpd_registro.total + excluded.total;
$$;

revoke all on function public.registrar_lgpd(text, integer) from public, anon, authenticated;

-- A pessoa logada só consegue registrar que baixou os próprios dados.
create or replace function public.registrar_dados_baixados()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'sem login' using errcode = '42501';
  end if;
  perform public.registrar_lgpd('dados_baixados');
end;
$$;

revoke all on function public.registrar_dados_baixados() from public, anon;
grant execute on function public.registrar_dados_baixados() to authenticated;

-- Apagar a própria conta: mesma regra da revisão de segurança, agora contando no registro.
create or replace function public.apagar_minha_conta()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'sem login';
  end if;
  if exists (
    select 1 from public.assinaturas a
    where a.usuario_id = auth.uid()
      and a.asaas_assinatura_id is not null
      and (a.status <> 'cancelada' or a.link_pagamento is not null)
  ) then
    raise exception 'Cancele a assinatura antes de apagar a conta.' using errcode = 'P0001';
  end if;
  delete from auth.users where id = auth.uid();
  perform public.registrar_lgpd('conta_apagada');
end;
$$;

revoke all on function public.apagar_minha_conta() from public, anon;
grant execute on function public.apagar_minha_conta() to authenticated;

-- 3. Contas inativas (T42) ---------------------------------------------------------------
-- Inativa = nenhum acesso (ou criação, se nunca entrou) há mais de 24 meses E nenhuma
-- assinatura viva ou com acesso ainda válido. Prazo igual a MESES_INATIVIDADE em
-- site/src/lib/privacidade.ts e ao texto da página /privacidade.
create or replace function public.apagar_contas_inativas()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  apagadas integer;
begin
  with inativas as (
    delete from auth.users u
    where coalesce(u.last_sign_in_at, u.created_at) < now() - interval '24 months'
      and not exists (
        select 1 from public.assinaturas a
        where a.usuario_id = u.id
          and (
            (a.asaas_assinatura_id is not null and (a.status <> 'cancelada' or a.link_pagamento is not null))
            or a.valido_ate >= current_date
          )
      )
    returning 1
  )
  select count(*) into apagadas from inativas;
  if apagadas > 0 then
    perform public.registrar_lgpd('conta_inativa_apagada', apagadas);
  end if;
  return apagadas;
end;
$$;

revoke all on function public.apagar_contas_inativas() from public, anon, authenticated;

-- Todo dia 1º, às 4h10 (UTC). Rodar de novo só atualiza o agendamento.
select cron.schedule('apagar_contas_inativas', '10 4 1 * *', $$select public.apagar_contas_inativas();$$);

comment on table public.aceites_termos is 'LGPD (T41): histórico de cada aceite dos termos e da privacidade. Gravado só por aceitar_termos().';
comment on table public.lgpd_registro is 'LGPD: pedidos de titulares atendidos por dia, sem identificar ninguém.';
comment on function public.aceitar_termos(text) is 'Grava o aceite de uma versão dos termos/privacidade (perfil + histórico).';
comment on function public.apagar_contas_inativas() is 'LGPD (T42): apaga contas sem acesso há 24 meses e sem assinatura viva. Agendada todo mês.';
comment on function public.apagar_minha_conta() is 'Apaga a própria conta (T13). Recusa se a assinatura do Asaas ainda estiver viva. Conta no lgpd_registro.';
