# Quem pode usar o quê (matriz de acesso, T37)

O site decide **no servidor** quem pode usar cada recurso. A tela só mostra o que o servidor decidiu: esconder um botão nunca é a proteção. A regra fica num lugar só, `site/src/lib/acesso-regras.ts` (testada em `acesso.test.ts`), e é aplicada por `site/src/lib/acesso.ts`.

## O modo do site (`MODO_ACESSO`, na Vercel)

| Valor | O que acontece com a importação de notas | Quando usar |
|---|---|---|
| `previa` | aberta a todos, até **20 notas por vez** e 6 lotes a cada 10 minutos por IP; aviso de prévia na tela; assinatura não é vendida | agora, antes de abrir a assinatura (escolha deliberada) |
| `assinatura` | só assinante com pagamento em dia; precisa de `ASAAS_API_KEY`, `SUPABASE_URL` e `SUPABASE_SECRET_KEY` | depois de testar o Asaas (Lançamento 2) |
| `fechado` | ninguém importa | manutenção ou emergência |
| vazio | `assinatura` se a cobrança estiver configurada; senão `fechado` | padrão seguro |

**Chave faltando nunca abre a importação.** Antes do T37, faltar a chave do Asaas deixava `/importar` aberto sem ninguém ter escolhido isso. Agora, sem chave, a importação fica fechada; a prévia só existe se alguém escrever `MODO_ACESSO=previa`. Um valor desconhecido também fecha, e o servidor deixa um aviso no log (nunca na tela).

Mudar a variável na Vercel só vale depois de um novo deploy (Vercel > Deployments > Redeploy).

## A matriz

| Recurso | Visitante | Conta grátis | Assinante em dia | Configuração faltando ou banco fora do ar |
|---|---|---|---|---|
| Simulação de uma venda (`/`, `/api/calcular`) | ✅ grátis | ✅ grátis | ✅ grátis | ✅ segue no ar (não depende do banco nem do Asaas) |
| Importar notas, modo `previa` | ✅ até 20 notas | ✅ até 20 notas | ✅ até 500 notas | ✅ prévia (não precisa do banco) |
| Importar notas, modo `assinatura` | ❌ 401 "Entre na sua conta" | ❌ 402 "é para assinantes" → `/conta` | ✅ até 500 notas por lote, 50 por pedido | ❌ 503 "Não conseguimos conferir a sua assinatura agora" |
| Importar notas, modo `fechado` | ❌ 503 → "Simular uma venda" | ❌ 503 | ❌ 503 | ❌ 503 |
| Assinar (`POST /api/assinatura`) | ❌ 401 | só no modo `assinatura` | já assinante: 409 | ❌ 503 |
| Cancelar (`DELETE /api/assinatura`) | ❌ 401 | ✅ em **qualquer** modo, se a cobrança estiver configurada | ✅ | ❌ 503; apagar a conta fica bloqueado se houver assinatura viva |
| Histórico (T18, PR #6) | ❌ | conta logada, só as próprias linhas (RLS) | ✅ | ❌ |
| Relatório do período (T27) | a definir no T27, seguindo o modo de importação | | | |

Situações de assinatura (veja `assinatura.ts`): "pendente" (esperando o 1º pagamento), "atrasada" depois do vencimento e "suspensa" (estorno) **não** dão acesso; "cancelada" com dias pagos sobrando **dá** acesso até o fim desses dias.

## Para a tela: `GET /api/acesso`

Devolve `{ situacao, limiteNotas, mensagem, proximoPasso, vendeAssinatura, cancelamentoDisponivel }`, com o token do login quando houver. Não devolve nomes de variáveis nem detalhes de configuração. `situacao` é uma de `liberado`, `previa`, `entrar`, `assinar`, `indisponivel`. Usado por `PortaoAssinante.tsx` (página `/importar`) e pela página da conta. Se a pergunta falhar, a tela mostra "indisponível", nunca "liberado".

## Limites

- Os limites de volume (20 notas na prévia, 50 por pedido, 500 por lote) valem no servidor e na tela.
- Os limites por IP ficam na memória de cada instância da Vercel (veja `docs/seguranca.md`); a barreira global é a regra do Firewall da Vercel.
- **Suposição:** 20 notas por vez bastam para alguém testar a prévia com um dia de vendas. Ajuste em `LIMITE_NOTAS_PREVIA`.
