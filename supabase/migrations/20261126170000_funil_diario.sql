-- T22: funil medido sem dados pessoais.
-- Guardamos SÓ um contador por dia e por etapa (ex.: 2027-01-10 · calculo_gratis · 37).
-- Nada de IP, cookie, e-mail ou identificador de visitante: não dá para saber quem foi.
-- O site chama a função contar_evento(); ninguém de fora consegue ler a tabela.

create table public.funil_diario (
  dia date not null,
  evento text not null check (evento in ('visita', 'calculo_gratis', 'cadastro', 'assinatura', 'cancelamento')),
  total integer not null default 0 check (total >= 0),
  primary key (dia, evento)
);

alter table public.funil_diario enable row level security;
revoke all on public.funil_diario from public, anon, authenticated;
grant all on public.funil_diario to service_role;

-- Soma 1 no contador de hoje (horário de Brasília). Roda como dono da tabela, mas só faz isso.
create function public.contar_evento(evento text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.funil_diario (dia, evento, total)
  values ((now() at time zone 'America/Sao_Paulo')::date, contar_evento.evento, 1)
  on conflict (dia, evento) do update set total = public.funil_diario.total + 1;
$$;

revoke all on function public.contar_evento(text) from public;
grant execute on function public.contar_evento(text) to anon, authenticated, service_role;

-- Leitura para o Mateus no SQL Editor: etapas por semana, lado a lado.
create view public.funil_semanal with (security_invoker = true) as
select
  date_trunc('week', dia)::date as semana,
  sum(total) filter (where evento = 'visita') as visitas,
  sum(total) filter (where evento = 'calculo_gratis') as calculos_gratis,
  sum(total) filter (where evento = 'cadastro') as cadastros,
  sum(total) filter (where evento = 'assinatura') as assinaturas,
  sum(total) filter (where evento = 'cancelamento') as cancelamentos
from public.funil_diario
group by 1
order by 1 desc;

revoke all on public.funil_semanal from public, anon, authenticated;
grant select on public.funil_semanal to service_role;

comment on table public.funil_diario is 'Funil (T22): só contadores por dia e etapa, sem nenhum dado pessoal.';
comment on view public.funil_semanal is 'Funil por semana (T22). Consultar no SQL Editor: select * from funil_semanal;';
