-- T13 e T15: perfil (aceite dos termos) e empresa de cada conta.
-- Cada pessoa só enxerga e altera as próprias linhas (RLS com auth.uid()).
-- Apagar a conta apaga tudo em cascata.

create table public.perfis (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  termos_versao text not null check (char_length(termos_versao) between 1 and 20),
  termos_aceitos_em timestamptz not null default now(),
  criado_em timestamptz not null default now()
);

create table public.empresas (
  usuario_id uuid primary key references auth.users (id) on delete cascade, -- uma empresa por conta no MVP
  uf char(2) not null check (uf ~ '^[A-Z]{2}$'),
  municipio integer not null check (municipio between 1000000 and 9999999), -- código IBGE
  regime text not null check (regime in ('regular', 'simples', 'mei')),
  cnpj char(14) check (cnpj ~ '^[0-9]{14}$'),
  razao_social text check (char_length(razao_social) between 1 and 150),
  atualizado_em timestamptz not null default now()
);

alter table public.perfis enable row level security;
alter table public.empresas enable row level security;

revoke all on public.perfis, public.empresas from public, anon, authenticated;
grant select, insert on public.perfis to authenticated;
grant select, insert, update, delete on public.empresas to authenticated;
grant all on public.perfis, public.empresas to service_role;

create policy perfil_do_proprio_usuario on public.perfis
  for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

create policy empresa_do_proprio_usuario on public.empresas
  for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

-- Apagar a própria conta (T13). Roda como dono da função para poder apagar em auth.users,
-- mas só apaga a linha de quem chamou. As tabelas acima somem junto (on delete cascade).
create function public.apagar_minha_conta()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'sem login';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.apagar_minha_conta() from public, anon;
grant execute on function public.apagar_minha_conta() to authenticated;

comment on table public.perfis is 'Aceite dos termos e da privacidade por conta (T13).';
comment on table public.empresas is 'Cadastro mínimo da empresa, uma por conta (T15). CNPJ e razão social opcionais.';
