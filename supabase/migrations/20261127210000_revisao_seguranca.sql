-- Revisão de segurança (27/11/2026). Rodar UMA vez no SQL Editor do Supabase.
-- Precisa das tabelas dos SQLs anteriores (contas, assinaturas, histórico e funil), que já
-- estão aplicadas no banco. Pode rodar de novo sem estragar nada (tudo é "create or replace"
-- ou "drop ... if exists").
--
-- O que muda (explicação completa em docs/seguranca.md):
--  1. apagar_minha_conta() se recusa a apagar enquanto a assinatura do Asaas estiver viva,
--     para ninguém continuar sendo cobrado depois de apagar a conta;
--  2. contar_evento(): visitante só soma visita, cálculo grátis e cadastro. "assinatura" e
--     "cancelamento" só o servidor do site (chave secreta) pode somar;
--  3. histórico (calculos): no máximo 100 MB guardados por conta e 30 cálculos por minuto;
--  4. buscas_sem_resultado: no máximo 2.000 registros por dia no total, para ninguém encher
--     a tabela usando a chave publicável.

-- 1. Apagar conta só depois de cancelar a assinatura -------------------------------------
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
end;
$$;

revoke all on function public.apagar_minha_conta() from public, anon;
grant execute on function public.apagar_minha_conta() to authenticated;

-- 2. Funil: etapas de dinheiro só pelo servidor ------------------------------------------
create or replace function public.contar_evento(evento text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if contar_evento.evento in ('assinatura', 'cancelamento') and coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'evento só pode ser contado pelo servidor' using errcode = '42501';
  end if;
  insert into public.funil_diario (dia, evento, total)
  values ((now() at time zone 'America/Sao_Paulo')::date, contar_evento.evento, 1)
  on conflict on constraint funil_diario_pkey do update set total = public.funil_diario.total + 1;
end;
$$;

revoke all on function public.contar_evento(text) from public;
grant execute on function public.contar_evento(text) to anon, authenticated, service_role;

-- 3. Histórico: teto de espaço por conta e de velocidade ----------------------------------
alter table public.calculos
  add column if not exists tamanho_detalhe integer
  generated always as (coalesce(octet_length(detalhe::text), 0)) stored;

create or replace function public.limitar_calculos_por_conta()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  quantos integer;
  espaco bigint;
  no_ultimo_minuto integer;
begin
  -- Um gravando por vez para a mesma conta (dois pedidos juntos não furam o limite).
  perform pg_advisory_xact_lock(hashtextextended(new.usuario_id::text, 0));

  select count(*), coalesce(sum(tamanho_detalhe), 0), count(*) filter (where criado_em > now() - interval '1 minute')
    into quantos, espaco, no_ultimo_minuto
    from public.calculos where usuario_id = new.usuario_id;

  if quantos >= 2000 then
    raise exception 'O histórico chegou a 2.000 cálculos. Apague alguns antigos para guardar novos.'
      using errcode = 'check_violation';
  end if;
  if espaco + coalesce(octet_length(new.detalhe::text), 0) > 100000000 then
    raise exception 'O histórico chegou a 100 MB. Apague alguns cálculos antigos para guardar novos.'
      using errcode = 'check_violation';
  end if;
  if no_ultimo_minuto >= 30 then
    raise exception 'Muitos cálculos guardados em pouco tempo. Espere um minuto.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke all on function public.limitar_calculos_por_conta() from public, anon, authenticated;

-- 4. Buscas sem resultado: teto diário ---------------------------------------------------
create or replace function public.limitar_buscas_sem_resultado()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.buscas_sem_resultado where criado_em >= date_trunc('day', now())) >= 2000 then
    raise exception 'limite diário de registros atingido' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke all on function public.limitar_buscas_sem_resultado() from public, anon, authenticated;

drop trigger if exists limitar_buscas_sem_resultado on public.buscas_sem_resultado;
create trigger limitar_buscas_sem_resultado
  before insert on public.buscas_sem_resultado
  for each row execute function public.limitar_buscas_sem_resultado();

comment on function public.apagar_minha_conta() is 'Apaga a própria conta (T13). Recusa se a assinatura do Asaas ainda estiver viva.';
comment on function public.contar_evento(text) is 'Funil (T22). Visitante soma visita/cálculo/cadastro; assinatura e cancelamento só o servidor.';
