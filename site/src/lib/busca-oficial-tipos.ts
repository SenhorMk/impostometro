/** Contrato público da busca; não importa as tabelas para o navegador. */
export type ResultadoBuscaOficial = {
  tipo: "classificacao" | "ncm" | "nbs";
  codigo: string;
  descricao: string;
  nomenclatura: string | null;
};

export type RespostaBuscaOficial = {
  resultados: ResultadoBuscaOficial[];
  versaoTabela: string;
  data: string;
};
