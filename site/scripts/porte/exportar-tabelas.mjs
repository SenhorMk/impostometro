#!/usr/bin/env node
/**
 * Exporta as tabelas oficiais da calculadora da Receita (banco SQLite gerado
 * pelo Flyway dentro da imagem Docker) para um JSON que o porte em TypeScript lê.
 *
 *   node scripts/porte/exportar-tabelas.mjs <caminho/calculadora-pro.db>
 *
 * Normalmente você não roda isto à mão: use `npm run porte:tabelas`, que tira o
 * banco de dentro da imagem `impostometro/calculadora` e chama este script.
 *
 * Só exporta as tabelas e colunas que o cálculo usa. Os valores ficam como estão
 * no banco (nada é arredondado nem convertido), para o porte fazer a conta igual.
 */
import { DatabaseSync } from "node:sqlite";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const caminhoBanco = process.argv[2];
if (!caminhoBanco) {
  console.error("Uso: node scripts/porte/exportar-tabelas.mjs <calculadora-pro.db>");
  process.exit(1);
}

// tabela -> colunas usadas pelo cálculo (mesmos nomes do banco da Receita)
const TABELAS = {
  TRIBUTO: ["TBTO_ID", "TBTO_SIGLA", "TBTO_INICIO_VIGENCIA", "TBTO_FIM_VIGENCIA"],
  SITUACAO_TRIBUTARIA: ["SITR_ID", "SITR_CD", "SITR_DESCRICAO", "SITR_INICIO_VIGENCIA", "SITR_FIM_VIGENCIA",
    "SITR_IND_GIBSCBS", "SITR_IND_GRED", "SITR_IND_GDIF"],
  TRIBUTO_SITUACAO_TRIBUTARIA: ["TRST_ID", "TRST_SITR_ID", "TRST_TBTO_ID", "TRST_INICIO_VIGENCIA", "TRST_FIM_VIGENCIA"],
  CLASSIFICACAO_TRIBUTARIA: ["CLTR_ID", "CLTR_CD", "CLTR_DESCRICAO", "CLTR_MEMORIA_CALCULO", "CLTR_SITR_ID",
    "CLTR_TIPO_ALIQUOTA", "CLTR_NOMENCLATURA", "CLTR_INICIO_VIGENCIA", "CLTR_FIM_VIGENCIA",
    "CLTR_IND_GMONOPADRAO", "CLTR_IND_GMONORETEN", "CLTR_IND_GMONORET", "CLTR_IND_GMONODIF"],
  TRATAMENTO_TRIBUTARIO: ["TRTR_ID", "TRTR_DESCRICAO", "TRTR_EXPRESSAO_ALIQUOTA", "TRTR_EXPRESSAO_ALIQUOTA_EFETIVA",
    "TRTR_EXPRESSAO_BASE_CALCULO", "TRTR_EXPRESSAO_TRIBUTO_CALCULADO", "TRTR_EXPRESSAO_TRIBUTO_DEVIDO",
    "TRTR_EXPRESSAO_PERCENTUAL_DIFERIMENTO", "TRTR_EXPRESSAO_VALOR_DIFERIMENTO",
    "TRTR_IN_INCOMPATIVEL_COM_SUSPENSAO", "TRTR_IN_EXIGE_GRUPO_DESONERACAO", "TRTR_IN_POSSUI_PERCENTUAL_REDUCAO",
    "TRTR_IN_POSSUI_AJUSTE", "TRTR_IN_POSSUI_MONOFASIA", "TRTR_INICIO_VIGENCIA", "TRTR_FIM_VIGENCIA"],
  TRATAMENTO_CLASSIFICACAO: ["TRCL_ID", "TRCL_CLTR_ID", "TRCL_TRTR_ID", "TRCL_INICIO_VIGENCIA", "TRCL_FIM_VIGENCIA"],
  PERCENTUAL_REDUCAO: ["PERE_ID", "PERE_CLTR_ID", "PERE_TBTO_ID", "PERE_VALOR", "PERE_INICIO_VIGENCIA", "PERE_FIM_VIGENCIA"],
  ALIQUOTA_REFERENCIA: ["ALRE_ID", "ALRE_VALOR", "ALRE_TBTO_ID", "ALRE_INICIO_VIGENCIA", "ALRE_FIM_VIGENCIA"],
  ALIQUOTA_PADRAO: ["ALPA_ID", "ALPA_VALOR", "ALPA_MUNI_CD", "ALPA_UF_CD", "ALPA_ALRE_ID", "ALPA_FORMA_APLICACAO",
    "ALPA_INICIO_VIGENCIA", "ALPA_FIM_VIGENCIA"],
  ALIQUOTA_AD_VALOREM: ["AADV_ID", "AADV_VALOR", "AADV_TBTO_ID", "AADV_CLTR_ID", "AADV_INICIO_VIGENCIA", "AADV_FIM_VIGENCIA"],
  ALIQUOTA_AD_VALOREM_PRODUTO: ["AAVP_ID", "AAVP_NCM_CD", "AAVP_AADV_ID", "AAVP_INICIO_VIGENCIA", "AAVP_FIM_VIGENCIA"],
  EXCECAO_AD_VALOREM_PRODUTO: ["EAVP_ID", "EAVP_NCM_CD", "EAVP_AAVP_ID", "EAVP_INICIO_VIGENCIA", "EAVP_FIM_VIGENCIA"],
  ALIQUOTA_AD_VALOREM_SERVICO: ["AAVS_ID", "AAVS_NBS_CD", "AAVS_AADV_ID", "AAVS_INICIO_VIGENCIA", "AAVS_FIM_VIGENCIA"],
  EXCECAO_AD_VALOREM_SERVICO: ["EAVS_ID", "EAVS_NBS_CD", "EAVS_AAVS_ID", "EAVS_INICIO_VIGENCIA", "EAVS_FIM_VIGENCIA"],
  ALIQUOTA_AD_REM: ["AARE_ID", "AARE_VALOR", "AARE_UNMD_ID", "AARE_TBTO_ID", "AARE_INICIO_VIGENCIA", "AARE_FIM_VIGENCIA"],
  ALIQUOTA_AD_REM_PRODUTO: ["AARP_ID", "AARP_NCM_CD", "AARP_AARE_ID", "AARP_INICIO_VIGENCIA", "AARP_FIM_VIGENCIA"],
  EXCECAO_AD_REM_PRODUTO: ["EARP_ID", "EARP_NCM_CD", "EARP_AARP_ID", "EARP_INICIO_VIGENCIA", "EARP_FIM_VIGENCIA"],
  UNIDADE_MEDIDA: ["UNMD_ID", "UNMD_SIGLA"],
  NCM: ["NCM_CD", "NCM_INICIO_VIGENCIA", "NCM_FIM_VIGENCIA"],
  NBS: ["NBS_CD", "NBS_INICIO_VIGENCIA", "NBS_FIM_VIGENCIA"],
  NCM_APLICAVEL: ["NCMA_ID", "NCMA_NCM_CD", "NCMA_CLTR_ID", "NCMA_INICIO_VIGENCIA", "NCMA_FIM_VIGENCIA"],
  EXCECAO_NCM_APLICAVEL: ["ENCM_ID", "ENCM_NCM_CD", "ENCM_NCMA_ID", "ENCM_INICIO_VIGENCIA", "ENCM_FIM_VIGENCIA"],
  NBS_APLICAVEL: ["NBSA_ID", "NBSA_NBS_CD", "NBSA_CLTR_ID", "NBSA_INICIO_VIGENCIA", "NBSA_FIM_VIGENCIA"],
  EXCECAO_NBS_APLICAVEL: ["ENBS_ID", "ENBS_NBS_CD", "ENBS_NBSA_ID", "ENBS_INICIO_VIGENCIA", "ENBS_FIM_VIGENCIA"],
  UF: ["UF_CD", "UF_SIGLA"],
  MUNICIPIO: ["MUNI_CD", "MUNI_UF_CD"],
  FUNDAMENTACAO_CLASSIFICACAO: ["FDCL_ID", "FDCL_CLTR_ID", "FDCL_FDLG_ID", "FDCL_INICIO_VIGENCIA", "FDCL_FIM_VIGENCIA"],
  FUNDAMENTACAO_LEGAL: ["FDLG_ID", "FDLG_TEXTO_CURTO"],
  REDUTOR_COMPRA_GOVERNAMENTAL: ["RCGO_ID", "RCGO_VALOR", "RCGO_INICIO_VIGENCIA", "RCGO_FIM_VIGENCIA"],
  TRANSFERENCIA_CBS_ENTE_GOV: ["*"],
};

const db = new DatabaseSync(caminhoBanco, { readOnly: true });
const saida = { tabelas: {} };

// Números com casas decimais (REAL) viram texto do jeito que o SQLite escreve,
// que é o mesmo texto que o Java lê. Assim 0.1 continua sendo exatamente "0.1".
for (const [tabela, colunas] of Object.entries(TABELAS)) {
  const info = db.prepare(`PRAGMA table_info(${tabela})`).all();
  const nomes = colunas[0] === "*" ? info.map((c) => c.name) : colunas;
  const tipos = Object.fromEntries(info.map((c) => [c.name, String(c.type).toUpperCase()]));
  for (const n of nomes) if (!(n in tipos)) throw new Error(`Coluna ${tabela}.${n} não existe no banco`);
  const select = nomes.map((n) => (tipos[n] === "REAL" ? `CAST(${n} AS TEXT) AS ${n}` : n)).join(", ");
  const linhas = db.prepare(`SELECT ${select} FROM ${tabela} ORDER BY 1`).all().map((l) => nomes.map((n) => l[n]));
  saida.tabelas[tabela] = { colunas: nomes, linhas };
}

const versao = db.prepare(
  "SELECT VRBD_VERSAO_BASE_DADO AS versao, substr(VRBD_DATA, 1, 10) AS data, VRBD_DESCRICAO AS descricao FROM VERSAO_BASE_DADO ORDER BY VRBD_ID DESC LIMIT 1",
).get();
saida.versaoBanco = { versao: versao.versao, data: versao.data, descricao: versao.descricao };

const destino = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../src/motor/dados/tabelas.json");
writeFileSync(destino, JSON.stringify(saida));
const total = Object.values(saida.tabelas).reduce((s, t) => s + t.linhas.length, 0);
console.log(`✅ ${Object.keys(saida.tabelas).length} tabelas, ${total} linhas, banco ${versao.versao} → ${path.relative(process.cwd(), destino)}`);
