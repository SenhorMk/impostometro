-- T22: mais etapas no funil (importação e relatório) e um aviso de "poucos dados".
-- Rodar UMA vez no SQL Editor do Supabase, depois do 20261127210000_revisao_seguranca.sql.
-- Pode rodar de novo sem estragar nada. Continua sem nenhum dado pessoal: só "dia · etapa · total".
--
-- Etapas novas (contadas pelo navegador, como "visita" e "cálculo grátis"):
--   importacao_inicio    = alguém escolheu arquivos XML para importar
--   importacao_resultado = um lote de notas foi calculado e o total apareceu
--   relatorio            = alguém gerou o PDF ou a planilha do relatório (T27)
-- "assinatura" e "cancelamento" continuam só pelo servidor (confirmação do Asaas).

do $$
declare
  nome text;
begin
  for nome in
    select c.conname from pg_constraint c
    where c.conrelid = 'public.funil_diario'::regclass and c.contype = 'c' and pg_get_constraintdef(c.oid) like '%evento%'
  loop
    execute format('alter table public.funil_diario drop constraint %I', nome);
  end loop;
end;
$$;

alter table public.funil_diario add constraint funil_diario_evento_check check (
  evento in ('visita', 'calculo_gratis', 'cadastro', 'assinatura', 'cancelamento', 'importacao_inicio', 'importacao_resultado', 'relatorio')
);

-- Colunas novas vão no fim (create or replace view não deixa mudar a ordem das antigas).
create or replace view public.funil_semanal with (security_invoker = true) as
select
  date_trunc('week', dia)::date as semana,
  sum(total) filter (where evento = 'visita') as visitas,
  sum(total) filter (where evento = 'calculo_gratis') as calculos_gratis,
  sum(total) filter (where evento = 'cadastro') as cadastros,
  sum(total) filter (where evento = 'assinatura') as assinaturas,
  sum(total) filter (where evento = 'cancelamento') as cancelamentos,
  sum(total) filter (where evento = 'importacao_inicio') as importacoes_iniciadas,
  sum(total) filter (where evento = 'importacao_resultado') as importacoes_calculadas,
  sum(total) filter (where evento = 'relatorio') as relatorios,
  case
    when coalesce(sum(total) filter (where evento = 'visita'), 0) < 100
      then 'Poucos dados nesta semana (menos de 100 visitas): não dá para concluir nada sobre preço ou produto.'
    else 'Contagens de eventos, não de pessoas: compare tendências, não números exatos.'
  end as leitura
from public.funil_diario
group by 1
order by 1 desc;

revoke all on public.funil_semanal from public, anon, authenticated;
grant select on public.funil_semanal to service_role;

comment on view public.funil_semanal is 'Funil por semana (T22), com importação, relatório e um aviso de leitura. select * from funil_semanal;';
