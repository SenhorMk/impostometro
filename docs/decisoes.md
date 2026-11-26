# Decisões

Registro curto do que foi decidido, quando e por quê. Novas decisões entram no topo.

| Data | Decisão | Por quê | Status |
|---|---|---|---|
| 2026-11-25 | Banco do produto separado em ReformaImposto; excluir dois projetos ORBITA e preservar somente Orbita_Staging | pedido e confirmação explícita do Mateus; a limpeza libera uma vaga Free. Painel e API confirmaram as exclusões e staging saudável | limpeza concluída; criação do banco aguarda senha pelo titular e acesso MCP |
| 2026-11-25 | Fallback do T10 consulta tabelas no servidor e preenche somente o dado encontrado | NCM/NBS exportados não têm descrições; cClassTrib tem. Código isolado não determina enquadramento. Usar o banco existente, respeitar vigência e pedir o campo restante mantém a busca auditável e evita enviar o banco completo ao navegador | implementado; persistência de buscas pendente do T05 |
| 2026-11-25 | Conteúdo do T19 versionado em TypeScript, com páginas geradas no servidor, fontes por seção e data editorial | cinco guias não exigem CMS nem banco; cada revisão pode ser auditada no Git e no PR. Não duplicar alíquotas provisórias nos artigos e manter explícita a revisão contábil pendente | implementado; revisão contábil pendente |
| 2026-11-25 | Documentar cada entrega com ticket, índice, backlog e diário de evidências; manter matriz de skills e fontes | pedido do Mateus para acompanhar a construção do início ao fim, distinguindo implementado, validado, revisado e publicado | adotado a partir do T19 |
| 2026-11-25 | **Calculadora traduzida para TypeScript (porte) e rodando dentro do site.** A oficial em Java fica só no Docker, como referência nos testes e na CI | ideia do Mateus: sem servidor Java não há Fly.io para pagar (~US$ 6,70/mês), nem chave para proteger, nem servidor para cair; o cálculo fica instantâneo. O preço: a cada versão nova da Receita, um agente precisa traduzir as mudanças (de qualquer jeito alguém precisaria atualizar o servidor). A segurança vem da comparação automática: 1.519 pedidos com resposta idêntica à oficial, e a CI reprova qualquer diferença | feito |
| 2026-11-25 | ~~Fly.io com porteiro Caddy e chave~~ | substituído pelo porte acima. Os arquivos (`calculadora/fly.toml`, `calculadora/producao/`) foram apagados e ficam no histórico do git | descartado |
| 2026-11-25 | Nome provisório "Calcula Reforma" | "Impostômetro" é marca conhecida da Associação Comercial de SP | aguardando T04 |
| 2026-11-25 | Preço de marcador R$ 29/mês | só para montar a landing | aguardando T04 |
| 2026-11-25 | CBS 2027 = 11,2%, provisória | TCU calculou 11,3% em 28/10/2026 (11,3468%); 2027 tem redutor de 0,1 p.p. Senado pode mudar até 15/12/2026 | revisar após 15/12/2026 |
| 2026-11-25 | Testes dourados com alíquotas fixas (8,8% / 0,05% / 0,05%) | testam o motor, não a política; não mudam quando a alíquota mudar | feito |
| 2026-11-25 | Busca de atividades no navegador, num dicionário próprio | rápida, sem custo de servidor, e o empresário não sabe o que é NCM/cClassTrib | feito (52 atividades) |
| 2026-11-25 | Build com a imagem oficial do Maven, não o `mvnw` da Receita | o repositório da Receita não traz o `.jar` do Maven Wrapper | feito |
| 2026-11-25 | Calculadora fixada na v1.7.2 por hash de commit | build reproduzível; se a tag mudar, o build falha em vez de pegar outra coisa | feito |
| 2026-11-25 | Site na Vercel, banco/login no Supabase | Supabase junta banco, login e arquivos em São Paulo. (O "motor Java separado" foi trocado pelo porte, acima) | decidido com o Mateus |
| 2026-11-25 | Regime regular primeiro; Simples Nacional depois | a calculadora oficial do Simples ainda só cobre a 1ª faixa | recomendado |
| 2026-11-25 | Fora do escopo: ORBITA | era só um exemplo do Mateus | decidido |
