/**
 * Erros da calculadora: código, título, campo e estado do item.
 *
 * Porte de `api/exceptionhandler/enumeration/ProblemType.java`,
 * `api/exceptionhandler/enumeration/CodigoValidacao.java`,
 * `domain/service/collector/ItemCollector.java` e das mensagens das classes em
 * `domain/service/exception/`. Os textos são copiados da Receita sem mudança,
 * porque o site mostra o `detail` para o usuário quando não tem uma frase própria.
 */
export type EstadoItem =
  | "CALCULADO"
  | "CALCULO_SIMULADO"
  | "INCONSISTENCIA_ENTRADA"
  | "NAO_IMPLEMENTADO"
  | "FALHA_TECNICA";

export type ErroDetalhe = { type: string; title: string; code: string; pointer: string; detail: string };

type Problema = { titulo: string; codigo: string; campo: string | null; estado: EstadoItem };

const I: EstadoItem = "INCONSISTENCIA_ENTRADA";
const F: EstadoItem = "FALHA_TECNICA";

/** Mesmo conteúdo do enum ProblemType (nome da exceção Java → título, código, campo, estado). */
export const PROBLEMAS = {
  CampoInvalido: { titulo: "Campo inválido", codigo: "REG-024", campo: null, estado: I },
  NcmNbsSimultaneas: { titulo: "NCM e NBS informadas simultaneamente", codigo: "REG-001", campo: null, estado: I },
  NcmNaoEncontrada: { titulo: "NCM não encontrada", codigo: "REG-002", campo: "ncm", estado: I },
  NbsNaoEncontrada: { titulo: "NBS não encontrada", codigo: "REG-003", campo: "nbs", estado: I },
  SituacaoTributariaNaoEncontrada: { titulo: "Situação tributária não encontrada", codigo: "REG-004", campo: "cst", estado: I },
  ClassificacaoTributariaNaoEncontrada: { titulo: "Classificação tributária não encontrada", codigo: "REG-005", campo: "cClassTrib", estado: I },
  ClassificacaoTributariaNaoVinculadaSituacaoTributaria: {
    titulo: "Classificação tributária não vinculada à situação tributária", codigo: "REG-006", campo: "cClassTrib", estado: I,
  },
  TratamentoClassificacaoNaoEncontrado: { titulo: "Tratamento de classificação não encontrado", codigo: "REG-008", campo: "cClassTrib", estado: I },
  TributacaoRegularNaoInformada: { titulo: "Grupo de tributação regular não informado", codigo: "REG-009", campo: "tributacaoRegular", estado: I },
  IncompatibilidadeSuspensao: { titulo: "Incompatibilidade com suspensão", codigo: "REG-010", campo: "tributacaoRegular/cClassTrib", estado: I },
  NcmNaoVinculada: { titulo: "NCM não vinculada", codigo: "REG-011", campo: "ncm", estado: I },
  NbsNaoVinculada: { titulo: "NBS não vinculada", codigo: "REG-012", campo: "nbs", estado: I },
  ImpostoSeletivoNaoInformado: { titulo: "Dados do Imposto Seletivo não informados", codigo: "REG-013", campo: "impostoSeletivo", estado: I },
  NcmCompletoNaoInformado: { titulo: "NCM completo não informado", codigo: "REG-015", campo: "ncm", estado: I },
  NbsCompletoNaoInformado: { titulo: "NBS completo não informado", codigo: "REG-016", campo: "nbs", estado: I },
  MunicipioNaoPertencente: { titulo: "Município não pertencente à UF", codigo: "REG-018", campo: null, estado: I },
  MunicipioNaoEncontrado: { titulo: "Município não encontrado", codigo: "REG-019", campo: null, estado: I },
  UfNaoEncontrada: { titulo: "UF não encontrada", codigo: "REG-020", campo: null, estado: I },
  DataFatoGeradorNaoInformada: { titulo: "Data do fato gerador não informada", codigo: "REG-021", campo: null, estado: I },
  ErroGenericoValidacao: { titulo: "Erro genérico de validação", codigo: "REG-023", campo: null, estado: I },
  BaseCalculoNaoInformada: { titulo: "Base de cálculo não informada", codigo: "REG-025", campo: "baseCalculo", estado: I },
  BaseCalculoInconsistente: { titulo: "Base de cálculo inconsistente", codigo: "REG-026", campo: "baseCalculo", estado: I },
  BaseCalculoMenorBaseCalculoImpostoSeletivo: {
    titulo: "Base de cálculo menor que a base de cálculo do Imposto Seletivo", codigo: "REG-027", campo: "baseCalculo", estado: I,
  },
  AliquotaImpostoSeletivoNaoInformada: {
    titulo: "Alíquota do Imposto Seletivo não informada", codigo: "REG-035", campo: "aliquotasNominais/impostoSeletivo", estado: I,
  },
  AliquotasNominaisInformadasIndevidamente: {
    titulo: "Alíquotas nominais informadas indevidamente", codigo: "REG-036", campo: "aliquotasNominais", estado: I,
  },
  AliquotasNominaisNaoInformadas: { titulo: "Alíquotas nominais não informadas", codigo: "REG-037", campo: "aliquotasNominais", estado: I },
  AliquotaNaoEncontrada: { titulo: "Alíquota não encontrada", codigo: "CAL-001", campo: null, estado: F },
  AliquotaPadraoNaoEncontrada: { titulo: "Alíquota padrão não encontrada", codigo: "CAL-002", campo: null, estado: F },
  AliquotaReferenciaNaoEncontrada: { titulo: "Alíquota de referência não encontrada", codigo: "CAL-003", campo: null, estado: F },
  AliquotaNegativa: { titulo: "Alíquota negativa", codigo: "CAL-005", campo: null, estado: F },
  TipoAliquotaDesconhecido: { titulo: "Tipo de alíquota desconhecido", codigo: "CAL-006", campo: null, estado: F },
  ErroFaltaImplementacao: { titulo: "Classificação tributária em desenvolvimento", codigo: "CAL-007", campo: "cClassTrib", estado: "NAO_IMPLEMENTADO" },
  TratamentoTributarioNaoEncontrado: { titulo: "Tratamento tributário não encontrado", codigo: "CAL-009", campo: null, estado: F },
  PercentualReducaoNaoEncontrado: { titulo: "Percentual de redução não encontrado", codigo: "CAL-010", campo: null, estado: F },
  FundamentacaoClassificacaoNaoEncontrada: { titulo: "Fundamentação não encontrada", codigo: "CAL-011", campo: null, estado: F },
} satisfies Record<string, Problema>;

export type TipoErro = keyof typeof PROBLEMAS;

/** Uma exceção "de negócio" da calculadora, com o mesmo nome da classe Java (sem "Exception"). */
export class ErroCalculadora extends Error {
  readonly tipo: TipoErro;
  constructor(tipo: TipoErro, mensagem: string) {
    super(mensagem);
    this.tipo = tipo;
  }
}

/**
 * Erro inesperado (o equivalente a uma RuntimeException qualquer no Java):
 * vira CAL-999 / FALHA_TECNICA, como o ProblemType.ERRO_SISTEMA.
 */
export class ErroPorte extends Error {}

/**
 * Pedido que usa uma parte da calculadora que ainda não foi portada
 * (por exemplo compra governamental). O site nunca manda esses campos.
 */
export class ForaDoPorte extends Error {}

/** Lista de erros da operação inteira (HTTP 422 no Java). */
export class ErrosCalculo extends Error {
  readonly erros: ErroDetalhe[];
  constructor(erros: ErroDetalhe[]) {
    super("Erros de cálculo encontrados");
    this.erros = erros;
  }
}

/** Códigos de validação de campo (Bean Validation), de CodigoValidacao.java. */
export const VALIDACAO: Record<string, { codigo: string; titulo: string }> = {
  NotNull: { codigo: "VAL-001", titulo: "Campo obrigatório não informado" },
  NotEmpty: { codigo: "VAL-003", titulo: "Lista ou campo não pode estar vazio" },
  Size: { codigo: "VAL-004", titulo: "Tamanho fora do intervalo permitido" },
  Min: { codigo: "VAL-005", titulo: "Valor abaixo do mínimo permitido" },
  Max: { codigo: "VAL-006", titulo: "Valor acima do máximo permitido" },
  DecimalMax: { codigo: "VAL-008", titulo: "Valor decimal acima do máximo permitido" },
  Pattern: { codigo: "VAL-009", titulo: "Formato inválido" },
  Digits: { codigo: "VAL-010", titulo: "Quantidade de dígitos inválida" },
  PositiveOrZero: { codigo: "VAL-013", titulo: "Valor deve ser positivo ou zero" },
};

/** Junta os erros de um item, como o ItemCollector. */
export class ColetorItem {
  private readonly index: number;
  private readonly baseURL: string;
  readonly erros: ErroDetalhe[] = [];
  estado: EstadoItem = "CALCULADO";

  constructor(index: number, baseURL: string) {
    this.index = index;
    this.baseURL = baseURL;
  }

  private tipo(codigo: string) {
    return `${this.baseURL}/api/calculadora/observabilidade/erros?codigo=${codigo}`;
  }

  private ponteiro(campo: string | null) {
    return campo === null ? `#/itens/${this.index}` : `#/itens/${this.index}/${campo}`;
  }

  addErroValidacao(anotacao: string, campo: string, detalhe: string) {
    if (this.estado === "CALCULADO") this.estado = "INCONSISTENCIA_ENTRADA";
    const v = VALIDACAO[anotacao] ?? { codigo: "VAL-000", titulo: "Erro de validação" };
    this.erros.push({ type: this.tipo(v.codigo), title: v.titulo, code: v.codigo, pointer: this.ponteiro(campo), detail: detalhe });
  }

  addErro(ex: unknown) {
    if (ex instanceof ErroCalculadora) {
      const p: Problema = PROBLEMAS[ex.tipo];
      this.estado = p.estado;
      this.erros.push({ type: this.tipo(p.codigo), title: p.titulo, code: p.codigo, pointer: this.ponteiro(p.campo), detail: ex.message });
      return;
    }
    if (ex instanceof ForaDoPorte) throw ex;
    this.estado = "FALHA_TECNICA";
    const mensagem = ex instanceof Error ? ex.message : String(ex);
    this.erros.push({
      type: this.tipo("CAL-999"),
      title: "Erro de sistema não previsto",
      code: "CAL-999",
      pointer: `#/itens/${this.index}`,
      detail: mensagem,
    });
  }

  temErros() {
    return this.erros.length > 0;
  }
}
