/** T19: conteúdo editorial versionado. Fontes e revisão em docs/conteudo.md. */
export const FONTES = {
  lei: { titulo: "LC 214/2025, texto atualizado", url: "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm" },
  transicao: { titulo: "Receita Federal: entenda a reforma", url: "https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/reforma-tributaria-do-consumo/entenda" },
  simples: { titulo: "Receita Federal: mudanças no Simples Nacional", url: "https://www8.receita.fazenda.gov.br/SimplesNacional/noticias/NoticiaCompleta.aspx?id=e595d010-1e04-4c3b-95d9-185fc58594b5" },
  nfe: { titulo: "Portal NF-e: tabelas de classificação tributária", url: "https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?AspxAutoDetectCookieSupport=1&tipoConteudo=%2FNJarYc9nus%3D" },
  informe: { titulo: "Portal NF-e: Informe Técnico 2025.002", url: "https://www.nfe.fazenda.gov.br/portal/exibirArquivo.aspx?AspxAutoDetectCookieSupport=1&conteudo=RkY7TWxNDgU%3D" },
  glossario: { titulo: "Receita Federal: glossário da reforma (maio de 2026)", url: "https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/manuais/reforma-tributaria-do-consumo/glossario-rtc-versao-iii-maio-de-2026.pdf/@@download/file" },
  motor: { titulo: "Receita Federal: código da calculadora de regime regular", url: "https://github.com/ReceitaFederal/calculadora-rtc-regime-regular" },
} as const;

export type Fonte = keyof typeof FONTES;
export type Secao = { titulo: string; paragrafos: string[]; fontes?: Fonte[] };
export type Artigo = {
  slug: string;
  titulo: string;
  descricao: string;
  atualizadoEm: string;
  secoes: Secao[];
};

export const ARTIGOS: Artigo[] = [
  {
    slug: "como-calcular-cbs-e-ibs",
    titulo: "Como calcular CBS e IBS de uma venda",
    descricao: "Entenda a base de cálculo, o enquadramento da operação e o que conferir no resultado da simulação.",
    atualizadoEm: "2026-11-25",
    secoes: [
      { titulo: "Comece pela operação", paragrafos: [
        "Para simular uma venda, informe o produto ou serviço, o valor e o município solicitado no formulário. A busca sugere uma classificação tributária. Confira se a descrição corresponde ao que você vende: atividades parecidas podem ter tratamentos diferentes.",
        "O site cobre operações do regime regular. Ele usa um porte em TypeScript da calculadora publicada pela Receita Federal, conferido por testes de comparação. A versão do motor aparece no resultado.",
      ], fontes: ["motor"] },
      { titulo: "Confira a base e a alíquota efetiva", paragrafos: [
        "Na conta percentual básica, o tributo é a base de cálculo multiplicada pela alíquota efetiva. Essa alíquota considera a redução aplicável à operação. Regimes específicos e ajustes da base exigem regras próprias, por isso o enquadramento faz diferença.",
        "O resultado da calculadora mostra CBS, IBS estadual e IBS municipal separadamente. Abra a memória de cálculo para conferir os valores usados, a redução e o fundamento legal. A versão da tabela permite identificar quais alíquotas entraram na simulação.",
      ], fontes: ["lei", "motor"] },
      { titulo: "Use o resultado para planejar", paragrafos: [
        "Guarde as informações da operação e leve o resultado ao contador. O valor de uma venda simulada não fecha a apuração mensal da empresa: a versão atual do site não desconta créditos de compras nem calcula todos os tributos do negócio.",
        "Se o motor recusar o item, revise o motivo apresentado. Mudar o código apenas para obter uma redução pode produzir um enquadramento incorreto.",
      ] },
    ],
  },
  {
    slug: "quanto-vou-pagar-em-2027",
    titulo: "Quanto vou pagar de CBS e IBS em 2027?",
    descricao: "Veja por que o valor depende das operações, do regime da empresa e dos créditos das compras.",
    atualizadoEm: "2026-11-25",
    secoes: [
      { titulo: "Separe venda e apuração do mês", paragrafos: [
        "A calculadora estima CBS e IBS sobre uma venda. Para saber quanto a empresa recolherá no mês, também é preciso considerar os créditos admitidos, ajustes e o regime de apuração. A soma das simulações não equivale automaticamente à guia de pagamento.",
        "O tipo de operação influencia o tratamento tributário. Antes de comparar cenários, confira com o contador o produto ou serviço, a classificação e as condições para qualquer redução.",
      ], fontes: ["lei", "glossario"] },
      { titulo: "Confira as premissas de 2027", paragrafos: [
        "A tabela de alíquotas do site está versionada e, nesta revisão, usa uma hipótese provisória de CBS para 2027. O resultado informa o percentual utilizado, seu status e as fontes. Use essas informações ao comparar uma simulação antiga com uma nova.",
        "Evite transformar uma estimativa em preço definitivo sem revisar as premissas. Alterações de alíquota ou de enquadramento podem mudar o resultado. A documentação da tabela mantém as pendências de conferência.",
      ] },
      { titulo: "Monte um cenário com seus dados", paragrafos: [
        "Separe vendas representativas do seu negócio e simule cada atividade. Identifique quais itens a ferramenta consegue calcular e quais exigem análise específica. Depois reúna os documentos de compras para o contador avaliar os créditos.",
        "O simulador atual não apura o DAS do Simples Nacional, não compara toda a carga tributária anterior com a nova e não promete economia. O resultado ajuda a discutir uma operação concreta.",
      ] },
    ],
  },
  {
    slug: "linha-do-tempo-2026-a-2033",
    titulo: "Reforma tributária: linha do tempo de 2026 a 2033",
    descricao: "Acompanhe a entrada de CBS e IBS e a substituição gradual dos tributos sobre o consumo.",
    atualizadoEm: "2026-11-25",
    secoes: [
      { titulo: "2026: fase de teste", paragrafos: [
        "A transição começa com testes de CBS e IBS. A legislação prevê tratamento próprio para o recolhimento e para o cumprimento das obrigações acessórias nessa etapa. A empresa deve acompanhar as orientações aplicáveis aos seus documentos fiscais.",
      ], fontes: ["transicao"] },
      { titulo: "2027 e 2028: CBS e início do IBS", paragrafos: [
        "A CBS substitui PIS e Cofins. O IBS tem cobrança de transição de 0,1%, enquanto a CBS tem redutor de 0,1 ponto percentual. O Imposto Seletivo começa em 2027. O IPI tem alíquotas reduzidas a zero, preservadas as exceções ligadas à Zona Franca de Manaus.",
      ], fontes: ["transicao"] },
      { titulo: "2029 a 2032: substituição gradual", paragrafos: [
        "O IBS avança enquanto ICMS e ISS são reduzidos gradualmente. A convivência dos tributos exige conferir o ano da operação ao planejar preços e configurar a emissão de notas.",
      ], fontes: ["transicao"] },
      { titulo: "2033: conclusão da transição do consumo", paragrafos: [
        "O novo modelo passa a valer integralmente, com a extinção de ICMS e ISS. Esse calendário trata da substituição dos tributos sobre o consumo; não significa o fim de todos os impostos pagos pela empresa.",
        "A calculadora deste site está preparada para as alíquotas de 2027 cadastradas na sua tabela. Ela não projeta automaticamente a carga de todos os anos da transição.",
      ], fontes: ["transicao"] },
    ],
  },
  {
    slug: "reforma-no-simples-nacional",
    titulo: "O que a reforma muda no Simples Nacional",
    descricao: "Entenda a permanência no Simples, a opção pelo regime regular de CBS e IBS e os limites desta calculadora.",
    atualizadoEm: "2026-11-25",
    secoes: [
      { titulo: "O Simples continua", paragrafos: [
        "A reforma incorpora CBS e IBS ao Simples Nacional. A empresa pode permanecer no regime e, observadas as regras de opção, recolher esses dois tributos pelo regime regular, fora do DAS. Essa possibilidade é conhecida como Simples híbrido.",
      ], fontes: ["simples"] },
      { titulo: "As escolhas têm efeitos diferentes", paragrafos: [
        "Ingressar no Simples e escolher a apuração regular de CBS e IBS são decisões distintas. Antes de optar, o contador precisa avaliar as compras, os clientes e as regras de crédito. O perfil da operação influencia o efeito da escolha.",
        "Consulte o Portal do Simples Nacional para os prazos atuais e os procedimentos de opção e renúncia. Os calendários podem ser alterados por novas resoluções; este artigo não recebe nem formaliza pedidos.",
      ], fontes: ["simples", "lei"] },
      { titulo: "O que o simulador consegue mostrar", paragrafos: [
        "Este site calcula operações do regime regular. Não apura o DAS, não calcula as faixas do Simples e não escolhe o regime mais vantajoso para a empresa. Uma simulação isolada de CBS e IBS não é uma comparação completa entre regimes.",
        "Se sua empresa é do Simples, use os artigos para entender os termos e leve as dúvidas ao contador antes de usar o resultado no planejamento tributário.",
      ] },
    ],
  },
  {
    slug: "o-que-e-cclasstrib",
    titulo: "O que é cClassTrib e por que ele importa",
    descricao: "Entenda a classificação tributária de CBS e IBS e os cuidados ao escolher o código da operação.",
    atualizadoEm: "2026-11-25",
    secoes: [
      { titulo: "Um código para o tratamento tributário", paragrafos: [
        "O cClassTrib identifica a classificação tributária de CBS e IBS de um item do documento fiscal. A tabela associa o código à descrição do tratamento e a indicadores usados no preenchimento e na validação da nota.",
        "Ele deve ser interpretado junto com o CST de CBS e IBS e com as características da operação. A descrição comercial, sozinha, pode não ser suficiente para definir o enquadramento.",
      ], fontes: ["informe"] },
      { titulo: "Confira a tabela e a vigência", paragrafos: [
        "O Portal NF-e publica as tabelas oficiais e suas atualizações. Ao revisar uma nota ou configurar o emissor, confira a versão aplicável, a descrição do código e as condições previstas na legislação.",
        "A busca por atividades deste site usa um dicionário próprio para sugerir códigos. A sugestão facilita a simulação e precisa ser conferida antes de ser usada em uma nota fiscal.",
      ], fontes: ["nfe"] },
      { titulo: "Quando o código não combina com o item", paragrafos: [
        "A calculadora pode recusar uma combinação de produto ou serviço e classificação. Leia o motivo exibido e confira os códigos com o contador. Escolher um código diferente apenas para conseguir um cálculo pode esconder um erro de classificação.",
        "A memória de cálculo e a versão do motor ajudam a reproduzir a simulação. Elas não substituem a análise das condições legais da operação.",
      ], fontes: ["motor"] },
    ],
  },
];

export const GLOSSARIO: { id: string; termo: string; definicao: string; fontes: Fonte[] }[] = [
  { id: "cbs", termo: "CBS", definicao: "Contribuição sobre Bens e Serviços, de competência federal. Substitui PIS e Cofins na transição da reforma do consumo.", fontes: ["transicao"] },
  { id: "ibs", termo: "IBS", definicao: "Imposto sobre Bens e Serviços, de competência compartilhada entre estados, municípios e Distrito Federal. Substitui ICMS e ISS gradualmente.", fontes: ["transicao"] },
  { id: "is", termo: "IS", definicao: "Imposto Seletivo. Tributo federal sobre bens e serviços prejudiciais à saúde ou ao meio ambiente, nas hipóteses previstas em lei.", fontes: ["lei"] },
  { id: "credito", termo: "Crédito", definicao: "Valor que o contribuinte pode aproveitar para abater débitos de CBS ou IBS quando atende às condições legais. Uma compra não gera crédito aproveitável automaticamente.", fontes: ["glossario"] },
  { id: "nao-cumulatividade", termo: "Não cumulatividade", definicao: "Sistema que permite descontar créditos admitidos de etapas anteriores dos débitos das operações seguintes, evitando a cobrança acumulada ao longo da cadeia.", fontes: ["glossario"] },
  { id: "split-payment", termo: "Split payment", definicao: "Recolhimento em que o valor do tributo é separado na liquidação financeira do pagamento. A aplicação depende das regras e das etapas de implementação; não significa separar imposto em todo pagamento desde já.", fontes: ["lei"] },
  { id: "aliquota-de-referencia", termo: "Alíquota de referência", definicao: "Percentual de referência fixado por resolução do Senado conforme as regras legais. A alíquota efetiva de uma operação pode ser diferente, por exemplo quando há redução prevista para aquele enquadramento.", fontes: ["lei"] },
];

export function artigoPorSlug(slug: string): Artigo | undefined {
  return ARTIGOS.find((artigo) => artigo.slug === slug);
}
