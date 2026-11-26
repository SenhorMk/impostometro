-- T10: coleta sem login; inserção limitada, leitura somente administrativa.
create table public.buscas_sem_resultado (
  id bigint generated always as identity primary key,
  termo text not null check (char_length(termo) between 2 and 120),
  versao_tabela text not null check (versao_tabela ~ '^V[0-9]{1,12}$'),
  data_simulacao date not null,
  criado_em timestamptz not null default now(),
  constraint termo_normalizado check (termo = lower(btrim(termo))),
  constraint sem_contato_explicito check (termo !~ '[@:/\\]' and termo !~ '[0-9]{10,}')
);

create index buscas_sem_resultado_criado_em_idx
  on public.buscas_sem_resultado (criado_em);

alter table public.buscas_sem_resultado enable row level security;

revoke all on public.buscas_sem_resultado from public, anon, authenticated;
revoke all on sequence public.buscas_sem_resultado_id_seq from public, anon, authenticated;
grant insert (termo, versao_tabela, data_simulacao)
  on public.buscas_sem_resultado to anon;
grant usage on sequence public.buscas_sem_resultado_id_seq to anon;
grant select, insert, update, delete on public.buscas_sem_resultado to service_role;
grant usage, select on sequence public.buscas_sem_resultado_id_seq to service_role;

create policy registrar_busca_sem_identificacao
  on public.buscas_sem_resultado for insert to anon
  with check (
    char_length(termo) between 2 and 120
    and termo = lower(btrim(termo))
    and termo !~ '[@:/\\]'
    and termo !~ '[0-9]{10,}'
    and versao_tabela ~ '^V[0-9]{1,12}$'
    and data_simulacao = greatest((now() at time zone 'UTC')::date, date '2027-01-01')
  );

comment on table public.buscas_sem_resultado is
  'Termos sem correspondência para melhorar o dicionário. Sem identificador de visitante. Retenção de 30 dias.';

-- Limpeza diária: elimina somente registros desta tabela com mais de 30 dias.
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule(
  'remover_buscas_sem_resultado_antigas',
  '17 3 * * *',
  $$delete from public.buscas_sem_resultado where criado_em < now() - interval '30 days';$$
);
