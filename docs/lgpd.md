# LGPD: como o site trata dados pessoais

Avaliação e registro feitos em 28/11/2026, quando o Mateus pediu que **todo o trabalho siga a LGPD (Lei 13.709/2018) e requisitos mínimos de segurança**. Este arquivo é, ao mesmo tempo:

1. o **registro das operações de tratamento** (art. 37), que a ANPD pode pedir;
2. a **regra para agentes e pessoas**: antes de criar uma tabela, um campo, um serviço novo ou um envio de dados, leia a seção 7.

A fonte única do inventário no código é `site/src/lib/privacidade.ts` (lida pela página `/privacidade` e pelo "Baixar meus dados"). Mudou um fluxo? Mude lá, aqui e suba `VERSAO_TERMOS` em `site/src/lib/contas.ts`.

**Suposição:** este texto é técnico e não substitui revisão de advogado (pendência do T21). Nenhuma revisão jurídica foi feita.

## 1. Avaliação: o que já estava bom e o que faltava

| Princípio (art. 6º) | Antes (27/11) | Agora |
|---|---|---|
| Finalidade e adequação | Cada dado tinha uso claro, mas a política não dizia a finalidade de cada um | Finalidade de cada tratamento escrita na política e aqui (T40) |
| Necessidade (minimização) | Bom: simulação sem dado pessoal, XML lido no navegador, cliente final descartado, CNPJ opcional, funil só com totais, buscas sem IP | Mantido; regra da seção 7 para não piorar |
| Livre acesso | Faltava: a pessoa não tinha como ver tudo o que guardamos | **Baixar meus dados** em Minha conta (T41) |
| Qualidade | Empresa editável | Mantido; troca de e-mail pelo contato |
| Transparência | Política em rascunho, sem base legal, sem operadores, sem prazos completos, sem canal | Política reescrita com base legal, prazo, local e operadores de cada dado (T40) |
| Segurança e prevenção | Revisão severa no PR #28 (RLS, chaves só no servidor, limites, cabeçalhos) | Mantido; plano de incidente na seção 6 |
| Não discriminação | Não há decisão automatizada sobre pessoas | Mantido |
| Responsabilização | Faltava registro das operações e prova do aceite de cada versão | Este arquivo + histórico de aceites + contadores de pedidos atendidos (T41) |
| Retenção (art. 15 e 16) | Buscas 30 dias, avisos do Asaas 60 dias; contas sem prazo | Contas inativas há 24 meses apagadas sozinhas (T42) |

## 2. Registro das operações de tratamento (art. 37)

Controlador: **Decisão do T40** (quem é: o Mateus como pessoa física ou uma empresa dele, com CNPJ). Até lá, a página diz que a identificação será publicada antes de abrir as contas. Variável `CONTROLADOR_NOME` na Vercel.

| Tratamento | Titulares | Dados | Finalidade | Base legal | Retenção | Onde / operador |
|---|---|---|---|---|---|---|
| Simulação grátis | visitantes | atividade, valor, cidade (nenhum dado pessoal) | calcular | não é dado pessoal | não guarda; UF/cidade no navegador | Vercel `gru1` |
| Buscas sem resultado | visitantes | termo buscado, versão, data | melhorar dicionário | legítimo interesse | 30 dias (cron diário) | Supabase `sa-east-1` |
| Funil | visitantes | total por dia e etapa | medir desistência | legítimo interesse (anônimo) | sem prazo (não identifica) | Supabase |
| Registros de acesso | visitantes | IP, data, página, navegador | segurança e rate limit | legítimo interesse | memória: 1 min; logs: prazo do plano Vercel/Supabase | Vercel, Supabase |
| Erros técnicos | visitantes | mensagem e página (sem PII) | corrigir falhas | legítimo interesse | prazo do plano Sentry | Sentry (fora do Brasil) |
| Conta | clientes | e-mail, datas, provedor de login | entrar e separar dados | contrato | até apagar; 24 meses sem acesso | Supabase Auth; provedor SMTP; Google (opcional) |
| Aceites | clientes | versão e data de cada aceite | provar o combinado | contrato | até apagar a conta | Supabase (`perfis`, `aceites_termos`) |
| Empresa | clientes | UF, cidade, regime, CNPJ e razão social opcionais | preencher cálculos | contrato | até apagar | Supabase (`empresas`) |
| Histórico | clientes | resultados; nas notas: data, número, cidade, itens (sem cliente final) | reabrir e comparar | contrato | até apagar o cálculo ou a conta | Supabase (`calculos`) |
| Assinatura | clientes | ids do Asaas, situação, valor, validade; no Asaas: nome, CPF/CNPJ, e-mail | cobrar e liberar acesso | contrato; no Asaas também obrigação legal | site: até apagar; Asaas: prazo legal (em geral 5 anos) | Supabase (`assinaturas`), Asaas |
| Atendimento | quem escreve | conteúdo do e-mail | responder e provar atendimento | exercício regular de direitos | até 5 anos do último contato | caixa do `CONTATO_EMAIL` |
| Pedidos atendidos | ninguém identificado | total por dia de contas apagadas e dados baixados | provar atendimento (art. 6º, X) | obrigação de responsabilização | sem prazo (não identifica) | Supabase (`lgpd_registro`) |

Transferência internacional (art. 33): os dados das contas ficam no Brasil (Supabase São Paulo, funções da Vercel em `gru1`, Asaas). Saem do país: avisos de erro (Sentry), entrega dos e-mails de login (provedor SMTP) e, se a pessoa escolher, o login Google. Base: garantias contratuais dos fornecedores (Resolução CD/ANPD nº 19/2024). **Suposição:** os termos de cada fornecedor cobrem isso; conferir no T40.

## 3. Direitos do titular (art. 18) e como atender

| Direito | Como a pessoa exerce | Como atender pelo contato |
|---|---|---|
| Confirmação e acesso | Minha conta → Baixar meus dados | Pedir que escreva do e-mail da conta; rodar a consulta da seção 5 |
| Correção | Minha conta → Dados da empresa | E-mail: Supabase → Authentication → Users → trocar e-mail |
| Anonimização, bloqueio ou eliminação | Apagar cálculo ou conta (imediato) | Supabase → Authentication → Users → Delete user (cascata). Antes, cancelar a assinatura no Asaas |
| Portabilidade | Baixar meus dados (JSON) | Mesmo arquivo |
| Informação sobre compartilhamento | Política, seção "Com quem compartilhamos" | — |
| Revogação de consentimento | Não usamos consentimento como base hoje | Se um dia usar (ex.: newsletter), criar opção de sair |
| Oposição e revisão | Pelo contato | Avaliar e responder |

Prazo de resposta: **até 15 dias** (art. 19, II). Registrar cada pedido atendido na caixa do contato.

## 4. Retenção (T42)

- Contas sem nenhum acesso há **24 meses** e sem assinatura viva ou com acesso válido: apagadas no dia 1º de cada mês (função `apagar_contas_inativas()` no `pg_cron`). Tudo da conta some junto. **Decisão do T42:** o prazo de 24 meses é proposta; mudar exige mudar o SQL, `MESES_INATIVIDADE` e a política.
- Buscas sem resultado: 30 dias. Avisos do Asaas: 60 dias. Funil e `lgpd_registro`: só totais, sem prazo.
- **Limitação:** a conta é apagada sem aviso prévio por e-mail (o site ainda não tem envio de e-mail transacional). Futuro: avisar 30 dias antes.
- **Pendência (Decisão do T40):** o Marco Civil da Internet (Lei 12.965/2014, art. 15) obriga provedores de aplicação constituídos como **pessoa jurídica** com fins econômicos a guardar registros de acesso (IP, data e hora) por 6 meses. Hoje o site não guarda isso além do que a Vercel e o Supabase mantêm. Se o produto for operado por uma empresa, avaliar com advogado e, se preciso, ligar a retenção de logs (Vercel Log Drains ou similar) com acesso restrito.

## 5. Consultas úteis (SQL Editor, só o Mateus)

```sql
-- pedidos atendidos por mês
select date_trunc('month', dia)::date as mes, tipo, sum(total) from public.lgpd_registro group by 1, 2 order by 1 desc;
-- dados de uma conta (pedido pelo contato). Troque o e-mail.
select u.id, u.email, u.created_at, u.last_sign_in_at,
       (select json_agg(a) from public.aceites_termos a where a.usuario_id = u.id) as aceites,
       (select row_to_json(e) from public.empresas e where e.usuario_id = u.id) as empresa,
       (select row_to_json(s) from public.assinaturas s where s.usuario_id = u.id) as assinatura,
       (select count(*) from public.calculos c where c.usuario_id = u.id) as calculos
from auth.users u where u.email = 'pessoa@exemplo.com';
```

## 6. Plano de resposta a incidente (art. 48)

Incidente = alguém de fora acessou, vazou, alterou ou apagou dados pessoais (ex.: chave secreta vazada, falha de RLS, conta do Supabase invadida).

1. **Conter (na hora):** trocar a chave vazada (Supabase → API Keys; Asaas → Integrações; Vercel → Environment Variables) e fazer redeploy; se for falha de código, reverter o deploy na Vercel.
2. **Entender (até 24 h):** o que vazou, de quantas contas, desde quando. Guardar prints e logs.
3. **Avaliar o risco:** dado de pagamento, CNPJ/CPF ou histórico de muitas contas = risco relevante.
4. **Comunicar (até 3 dias úteis do conhecimento, Resolução CD/ANPD nº 15/2024):** formulário de comunicação de incidente no site da ANPD e e-mail às pessoas afetadas, em linguagem simples: o que aconteceu, quais dados, o que fizemos e o que elas devem fazer.
5. **Registrar:** data, causa, dados, contas, comunicações e correção, num arquivo `docs/incidentes/AAAA-MM-DD.md` (sem dados pessoais). A ANPD pede guardar esse registro por 5 anos.

## 7. Regra para quem mexe no projeto (privacidade desde a concepção)

Antes de abrir um PR que trate dado pessoal:

- **Precisa mesmo?** Se dá para fazer sem o dado, ou com ele só no navegador, faça assim (como o XML).
- **Novo dado ou serviço?** Atualize `site/src/lib/privacidade.ts`, a seção 2 deste arquivo e suba `VERSAO_TERMOS` (quem tem conta aceita de novo).
- **Tabela nova com dado de conta:** `usuario_id ... on delete cascade`, RLS ligada, só as permissões necessárias e entrar no "Baixar meus dados" (`site/src/lib/lgpd-navegador.ts`).
- **Prazo:** todo dado guardado tem prazo ou some com a conta. Registros temporários têm limpeza no `pg_cron`.
- **Logs e erros:** nunca mandar e-mail, CPF/CNPJ, token ou conteúdo de nota para `console`, Sentry ou serviço externo.
- **Arquivos gerados (relatórios, planilhas):** gerar no navegador ou entregar só para a própria conta; nada de link público permanente.
- **Segurança mínima:** seguir `docs/seguranca.md` (chaves só no servidor, RLS, limites de tamanho e de pedidos).

## 8. O que o Mateus precisa decidir ou fazer

Também em `PARA-FAZER-MATEUS.txt`:

1. Rodar o SQL `supabase/migrations/20261128120000_lgpd.sql` no SQL Editor (depois do `20261127210000_revisao_seguranca.sql`).
2. **Decisão do T40:** quem é o controlador (nome ou empresa e CNPJ) → `CONTROLADOR_NOME` na Vercel.
3. Criar o `CONTATO_EMAIL` (e-mail do produto) na Vercel: é também o canal de privacidade.
4. **Decisão do T42:** confirmar 24 meses para apagar contas inativas.
5. Revisão de advogado da política e dos termos (T21), incluindo o ponto do Marco Civil (seção 4).
