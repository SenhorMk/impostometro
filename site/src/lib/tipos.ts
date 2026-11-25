/** Formatos trocados entre o navegador, a nossa API e a calculadora oficial. */

export type PedidoCalculo = {
  tipo: "ncm" | "nbs";
  codigo: string; // NCM (8 dígitos) ou NBS (9 dígitos)
  cClassTrib: string; // classificação tributária (6 dígitos)
  valor: number; // valor da venda em reais
  municipio: number; // código IBGE
  uf: string;
  data?: string; // AAAA-MM-DD; padrão: hoje, ou 01/01/2027 se ainda for 2026
};

export type ParteTributo = {
  aliquota: number; // % nominal
  reducao: number; // % de redução
  aliquotaEfetiva: number; // % depois da redução
  valor: number; // R$
  memoria?: string; // texto oficial da memória de cálculo
};

export type ResultadoCalculo =
  | {
      ok: true;
      estado: "CALCULADO" | "CALCULO_SIMULADO";
      base: number;
      cbs: ParteTributo;
      ibsEstadual: ParteTributo;
      ibsMunicipal: ParteTributo;
      ibsTotal: number;
      total: number;
      percentualSobreVenda: number;
      fundamentacao?: string; // ex.: "Art. 129"
      semAliquota: boolean; // imunidade / não incidência
      dataFatoGerador: string;
      versaoMotor: string;
      versaoTabelaMotor: string;
      versaoTabelaAliquotas: string;
      periodoAliquotas: {
        id: string;
        status: string;
        explicacaoCbs: string;
        explicacaoIbs: string;
        fontes: { titulo: string; url: string }[];
      };
    }
  | {
      ok: false;
      estado: string; // INCONSISTENCIA_ENTRADA, NAO_IMPLEMENTADO, FALHA_TECNICA, FORA_DO_AR...
      mensagem: string;
      codigoErro?: string;
    };
