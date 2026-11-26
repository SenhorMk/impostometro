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
};

export type ResultadoLeitura = { ok: true; nota: NotaLida } | { ok: false; arquivo: string; motivo: string };

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

export function lerNota(arquivo: string, xml: string): ResultadoLeitura {
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

  return {
    ok: true,
    nota: {
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
