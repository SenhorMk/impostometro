/**
 * Leitura de XML de NF-e (modelo 55) e NFC-e (modelo 65) — T16.
 *
 * Roda no NAVEGADOR: o arquivo da nota não sai do computador da pessoa. Só os
 * dados fiscais de cada item (NCM, valor, município, classificação) vão para o
 * cálculo. Nome, CPF/CNPJ e endereço do cliente final são ignorados (LGPD).
 *
 * Também roda no Node (testes em nfe.test.ts), por isso não usa DOMParser.
 */
import { XMLParser } from "fast-xml-parser";

export type ItemNota = {
  numero: number; // nItem
  descricao: string; // xProd
  ncm: string;
  cfop: string;
  quantidade: string; // qCom, como veio
  unidade: string; // uCom
  /** valor em centavos que entra na base: vProd − vDesc + vFrete + vSeg + vOutro */
  baseCentavos: number;
  /** de onde veio a base: "nota" (vBC do grupo IBSCBS) ou "estimada" (soma acima) */
  origemBase: "nota" | "estimada";
  cst: string | null; // do grupo IBSCBS, se a nota já tiver
  cClassTrib: string | null;
};

export type NotaLida = {
  arquivo: string;
  chave: string; // 44 dígitos
  modelo: "NF-e" | "NFC-e";
  numero: string;
  serie: string;
  data: string; // AAAA-MM-DD da emissão
  municipio: number; // código IBGE do local do fato gerador
  uf: string;
  itens: ItemNota[];
  avisos: string[];
  /** CNPJ (ou CPF) de quem EMITIU a nota: a sua empresa. Do cliente final nada é guardado. (T34) */
  emitente: string;
  /** O que o protocolo da SEFAZ diz da nota (T34). Sem protocolo = não sabemos se foi autorizada. */
  autorizacao: Autorizacao;
};

export type Autorizacao =
  | { situacao: "autorizada"; codigo: string }
  | { situacao: "sem_protocolo" }
  | { situacao: "cancelada" | "denegada" | "outra"; codigo: string; descricao: string };

/** Evento da NF-e enviado como arquivo separado (por exemplo, o cancelamento). (T34) */
export type EventoNota = { arquivo: string; chave: string; tipo: string; descricao: string; cancelamento: boolean };

/** Um XML de evento (cancelamento etc.) não é nota: volta ok=false com o evento lido em `evento`. */
export type ResultadoLeitura = { ok: true; nota: NotaLida } | { ok: false; arquivo: string; motivo: string; evento?: EventoNota };

/** Código IBGE da UF (2 primeiros dígitos do município) → sigla. */
export const UF_POR_CODIGO: Record<string, string> = {
  "11": "RO", "12": "AC", "13": "AM", "14": "RR", "15": "PA", "16": "AP", "17": "TO",
  "21": "MA", "22": "PI", "23": "CE", "24": "RN", "25": "PB", "26": "PE", "27": "AL", "28": "SE", "29": "BA",
  "31": "MG", "32": "ES", "33": "RJ", "35": "SP", "41": "PR", "42": "SC", "43": "RS",
  "50": "MS", "51": "MT", "52": "GO", "53": "DF",
};

const leitor = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
  parseTagValue: false, // números ficam como texto: nada de arredondar pelo caminho
  trimValues: true,
  isArray: (nome) => nome === "det",
  processEntities: true,
});

type No = Record<string, unknown>;
const no = (x: unknown): No => (x && typeof x === "object" ? (x as No) : {});
const texto = (x: unknown): string => (typeof x === "string" ? x : typeof x === "number" ? String(x) : "");

/** "123.45" → 12345. Aceita até 2 casas (o padrão da NF-e para valores). */
export function centavos(valor: string): number {
  if (!valor) return 0;
  const m = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(valor.trim());
  if (!m) throw new Error(`valor inválido: "${valor}"`);
  const n = Number(m[2]) * 100 + Number((m[3] ?? "").padEnd(2, "0"));
  return m[1] ? -n : n;
}

/** Procura o grupo IBSCBS do item (layout da reforma, NT 2025.002). */
function grupoIbsCbs(imposto: No): No | null {
  const g = imposto.IBSCBS;
  return g && typeof g === "object" ? (g as No) : null;
}

/** Maior XML de nota aceito. Uma NF-e com 990 itens tem uns 2 MB; 10 MB dá folga. */
export const LIMITE_BYTES_XML = 10 * 1024 * 1024;

/**
 * Segurança: nota fiscal de verdade nunca tem DOCTYPE nem ENTITY. Recusamos antes de ler,
 * para fechar a porta a "XML bomba" (entidades que se multiplicam até travar o navegador)
 * e a qualquer truque de entidade externa (XXE).
 */
export function xmlSuspeito(xml: string): boolean {
  return /<!DOCTYPE|<!ENTITY/i.test(xml);
}

export class ErroZip extends Error {}

/**
 * Filtro para o unzipSync do fflate (segurança contra "zip bomba"): só abre .xml, recusa
 * arquivo que descompactado passe de LIMITE_BYTES_XML, mais de `maxArquivos` XMLs ou mais
 * de `maxTotal` bytes somando tudo. O tamanho vem do índice do .zip, antes de descompactar.
 */
export function filtroXmlDoZip(maxArquivos = 2000, maxTotal = 300 * 1024 * 1024) {
  let arquivos = 0;
  let total = 0;
  return (a: { name: string; originalSize: number }): boolean => {
    if (!a.name.toLowerCase().endsWith(".xml")) return false;
    if (a.originalSize > LIMITE_BYTES_XML) throw new ErroZip(`O arquivo ${a.name.split("/").pop()} dentro do .zip é grande demais para uma nota.`);
    arquivos++;
    total += a.originalSize;
    if (arquivos > maxArquivos) throw new ErroZip(`O .zip tem mais de ${maxArquivos} XMLs. Divida em partes menores.`);
    if (total > maxTotal) throw new ErroZip("O .zip descompactado ficou grande demais. Divida em partes menores.");
    return true;
  };
}

export function lerNota(arquivo: string, xml: string): ResultadoLeitura {
  if (xml.length > LIMITE_BYTES_XML) return { ok: false, arquivo, motivo: "O arquivo é grande demais para uma nota fiscal." };
  if (xmlSuspeito(xml)) return { ok: false, arquivo, motivo: "O arquivo tem uma declaração DOCTYPE/ENTITY, que nota fiscal não tem. Por segurança, não lemos." };
  let raiz: No;
  try {
    raiz = no(leitor.parse(xml));
  } catch {
    return { ok: false, arquivo, motivo: "O arquivo não é um XML válido." };
  }

  // Aceita a nota "pura" (<NFe>) ou com o protocolo de autorização (<nfeProc>).
  const nfe = no(no(raiz.nfeProc).NFe ?? raiz.NFe);
  const inf = no(nfe.infNFe);
  if (!inf.ide) {
    const evento = lerEvento(arquivo, raiz);
    if (evento) return { ok: false, arquivo, motivo: `É um evento da nota (${evento.descricao}), não uma nota.`, evento };
    if (raiz.CompNfse || raiz.NFSe || raiz.nfse) return { ok: false, arquivo, motivo: "É uma NFS-e (nota de serviço). Por enquanto lemos só NF-e e NFC-e." };
    if (raiz.cteProc || raiz.CTe) return { ok: false, arquivo, motivo: "É um CT-e (conhecimento de transporte), não uma nota de venda." };
    return { ok: false, arquivo, motivo: "Não encontramos uma NF-e ou NFC-e neste arquivo." };
  }

  const ide = no(inf.ide);
  const mod = texto(ide.mod);
  if (mod !== "55" && mod !== "65") return { ok: false, arquivo, motivo: `Modelo de documento ${mod || "desconhecido"} não é NF-e (55) nem NFC-e (65).` };
  if (texto(ide.tpNF) === "0") return { ok: false, arquivo, motivo: "É uma nota de entrada (compra). Aqui calculamos as suas vendas." };

  const avisos: string[] = [];
  const fin = texto(ide.finNFe);
  if (fin === "4") return { ok: false, arquivo, motivo: "É uma nota de devolução. Ela não entra no imposto das vendas." };
  if (fin === "2" || fin === "3") avisos.push("Nota complementar ou de ajuste: confira se o valor deve mesmo entrar na soma.");

  // Local do fato gerador: o campo novo da reforma (cMunFGIBS), se existir; senão o cMunFG.
  // Suposição: em venda presencial (NFC-e) é o município da loja.
  const cMun = texto(ide.cMunFGIBS) || texto(ide.cMunFG);
  if (!/^\d{7}$/.test(cMun)) return { ok: false, arquivo, motivo: "A nota não informa o município do fato gerador." };
  const uf = UF_POR_CODIGO[cMun.slice(0, 2)];
  if (!uf) return { ok: false, arquivo, motivo: `Município ${cMun} com código de estado desconhecido.` };

  const dh = texto(ide.dhEmi) || texto(ide.dEmi);
  const data = dh.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return { ok: false, arquivo, motivo: "A nota não informa a data de emissão." };

  const chave = texto(inf["@_Id"]).replace(/^NFe/, "");
  const itens: ItemNota[] = [];
  const dets = Array.isArray(inf.det) ? (inf.det as unknown[]) : [];
  if (dets.length === 0) return { ok: false, arquivo, motivo: "A nota não tem itens." };

  for (const d of dets) {
    const det = no(d);
    const prod = no(det.prod);
    const numero = Number(texto(det["@_nItem"])) || itens.length + 1;
    const ncm = texto(prod.NCM);
    const g = grupoIbsCbs(no(det.imposto));
    let baseCentavos: number;
    let origemBase: ItemNota["origemBase"] = "estimada";
    try {
      const vBC = texto(no(g?.gIBSCBS).vBC);
      if (vBC) {
        baseCentavos = centavos(vBC);
        origemBase = "nota";
      } else {
        baseCentavos =
          centavos(texto(prod.vProd)) - centavos(texto(prod.vDesc)) + centavos(texto(prod.vFrete)) + centavos(texto(prod.vSeg)) + centavos(texto(prod.vOutro));
      }
    } catch (e) {
      avisos.push(`Item ${numero}: ${(e as Error).message}. Item ignorado.`);
      continue;
    }
    itens.push({
      numero,
      descricao: texto(prod.xProd).slice(0, 120),
      ncm,
      cfop: texto(prod.CFOP),
      quantidade: texto(prod.qCom) || "1",
      unidade: texto(prod.uCom).slice(0, 6) || "UN",
      baseCentavos,
      origemBase,
      cst: g ? texto(g.CST) || null : null,
      cClassTrib: g ? texto(g.cClassTrib) || null : null,
    });
  }

  const emit = no(inf.emit);
  const emitente = (texto(emit.CNPJ) || texto(emit.CPF)).replace(/\D/g, "");

  return {
    ok: true,
    nota: {
      emitente,
      autorizacao: autorizacaoDe(no(no(raiz.nfeProc).protNFe)),
      arquivo,
      chave,
      modelo: mod === "55" ? "NF-e" : "NFC-e",
      numero: texto(ide.nNF),
      serie: texto(ide.serie),
      data,
      municipio: Number(cMun),
      uf,
      itens,
      avisos,
    },
  };
}

/**
 * Situação da nota pelo protocolo da SEFAZ (protNFe/infProt/cStat), quando o XML traz o protocolo.
 * 100 e 150 = autorizada; 101, 151 e 155 = cancelada; 110, 301, 302 e 303 = denegada.
 * Fonte: Manual de Orientação do Contribuinte da NF-e, tabela de códigos de status.
 */
export function autorizacaoDe(prot: No): Autorizacao {
  const info = no(prot.infProt);
  const codigo = texto(info.cStat);
  if (!codigo) return { situacao: "sem_protocolo" };
  const descricao = texto(info.xMotivo).slice(0, 120);
  if (codigo === "100" || codigo === "150") return { situacao: "autorizada", codigo };
  if (["101", "151", "155"].includes(codigo)) return { situacao: "cancelada", codigo, descricao: descricao || "Cancelamento homologado" };
  if (["110", "301", "302", "303"].includes(codigo)) return { situacao: "denegada", codigo, descricao: descricao || "Uso denegado" };
  return { situacao: "outra", codigo, descricao: descricao || "Situação não reconhecida" };
}

/** Códigos de evento de cancelamento da NF-e (110111 cancelamento, 110112 cancelamento por substituição). */
const EVENTOS_CANCELAMENTO = new Set(["110111", "110112"]);

/** Lê um XML de evento (procEventoNFe ou evento solto). null se não for evento de NF-e. */
function lerEvento(arquivo: string, raiz: No): EventoNota | null {
  const proc = no(raiz.procEventoNFe);
  const evento = no(proc.evento ?? raiz.evento);
  const inf = no(evento.infEvento);
  const chave = texto(inf.chNFe);
  const tipo = texto(inf.tpEvento);
  if (!/^\d{44}$/.test(chave) || !tipo) return null;
  const descricao = (texto(no(inf.detEvento).descEvento) || `Evento ${tipo}`).slice(0, 80);
  return { arquivo, chave, tipo, descricao, cancelamento: EVENTOS_CANCELAMENTO.has(tipo) };
}
