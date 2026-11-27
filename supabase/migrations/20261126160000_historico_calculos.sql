-- T18: histórico de cálculos de cada conta (simulações manuais e lotes de XML).
-- Quem grava é o próprio navegador da pessoa logada (chave publicável + RLS):
-- cada conta só lê, grava e apaga as próprias linhas. Apagar a conta apaga tudo (cascade).
-- Guardamos os totais em colunas (para a lista) e o resultado completo em "detalhe"
-- (para reabrir exatamente como foi calculado, com as versões da calculadora e das alíquotas).

create table public.calculos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  origem text not null check (origem in ('manual', 'xml')),
  titulo text not null check (char_length(titulo) between 1 and 200),
  base_centavos bigint not null check (base_centavos >= 0),
  cbs_centavos bigint not null check (cbs_centavos >= 0),
  ibs_centavos bigint not null check (ibs_centavos >= 0),
  itens_calculados integer not null default 0 check (itens_calculados >= 0),
  itens_com_erro integer not null default 0 check (itens_com_erro >= 0),
  versao_motor text not null check (char_length(versao_motor) between 1 and 40),
  versao_tabela_motor text not null check (char_length(versao_tabela_motor) between 1 and 40),
  versao_tabela_aliquotas text not null check (char_length(versao_tabela_aliquotas) between 1 and 40),
  -- resultado completo; até ~5 MB por cálculo (um lote de 500 notas cabe com folga)
  detalhe jsonb check (detalhe is null or octet_length(detalhe::text) <= 5000000),
  criado_em timestamptz not null default now()
);

create index calculos_usuario_criado_em_idx on public.calculos (usuario_id, criado_em desc);

alter table public.calculos enable row level security;

revoke all on public.calculos from public, anon, authenticated;
grant select, insert, delete on public.calculos to authenticated;
grant all on public.calculos to service_role;

create policy ler_os_proprios_calculos on public.calculos
  for select to authenticated
  using (usuario_id = (select auth.uid()));

create policy gravar_os_proprios_calculos on public.calculos
  for insert to authenticated
  with check (usuario_id = (select auth.uid()));

create policy apagar_os_proprios_calculos on public.calculos
  for delete to authenticated
  using (usuario_id = (select auth.uid()));

-- Limite de 2.000 cálculos guardados por conta, para ninguém encher o banco.
-- (Fica num gatilho porque uma regra de RLS não pode consultar a própria tabela.)
create function public.limitar_calculos_por_conta()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.calculos where usuario_id = new.usuario_id) >= 2000 then
    raise exception 'O histórico chegou a 2.000 cálculos. Apague alguns antigos para guardar novos.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke all on function public.limitar_calculos_por_conta() from public, anon, authenticated;

create trigger limitar_calculos_por_conta
  before insert on public.calculos
  for each row execute function public.limitar_calculos_por_conta();

comment on table public.calculos is
  'Histórico de cálculos por conta (T18): totais, versões usadas e o resultado completo para reabrir.';
