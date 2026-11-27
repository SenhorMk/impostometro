# Evidências do T33

Capturas de 26/11/2026. A referência anterior veio do domínio público `calculareforma.mkautobots.site`; as demais foram feitas no build de produção local, servido com `next start`, em Chromium. Elas não comprovam deploy da revisão.

- [Apresentação anterior](antes-desktop.jpg).
- [Apresentação revisada em computador](depois-desktop.jpg), viewport 1366 × 900.
- [Página revisada no celular](depois-360.jpg), viewport 360 × 800.
- [Simulação no celular](resultado-mobile.jpg), viewport 390 × 844; dados sintéticos de pizzaria, R$ 1.000 em São Paulo.

Conferidos 360, 390 e 1366 px sem rolagem horizontal. Jornada: chamada principal → busca de pizzaria → escolha da atividade → valor/cidade → cálculo → resultado de R$ 67,80 → memória de cálculo. O disclosure abriu por Enter. A posição do resultado ficou abaixo do cabeçalho fixo após ajuste da margem de rolagem.

Também foram conferidos o exemplo escolar de R$ 54,24, a abertura de versões/fontes (motor 1.7.2, tabela V0073 e alíquotas 2026-11-25), a página de contato e a navegação para o importador. Nenhum XML ou mensagem foi enviado. O console do build final não apresentou erros ou avisos nas jornadas observadas.

O CSS carregado contém a regra de movimento reduzido. Não foi adicionada animação nesta entrega; a preferência do sistema não foi alterada ou emulada. Testes de sessão, pagamento e isolamento pertencem aos tickets seguintes.
