/**
 * As tabelas oficiais da Receita e as consultas que a calculadora faz nelas.
 *
 * Porte dos arquivos `domain/repository/*Repository.java`. Cada função abaixo
 * corresponde a UMA consulta do Java (o nome é o mesmo) e repete o mesmo filtro.
 * O banco vem da imagem Docker oficial e é exportado para `dados/tabelas.json`
 * pelo script `scripts/porte/exportar-tabelas.mjs` (nada é digitado à mão).
 *
 * Regras que se repetem nas consultas:
 *  - vigência: `:data BETWEEN inicio AND COALESCE(fim, :data)`, ou seja,
 *    inicio <= data <= fim (fim vazio = sem fim). As datas são texto AAAA-MM-DD.
 *  - prefixo: `codigo = SUBSTRING(:ncm, 1, LENGTH(codigo))`, ou seja, a NCM
 *    informada começa com o código da tabela (um capítulo vale para todas as NCMs dele).
 */
import bruto from "./dados/tabelas.json" with { type: "json" };
import { D, type Dec } from "./decimal.ts";
import { ErroCalculadora } from "./erros.ts";

type Celula = string | number | null;
type TabelaBruta = { colunas: string[]; linhas: Celula[][] };
type Linha = Record<string, Celula>;

const TABELAS = (bruto as unknown as { tabelas: Record<string, TabelaBruta> }).tabelas;
export const VERSAO_BANCO = (bruto as unknown as { versaoBanco: { versao: string; data: string; descricao: string } }).versaoBanco;

const cache = new Map<string, Linha[]>();
function tabela(nome: string): Linha[] {
  let linhas = cache.get(nome);
  if (!linhas) {
    const t = TABELAS[nome];
    if (!t) throw new Error(`Tabela ${nome} não exportada`);
    linhas = t.linhas.map((l) => Object.fromEntries(t.colunas.map((c, i) => [c, l[i]])));
    cache.set(nome, linhas);
  }
  return linhas;
}

const txt = (v: Celula) => (v === null ? null : String(v));
const num = (v: Celula) => (v === null ? null : Number(v));
const decimal = (v: Celula): Dec | null => (v === null ? null : new D(String(v)));
const bool = (v: Celula) => v === 1 || v === "1" || v === true as unknown;

/** inicio <= data <= fim (fim nulo = vigente para sempre). */
function vigente(data: string, inicio: Celula, fim: Celula): boolean {
  return String(inicio) <= data && data <= (fim === null ? data : String(fim));
}

function porId(nome: string, coluna: string, id: Celula): Linha | undefined {
  return tabela(nome).find((l) => l[coluna] === id);
}

/** A NCM/NBS informada começa com o código da tabela. */
const comeca = (informado: string, codigoTabela: Celula) => codigoTabela !== null && informado.startsWith(String(codigoTabela));

/** Consulta que o Java espera ter 1 resultado; com mais de 1 o Spring lança erro. */
function unico<T>(lista: T[], mensagemErro: string): T | null {
  if (lista.length > 1) throw new ErroCalculadora("ErroGenericoValidacao", mensagemErro);
  return lista[0] ?? null;
}
const MULTIPLOS = "Consulta retornou múltiplos valores quando apenas um era esperado.";

// ─── Tipos devolvidos (os DTOs do Java) ──────────────────────────────────────

export type SituacaoTributaria = { id: number; codigo: string; descricao: string; inGrupoIbsCbs: boolean; inGrupoReducao: boolean };
export type ClassificacaoTributariaDTO = { id: number; codigo: string; nomenclatura: string | null; cst: string };
export type ClassificacaoTributariaCalculoDTO = {
  id: number;
  codigo: string;
  tipoAliquota: string;
  inGrupoMonofasiaPadrao: boolean;
  inGrupoMonofasiaReten: boolean;
  inGrupoMonofasiaRet: boolean;
  inGrupoMonofasiaDiferimento: boolean;
  inGrupoReducao: boolean;
};
export type TratamentoClassificacaoDTO = {
  idTratamentoTributario: number;
  idClassificacaoTributaria: number;
  inIncompativelComSuspensao: boolean;
  inExigeGrupoDesoneracao: boolean;
};
export type TratamentoTributario = {
  id: number;
  descricao: string;
  expressaoAliquota: string | null;
  expressaoAliquotaEfetiva: string | null;
  expressaoBaseCalculo: string | null;
  expressaoTributoCalculado: string | null;
  expressaoTributoDevido: string | null;
  expressaoPercentualDiferimento: string | null;
  expressaoValorDiferimento: string | null;
  inPossuiPercentualReducao: boolean;
  inPossuiAjuste: boolean;
  inPossuiMonofasia: boolean;
};

function situacao(l: Linha): SituacaoTributaria {
  return {
    id: num(l.SITR_ID)!,
    codigo: txt(l.SITR_CD)!,
    descricao: txt(l.SITR_DESCRICAO)!,
    inGrupoIbsCbs: bool(l.SITR_IND_GIBSCBS),
    inGrupoReducao: bool(l.SITR_IND_GRED),
  };
}

// ─── SituacaoTributariaRepository ───────────────────────────────────────────

/** existeCst: o CST existe para o tributo na data. */
export function existeCst(cst: string | null, idTributo: number, data: string): boolean {
  return tabela("TRIBUTO_SITUACAO_TRIBUTARIA").some((t) => {
    if (t.TRST_TBTO_ID !== idTributo || !vigente(data, t.TRST_INICIO_VIGENCIA, t.TRST_FIM_VIGENCIA)) return false;
    const s = porId("SITUACAO_TRIBUTARIA", "SITR_ID", t.TRST_SITR_ID);
    return !!s && s.SITR_CD === cst && vigente(data, s.SITR_INICIO_VIGENCIA, s.SITR_FIM_VIGENCIA);
  });
}

/** consultarSituacaoTributariaPorCodigo (consulta nativa com LIMIT 1). */
export function consultarSituacaoTributariaPorCodigo(cst: string | null, idTributo: number, data: string): SituacaoTributaria | null {
  for (const s of tabela("SITUACAO_TRIBUTARIA")) {
    if ((txt(s.SITR_CD) ?? "") !== (cst ?? "")) continue;
    if (!vigente(data, s.SITR_INICIO_VIGENCIA ?? "", s.SITR_FIM_VIGENCIA)) continue;
    for (const t of tabela("TRIBUTO_SITUACAO_TRIBUTARIA")) {
      if (t.TRST_SITR_ID !== s.SITR_ID || t.TRST_TBTO_ID !== idTributo) continue;
      if (!vigente(data, t.TRST_INICIO_VIGENCIA ?? "", t.TRST_FIM_VIGENCIA)) continue;
      const tb = porId("TRIBUTO", "TBTO_ID", idTributo);
      if (tb && vigente(data, tb.TBTO_INICIO_VIGENCIA ?? "", tb.TBTO_FIM_VIGENCIA)) return situacao(s);
    }
  }
  return null;
}

// ─── ClassificacaoTributariaRepository ──────────────────────────────────────

/** buscarClassificacaoTributaria: cClassTrib vigente cujo CST vale para o tributo. */
export function buscarClassificacaoTributaria(codigo: string | null, idTributo: number, data: string): ClassificacaoTributariaDTO | null {
  const achados: ClassificacaoTributariaDTO[] = [];
  for (const ct of tabela("CLASSIFICACAO_TRIBUTARIA")) {
    if (ct.CLTR_CD !== codigo || !vigente(data, ct.CLTR_INICIO_VIGENCIA, ct.CLTR_FIM_VIGENCIA)) continue;
    const st = porId("SITUACAO_TRIBUTARIA", "SITR_ID", ct.CLTR_SITR_ID);
    if (!st || !vigente(data, st.SITR_INICIO_VIGENCIA, st.SITR_FIM_VIGENCIA)) continue;
    const tb = porId("TRIBUTO", "TBTO_ID", idTributo);
    if (!tb || !vigente(data, tb.TBTO_INICIO_VIGENCIA, tb.TBTO_FIM_VIGENCIA)) continue;
    for (const tst of tabela("TRIBUTO_SITUACAO_TRIBUTARIA")) {
      if (tst.TRST_SITR_ID !== st.SITR_ID || tst.TRST_TBTO_ID !== idTributo) continue;
      if (!vigente(data, tst.TRST_INICIO_VIGENCIA, tst.TRST_FIM_VIGENCIA)) continue;
      achados.push({ id: num(ct.CLTR_ID)!, codigo: txt(ct.CLTR_CD)!, nomenclatura: txt(ct.CLTR_NOMENCLATURA), cst: txt(st.SITR_CD)! });
    }
  }
  return unico(achados, MULTIPLOS);
}

/** buscarClassificacaoTributariaCalculo (por id, sem vigência). */
export function buscarClassificacaoTributariaCalculo(id: number): ClassificacaoTributariaCalculoDTO | null {
  const ct = porId("CLASSIFICACAO_TRIBUTARIA", "CLTR_ID", id);
  if (!ct) return null;
  const st = porId("SITUACAO_TRIBUTARIA", "SITR_ID", ct.CLTR_SITR_ID);
  return {
    id,
    codigo: txt(ct.CLTR_CD)!,
    tipoAliquota: txt(ct.CLTR_TIPO_ALIQUOTA)!,
    inGrupoMonofasiaPadrao: bool(ct.CLTR_IND_GMONOPADRAO),
    inGrupoMonofasiaReten: bool(ct.CLTR_IND_GMONORETEN),
    inGrupoMonofasiaRet: bool(ct.CLTR_IND_GMONORET),
    inGrupoMonofasiaDiferimento: bool(ct.CLTR_IND_GMONODIF),
    inGrupoReducao: st ? bool(st.SITR_IND_GRED) : false,
  };
}

// ─── TratamentoClassificacaoRepository / TratamentoTributarioRepository ─────

export function buscarTratamentoClassificacao(idClassificacaoTributaria: number, data: string): TratamentoClassificacaoDTO | null {
  const achados = tabela("TRATAMENTO_CLASSIFICACAO")
    .filter((tc) => tc.TRCL_CLTR_ID === idClassificacaoTributaria && vigente(data, tc.TRCL_INICIO_VIGENCIA, tc.TRCL_FIM_VIGENCIA))
    .map((tc) => {
      const tt = porId("TRATAMENTO_TRIBUTARIO", "TRTR_ID", tc.TRCL_TRTR_ID)!;
      return {
        idTratamentoTributario: num(tc.TRCL_TRTR_ID)!,
        idClassificacaoTributaria,
        inIncompativelComSuspensao: bool(tt.TRTR_IN_INCOMPATIVEL_COM_SUSPENSAO),
        inExigeGrupoDesoneracao: bool(tt.TRTR_IN_EXIGE_GRUPO_DESONERACAO),
      };
    });
  return unico(achados, MULTIPLOS);
}

export function buscarTratamentoTributario(id: number): TratamentoTributario {
  const tt = porId("TRATAMENTO_TRIBUTARIO", "TRTR_ID", id);
  if (!tt) throw new ErroCalculadora("TratamentoTributarioNaoEncontrado", `Tratamento tributário com id ${id} não encontrado`);
  return {
    id,
    descricao: txt(tt.TRTR_DESCRICAO)!,
    expressaoAliquota: txt(tt.TRTR_EXPRESSAO_ALIQUOTA),
    expressaoAliquotaEfetiva: txt(tt.TRTR_EXPRESSAO_ALIQUOTA_EFETIVA),
    expressaoBaseCalculo: txt(tt.TRTR_EXPRESSAO_BASE_CALCULO),
    expressaoTributoCalculado: txt(tt.TRTR_EXPRESSAO_TRIBUTO_CALCULADO),
    expressaoTributoDevido: txt(tt.TRTR_EXPRESSAO_TRIBUTO_DEVIDO),
    expressaoPercentualDiferimento: txt(tt.TRTR_EXPRESSAO_PERCENTUAL_DIFERIMENTO),
    expressaoValorDiferimento: txt(tt.TRTR_EXPRESSAO_VALOR_DIFERIMENTO),
    inPossuiPercentualReducao: bool(tt.TRTR_IN_POSSUI_PERCENTUAL_REDUCAO),
    inPossuiAjuste: bool(tt.TRTR_IN_POSSUI_AJUSTE),
    inPossuiMonofasia: bool(tt.TRTR_IN_POSSUI_MONOFASIA),
  };
}

// ─── Alíquotas ──────────────────────────────────────────────────────────────

/** PercentualReducaoRepository.buscar */
export function buscarPercentualReducao(idClassificacaoTributaria: number, idTributo: number, data: string): Dec | null {
  const achados = tabela("PERCENTUAL_REDUCAO").filter(
    (p) => p.PERE_CLTR_ID === idClassificacaoTributaria && p.PERE_TBTO_ID === idTributo && vigente(data, p.PERE_INICIO_VIGENCIA, p.PERE_FIM_VIGENCIA),
  );
  return decimal(unico(achados, MULTIPLOS)?.PERE_VALOR ?? null);
}

/** AliquotaReferenciaRepository.buscar */
export function buscarAliquotaReferencia(idTributo: number, data: string): Dec | null {
  const achados = tabela("ALIQUOTA_REFERENCIA").filter(
    (a) => a.ALRE_TBTO_ID === idTributo && vigente(data, a.ALRE_INICIO_VIGENCIA, a.ALRE_FIM_VIGENCIA),
  );
  return decimal(unico(achados, MULTIPLOS)?.ALRE_VALOR ?? null);
}

/** AliquotaPadraoRepository.buscarAliquota: referência + alíquota padrão do ente (se houver). */
export function buscarAliquotaPadrao(
  idTributo: number,
  codigoUf: number | null,
  municipio: number | null,
  data: string,
): { valorReferencia: Dec | null; valorPadrao: Dec | null; formaAplicacao: string | null } | null {
  const linhas: { valorReferencia: Dec | null; valorPadrao: Dec | null; formaAplicacao: string | null }[] = [];
  for (const r of tabela("ALIQUOTA_REFERENCIA")) {
    if (r.ALRE_TBTO_ID !== idTributo || !vigente(data, r.ALRE_INICIO_VIGENCIA, r.ALRE_FIM_VIGENCIA)) continue;
    const padroes = tabela("ALIQUOTA_PADRAO").filter(
      (p) =>
        p.ALPA_ALRE_ID === r.ALRE_ID &&
        (municipio === null ? p.ALPA_MUNI_CD === null : p.ALPA_MUNI_CD === municipio) &&
        (codigoUf === null ? p.ALPA_UF_CD === null : p.ALPA_UF_CD === codigoUf) &&
        vigente(data, p.ALPA_INICIO_VIGENCIA, p.ALPA_FIM_VIGENCIA),
    );
    if (padroes.length === 0) linhas.push({ valorReferencia: decimal(r.ALRE_VALOR), valorPadrao: null, formaAplicacao: null });
    for (const p of padroes) {
      linhas.push({ valorReferencia: decimal(r.ALRE_VALOR), valorPadrao: decimal(p.ALPA_VALOR), formaAplicacao: txt(p.ALPA_FORMA_APLICACAO) });
    }
  }
  return unico(linhas, MULTIPLOS);
}

/** Regra comum das tabelas de alíquota por NCM/NBS: casa pelo prefixo e não tem exceção vigente. */
function aliquotasPorCodigo(opcoes: {
  codigo: string;
  existe: (codigo: string) => boolean;
  tabelaVinculo: string;
  prefixo: string; // AAVP, AAVS, AARP
  colunaCodigo: string;
  colunaAliquota: string;
  tabelaExcecao: string;
  prefixoExcecao: string; // EAVP, EAVS, EARP
  colunaCodigoExcecao: string;
  colunaVinculoExcecao: string;
  data: string;
  filtroAliquota: (aliquota: Linha) => boolean;
  tabelaAliquota: string;
  colunaIdAliquota: string;
}): { vinculo: Linha; aliquota: Linha }[] {
  const o = opcoes;
  if (!o.existe(o.codigo)) return [];
  const saida: { vinculo: Linha; aliquota: Linha }[] = [];
  for (const v of tabela(o.tabelaVinculo)) {
    if (!comeca(o.codigo, v[o.colunaCodigo])) continue;
    if (!vigente(o.data, v[`${o.prefixo}_INICIO_VIGENCIA`], v[`${o.prefixo}_FIM_VIGENCIA`])) continue;
    const a = porId(o.tabelaAliquota, o.colunaIdAliquota, v[o.colunaAliquota]);
    if (!a || !o.filtroAliquota(a)) continue;
    const temExcecao = tabela(o.tabelaExcecao).some(
      (e) =>
        e[o.colunaVinculoExcecao] === v[`${o.prefixo}_ID`] &&
        vigente(o.data, e[`${o.prefixoExcecao}_INICIO_VIGENCIA`], e[`${o.prefixoExcecao}_FIM_VIGENCIA`]) &&
        (comeca(o.codigo, e[o.colunaCodigoExcecao]) || comeca(String(v[o.colunaCodigo]), e[o.colunaCodigoExcecao])),
    );
    if (!temExcecao) saida.push({ vinculo: v, aliquota: a });
  }
  // ORDER BY LENGTH(codigo) DESC: o código mais específico primeiro
  return saida.sort((x, y) => String(y.vinculo[o.colunaCodigo]).length - String(x.vinculo[o.colunaCodigo]).length);
}

const existeNcmSemVigencia = (ncm: string) => tabela("NCM").some((n) => n.NCM_CD === ncm);
const existeNbsSemVigencia = (nbs: string) => tabela("NBS").some((n) => n.NBS_CD === nbs);

function adValoremProduto(ncm: string, idTributo: number, data: string) {
  return aliquotasPorCodigo({
    codigo: ncm, existe: existeNcmSemVigencia, data,
    tabelaVinculo: "ALIQUOTA_AD_VALOREM_PRODUTO", prefixo: "AAVP", colunaCodigo: "AAVP_NCM_CD", colunaAliquota: "AAVP_AADV_ID",
    tabelaExcecao: "EXCECAO_AD_VALOREM_PRODUTO", prefixoExcecao: "EAVP", colunaCodigoExcecao: "EAVP_NCM_CD", colunaVinculoExcecao: "EAVP_AAVP_ID",
    tabelaAliquota: "ALIQUOTA_AD_VALOREM", colunaIdAliquota: "AADV_ID",
    filtroAliquota: (a) => a.AADV_TBTO_ID === idTributo,
  });
}

/** AliquotaAdValoremProdutoRepository.buscarAliquotaAdValorem (LIMIT 1). Devolve o DTO, cujo valor pode ser nulo. */
export function buscarAliquotaAdValoremProduto(ncm: string, idTributo: number, data: string): { valor: Dec | null } | null {
  const r = adValoremProduto(ncm, idTributo, data)[0];
  return r ? { valor: decimal(r.aliquota.AADV_VALOR) } : null;
}

export function existeNcmAdValorem(ncm: string, idTributo: number, data: string): boolean {
  return adValoremProduto(ncm, idTributo, data).length > 0;
}

function adValoremServico(nbs: string, idTributo: number, idClassificacaoTributaria: number | null, data: string) {
  return aliquotasPorCodigo({
    codigo: nbs, existe: existeNbsSemVigencia, data,
    tabelaVinculo: "ALIQUOTA_AD_VALOREM_SERVICO", prefixo: "AAVS", colunaCodigo: "AAVS_NBS_CD", colunaAliquota: "AAVS_AADV_ID",
    tabelaExcecao: "EXCECAO_AD_VALOREM_SERVICO", prefixoExcecao: "EAVS", colunaCodigoExcecao: "EAVS_NBS_CD", colunaVinculoExcecao: "EAVS_AAVS_ID",
    tabelaAliquota: "ALIQUOTA_AD_VALOREM", colunaIdAliquota: "AADV_ID",
    filtroAliquota: (a) => a.AADV_TBTO_ID === idTributo && (idClassificacaoTributaria === null || a.AADV_CLTR_ID === idClassificacaoTributaria),
  });
}

/** AliquotaAdValoremServicoRepository.buscarAliquotaAdValoremDto (sem LIMIT: mais de 1 é erro). */
export function buscarAliquotaAdValoremServico(nbs: string | null, idTributo: number, idClassificacaoTributaria: number | null, data: string): Dec | null {
  if (nbs === null) return null;
  const r = unico(adValoremServico(nbs, idTributo, idClassificacaoTributaria, data), MULTIPLOS);
  return r ? decimal(r.aliquota.AADV_VALOR) : null;
}

export function existeNbsAdValorem(nbs: string, idTributo: number, data: string): boolean {
  return adValoremServico(nbs, idTributo, null, data).length > 0;
}

/** buscarAliquotaAdValoremPorClassificacaoTributaria (consulta nativa). */
export function buscarAliquotaAdValoremPorClassificacaoTributaria(idTributo: number, idClassificacaoTributaria: number, data: string): Dec | null {
  const achados = tabela("ALIQUOTA_AD_VALOREM").filter(
    (a) => a.AADV_TBTO_ID === idTributo && a.AADV_CLTR_ID === idClassificacaoTributaria && vigente(data, a.AADV_INICIO_VIGENCIA, a.AADV_FIM_VIGENCIA),
  );
  return decimal(unico(achados, MULTIPLOS)?.AADV_VALOR ?? null);
}

/** AliquotaAdRemProdutoRepository.buscarAliquotaAdRem (LIMIT 1). */
export function buscarAliquotaAdRem(ncm: string, idTributo: number, data: string): { valor: Dec | null; unidadeMedida: string | null } | null {
  const r = aliquotasPorCodigo({
    codigo: ncm, existe: existeNcmSemVigencia, data,
    tabelaVinculo: "ALIQUOTA_AD_REM_PRODUTO", prefixo: "AARP", colunaCodigo: "AARP_NCM_CD", colunaAliquota: "AARP_AARE_ID",
    tabelaExcecao: "EXCECAO_AD_REM_PRODUTO", prefixoExcecao: "EARP", colunaCodigoExcecao: "EARP_NCM_CD", colunaVinculoExcecao: "EARP_AARP_ID",
    tabelaAliquota: "ALIQUOTA_AD_REM", colunaIdAliquota: "AARE_ID",
    filtroAliquota: (a) => a.AARE_TBTO_ID === idTributo,
  })[0];
  if (!r) return null;
  const unidade = porId("UNIDADE_MEDIDA", "UNMD_ID", r.aliquota.AARE_UNMD_ID);
  return { valor: decimal(r.aliquota.AARE_VALOR), unidadeMedida: unidade ? txt(unidade.UNMD_SIGLA) : null };
}

// ─── Nomenclaturas (NCM e NBS) ──────────────────────────────────────────────

export function existeNcm(ncm: string, data: string): boolean {
  return tabela("NCM").some((n) => n.NCM_CD === ncm && vigente(data, n.NCM_INICIO_VIGENCIA, n.NCM_FIM_VIGENCIA));
}

export function existeNbs(nbs: string, data: string): boolean {
  return tabela("NBS").some((n) => n.NBS_CD === nbs && vigente(data, n.NBS_INICIO_VIGENCIA, n.NBS_FIM_VIGENCIA));
}

/** Anexos da classificação: NCM_APLICAVEL/NBS_APLICAVEL e suas exceções. */
function aplicavel(tipo: "NCM" | "NBS") {
  const t = tipo === "NCM" ? { tab: "NCM_APLICAVEL", p: "NCMA", exc: "EXCECAO_NCM_APLICAVEL", pe: "ENCM" } : { tab: "NBS_APLICAVEL", p: "NBSA", exc: "EXCECAO_NBS_APLICAVEL", pe: "ENBS" };
  const col = `${t.p}_${tipo}_CD`;
  const colExc = `${t.pe}_${tipo}_CD`;
  const colVinculo = `${t.pe}_${t.p}_ID`;
  const vinculos = (idCT: number) => tabela(t.tab).filter((n) => n[`${t.p}_CLTR_ID`] === idCT);
  const excecoesDe = (n: Linha) => tabela(t.exc).filter((e) => e[colVinculo] === n[`${t.p}_ID`]);
  return {
    /** tem: a classificação tem anexo vigente. */
    tem: (idCT: number, data: string) => vinculos(idCT).some((n) => vigente(data, n[`${t.p}_INICIO_VIGENCIA`], n[`${t.p}_FIM_VIGENCIA`])),
    /** temNcmAplicavel / temNbsAplicavel */
    temAplicavel: (codigo: string, idCT: number, data: string) =>
      vinculos(idCT).some((n) => comeca(codigo, n[col]) && vigente(data, n[`${t.p}_INICIO_VIGENCIA`], n[`${t.p}_FIM_VIGENCIA`])),
    /** temExcecaoNcmAplicavel (repare: a vigência checada é só a da exceção, como no Java). */
    temExcecao: (codigo: string, idCT: number, data: string) =>
      vinculos(idCT).some(
        (n) => comeca(codigo, n[col]) && excecoesDe(n).some((e) => comeca(codigo, e[colExc]) && vigente(data, e[`${t.pe}_INICIO_VIGENCIA`], e[`${t.pe}_FIM_VIGENCIA`])),
      ),
    /** temNcmAplicavelSemExcecao: LEFT JOIN com a exceção; vale se alguma combinação não está excluída. */
    temSemExcecao: (codigo: string, idCT: number, data: string) =>
      vinculos(idCT).some((n) => {
        if (!comeca(codigo, n[col]) || !vigente(data, n[`${t.p}_INICIO_VIGENCIA`], n[`${t.p}_FIM_VIGENCIA`])) return false;
        const excs = excecoesDe(n);
        if (excs.length === 0) return true;
        return excs.some((e) => !vigente(data, e[`${t.pe}_INICIO_VIGENCIA`], e[`${t.pe}_FIM_VIGENCIA`]));
      }),
  };
}
export const ncmAplicavel = aplicavel("NCM");
export const nbsAplicavel = aplicavel("NBS");

// ─── UF e município ─────────────────────────────────────────────────────────

export function consultarUfPorSigla(sigla: string | null): number | null {
  if (sigla === null) return null;
  const uf = tabela("UF").find((u) => u.UF_SIGLA === sigla.toUpperCase());
  return uf ? num(uf.UF_CD) : null;
}

/** MunicipioRepository.validarMunicipio: 0 = ok, 1 = não existe, 2 = é de outra UF. */
export function validarMunicipio(codigo: number | null, siglaUf: string | null): 0 | 1 | 2 {
  const m = tabela("MUNICIPIO").find((x) => x.MUNI_CD === codigo);
  if (!m) return 1;
  const uf = porId("UF", "UF_CD", m.MUNI_UF_CD);
  return String(uf?.UF_SIGLA ?? "").toLowerCase() !== String(siglaUf ?? "").toLowerCase() ? 2 : 0;
}

export function buscarUfPorMunicipio(codigo: number): string | null {
  const m = tabela("MUNICIPIO").find((x) => x.MUNI_CD === codigo);
  if (!m) return null;
  return txt(porId("UF", "UF_CD", m.MUNI_UF_CD)?.UF_SIGLA ?? null);
}

// ─── Fundamentação, redutor e transferência ─────────────────────────────────

/** FundamentacaoClassificacaoRepository.buscar: texto curto da lei + modelo da memória de cálculo. */
export function buscarFundamentacao(idClassificacaoTributaria: number, data: string): { textoCurto: string | null; memoriaCalculo: string | null } | null {
  const achados = tabela("FUNDAMENTACAO_CLASSIFICACAO")
    .filter((f) => f.FDCL_CLTR_ID === idClassificacaoTributaria && vigente(data, f.FDCL_INICIO_VIGENCIA, f.FDCL_FIM_VIGENCIA))
    .map((f) => ({
      textoCurto: txt(porId("FUNDAMENTACAO_LEGAL", "FDLG_ID", f.FDCL_FDLG_ID)?.FDLG_TEXTO_CURTO ?? null),
      memoriaCalculo: txt(porId("CLASSIFICACAO_TRIBUTARIA", "CLTR_ID", idClassificacaoTributaria)?.CLTR_MEMORIA_CALCULO ?? null),
    }));
  return unico(achados, MULTIPLOS);
}

/** TransferenciaCBSRepository.getPercentualTransferencia */
export function buscarPercentualTransferencia(data: string): Dec | null {
  const linhas = tabela("TRANSFERENCIA_CBS_ENTE_GOV");
  const colunas = TABELAS.TRANSFERENCIA_CBS_ENTE_GOV.colunas;
  const [, valor, inicio, fim] = colunas;
  const achados = linhas.filter((l) => vigente(data, l[inicio], l[fim]));
  return decimal(unico(achados, MULTIPLOS)?.[valor] ?? null);
}
