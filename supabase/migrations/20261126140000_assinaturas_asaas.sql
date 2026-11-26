-- T14: assinatura mensal pelo Asaas.
-- Quem escreve aqui é só o servidor do site (chave secreta), a partir das respostas e dos
-- avisos (webhooks) do Asaas. A pessoa logada só pode LER a própria assinatura.

create table public.assinaturas (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  asaas_cliente_id text not null,
  asaas_assinatura_id text unique,
  status text not null default 'pendente'
    check (status in ('pendente', 'ativa', 'atrasada', 'cancelada', 'suspensa')),
  valido_ate date, -- até quando o acesso vale (último pagamento + 1 mês + tolerância)
  valor_centavos integer not null check (valor_centavos > 0),
  link_pagamento text,
  atualizado_em timestamptz not null default now()
);

-- Avisos do Asaas já processados: o Asaas pode mandar o mesmo aviso mais de uma vez.
create table public.asaas_eventos (
  id text primary key,
  evento text not null,
  recebido_em timestamptz not null default now()
);

alter table public.assinaturas enable row level security;
alter table public.asaas_eventos enable row level security;

revoke all on public.assinaturas, public.asaas_eventos from public, anon, authenticated;
grant select on public.assinaturas to authenticated;
grant all on public.assinaturas, public.asaas_eventos to service_role;

create policy ler_a_propria_assinatura on public.assinaturas
  for select to authenticated
  using (usuario_id = (select auth.uid()));

comment on table public.assinaturas is 'Assinatura mensal (T14). Escrita só pelo servidor (Asaas e webhooks).';
comment on table public.asaas_eventos is 'IDs dos avisos do Asaas já processados, para não processar duas vezes.';

-- Limpeza: avisos com mais de 60 dias não servem mais para evitar repetição (o Asaas guarda 14 dias).
select cron.schedule(
  'remover_asaas_eventos_antigos',
  '27 3 * * *',
  $$delete from public.asaas_eventos where recebido_em < now() - interval '60 days';$$
);
