/**
 * Memória de cálculo: o texto que explica a conta, montado a partir do modelo
 * que a Receita guarda no banco (coluna CLTR_MEMORIA_CALCULO).
 *
 * Porte de `domain/service/MemoriaCalculoService.java` e de
 * `domain/service/token/*` (troca de [marcadores] pelos valores).
 * Exemplo de modelo: "... A base de cálculo utilizada é de R$ [base_calculo],
 * com alíquota de [aliquota_ad_valorem]%."
 */
import { type Dec, moedaBR, percentualBR } from "./decimal.ts";
import type { CbsIbsSaida } from "./calculo-cbs-ibs.ts";
import { ErroCalculadora } from "./erros.ts";
import { type TratamentoClassificacaoDTO, buscarFundamentacao, buscarTratamentoTributario } from "./tabelas.ts";

const SEM_TEXTO = "Texto de memória de cálculo não encontrado";

/** Troca cada [chave] pelo valor; chave desconhecida vira texto vazio (TokenizerService). */
export function substituirMarcadores(modelo: string, valores: Record<string, string>): string {
  if (!modelo.includes("[")) return modelo;
  let saida = "";
  let ultimo = 0;
  while (ultimo < modelo.length) {
    const abre = modelo.indexOf("[", ultimo);
    if (abre < 0) {
      saida += modelo.slice(ultimo);
      break;
    }
    const fecha = modelo.indexOf("]", abre + 1);
    if (fecha < 0) {
      saida += modelo.slice(ultimo);
      break;
    }
    saida += modelo.slice(ultimo, abre);
    saida += valores[modelo.slice(abre + 1, fecha)] ?? "";
    ultimo = fecha + 1;
  }
  return saida;
}

function fundamentacao(tc: TratamentoClassificacaoDTO, data: string) {
  const f = buscarFundamentacao(tc.idClassificacaoTributaria, data);
  if (!f) {
    throw new ErroCalculadora(
      "FundamentacaoClassificacaoNaoEncontrada",
      `Fundamentação legal não encontrada para classificação tributária de id ${tc.idClassificacaoTributaria} e data ${data}`,
    );
  }
  return f;
}

const vazioSeNulo = (s: string | null | undefined) => s ?? "";
const branco = (s: string | null) => s === null || s.trim() === "";

export function gerarMemoriaCalculoCbsIbs(
  tc: TratamentoClassificacaoDTO,
  tributo: CbsIbsSaida | null,
  baseCalculoInformada: Dec | null,
  quantidadeTexto: string | null,
  unidade: string | null,
  data: string,
): string {
  // CST sem gIBSCBS (ex.: imunidade): usa a base informada e alíquota zero
  const t = tributo ?? { baseCalculo: baseCalculoInformada, aliquota: null, grupoReducao: null, grupoDiferimento: null };
  const f = fundamentacao(tc, data);
  const tt = buscarTratamentoTributario(tc.idTratamentoTributario);
  const dif = t.grupoDiferimento;
  const valores: Record<string, string> = {
    norma: vazioSeNulo(f.textoCurto),
    tratamento: vazioSeNulo(tt.descricao),
    base_calculo: moedaBR(t.baseCalculo),
    aliquota_ad_valorem: percentualBR(t.aliquota),
    aliquota_ad_rem: percentualBR(null), // só existe na monofasia, que não está no porte
    quantidade: quantidadeTexto ?? "0",
    unidade: vazioSeNulo(unidade),
    percentual_reducao: percentualBR(t.grupoReducao?.pRedAliq ?? null),
    percentual_diferimento: percentualBR(dif ? dif.pDif : null),
    valor_diferimento: moedaBR(dif ? dif.vDif : null),
    aliquota_desoneracao: percentualBR(null),
    montante_desoneracao: moedaBR(null),
  };
  return branco(f.memoriaCalculo) ? SEM_TEXTO : substituirMarcadores(f.memoriaCalculo!, valores);
}

export function gerarMemoriaCalculoImpostoSeletivo(
  tc: TratamentoClassificacaoDTO,
  vBCIS: Dec | null,
  pIS: Dec | null,
  pISEspec: Dec | null,
  quantidadeTexto: string | null,
  unidade: string | null,
  data: string,
): string {
  const f = fundamentacao(tc, data);
  const tt = buscarTratamentoTributario(tc.idTratamentoTributario);
  const valores: Record<string, string> = {
    norma: vazioSeNulo(f.textoCurto),
    tratamento: vazioSeNulo(tt.descricao),
    base_calculo: moedaBR(vBCIS),
    aliquota_ad_valorem: percentualBR(pIS),
    aliquota_ad_rem: percentualBR(pISEspec),
    quantidade: quantidadeTexto ?? "",
    unidade: vazioSeNulo(unidade),
  };
  return branco(f.memoriaCalculo) ? SEM_TEXTO : substituirMarcadores(f.memoriaCalculo!, valores);
}
