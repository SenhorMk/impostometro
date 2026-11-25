/**
 * De qual versão da calculadora oficial da Receita este porte é cópia fiel.
 *
 * Ao atualizar o porte (docs/manutencao.md), mude estes valores JUNTO com
 * `calculadora/Dockerfile` (CALC_VERSION e CALC_COMMIT). A CI confere que os
 * dois batem e que o porte responde igual ao oficial.
 */
import { VERSAO_BANCO } from "./tabelas.ts";

export const VERSAO_CALCULADORA = "1.7.2";
export const COMMIT_CALCULADORA = "39363aa84103c6d58f7e8e76acb2f592691ec382";
export const REPOSITORIO_CALCULADORA = "https://github.com/ReceitaFederal/calculadora-rtc-regime-regular";

/** Mesmo formato de GET /api/calculadora/dados-abertos/versao do oficial. */
export function versao() {
  return {
    versaoApp: VERSAO_CALCULADORA,
    versaoDb: VERSAO_BANCO.versao,
    descricaoVersaoDb: VERSAO_BANCO.descricao,
    dataVersaoDb: VERSAO_BANCO.data,
  };
}
