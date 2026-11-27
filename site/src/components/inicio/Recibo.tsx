import { dataBR, emPercentual, emReais } from "@/lib/formato";
import type { Atividade } from "@/lib/exemplos";
import type { ResultadoCalculo } from "@/lib/tipos";

/**
 * O resultado em forma de recibo: cada linha da conta, na ordem em que a calculadora faz.
 * Todos os números vêm do porte (lib/exemplos.ts). As linhas "imprimem" ao rolar
 * (CSS em globals.css); sem animação, o recibo aparece inteiro.
 */
const reais = (v: number) => emReais(v).replace("R$", "").trim();

function Linha({ rotulo, valor, forte }: { rotulo: string; valor: string; forte?: boolean }) {
  return (
    <div className={`recibo-linha flex items-baseline justify-between gap-4 py-[3px] ${forte ? "font-semibold" : ""}`}>
      <dt>{rotulo}</dt>
      <dd className="shrink-0 tabular-nums">{valor}</dd>
    </div>
  );
}

const Corte = () => <div aria-hidden className="recibo-linha my-2 border-t border-dashed border-tinta/40" />;

export function Recibo({ resultado, atividade, cidade }: { resultado: ResultadoCalculo; atividade: Atividade; cidade: string }) {
  const codigo = `${atividade.tipo.toUpperCase()} ${atividade.codigo} · cClassTrib ${atividade.cClassTrib}`;

  return (
    <figure className="relative mx-auto w-full max-w-[25rem]">
      <div
        className="bg-white px-5 pb-8 pt-5 font-mono text-[13px] leading-snug text-tinta shadow-[0_1px_0_rgba(0,0,0,0.06),0_12px_30px_-12px_rgba(20,20,20,0.25)] ring-1 ring-tinta/10"
        style={{
          // borda de baixo serrilhada, como papel de impressora
          maskImage: "linear-gradient(#000 0 0), conic-gradient(from 135deg at 50% 100%, #000 90deg, #0000 0)",
          maskSize: "100% calc(100% - 8px), 16px 8px",
          maskPosition: "top, bottom",
          maskRepeat: "no-repeat, repeat-x",
        }}
      >
        <p className="recibo-linha text-[11px] uppercase tracking-[0.14em] text-suave">Simulação · CBS e IBS 2027</p>
        <p className="recibo-linha mt-3 font-sans text-[15px] font-semibold leading-snug">{atividade.nome}</p>
        <p className="recibo-linha text-[11px] text-suave">{codigo}</p>
        {resultado.ok ? (
          <>
            <p className="recibo-linha text-[11px] text-suave">{cidade} · {dataBR(resultado.dataFatoGerador)}</p>
            <Corte />
            <dl>
              <Linha rotulo="Valor da venda" valor={reais(resultado.base)} />
              <Linha
                rotulo={`Alíquota CBS${resultado.periodoAliquotas.status === "provisorio" ? " (provisória)" : ""}`}
                valor={emPercentual(resultado.cbs.aliquota)}
              />
              {resultado.cbs.reducao > 0 && (
                <Linha
                  rotulo={`Redução do setor${resultado.fundamentacao ? ` (${resultado.fundamentacao})` : ""}`}
                  valor={`${resultado.cbs.reducao.toLocaleString("pt-BR")}%`}
                />
              )}
              <Linha rotulo="Alíquota efetiva" valor={emPercentual(resultado.cbs.aliquotaEfetiva)} />
            </dl>
            <Corte />
            <dl>
              <Linha rotulo="CBS (federal)" valor={reais(resultado.cbs.valor)} />
              <Linha rotulo="IBS estadual (teste)" valor={reais(resultado.ibsEstadual.valor)} />
              <Linha rotulo="IBS municipal (teste)" valor={reais(resultado.ibsMunicipal.valor)} />
            </dl>
            <div aria-hidden className="recibo-linha my-2 border-t-2 border-double border-tinta" />
            <dl>
              <div className="recibo-linha flex items-baseline justify-between gap-4 text-base font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums"><span className="marcatexto">{emReais(resultado.total)}</span></dd>
              </div>
              <Linha rotulo="Sobre o valor da venda" valor={emPercentual(resultado.percentualSobreVenda)} />
            </dl>
            {resultado.cbs.memoria && (
              <>
                <Corte />
                <p className="recibo-linha text-[11px] leading-relaxed text-suave">
                  Memória de cálculo oficial: “{resultado.cbs.memoria}”
                </p>
              </>
            )}
            <p className="recibo-linha mt-3 text-[10px] text-suave">
              Calculadora oficial {resultado.versaoMotor} · tabela {resultado.versaoTabelaMotor} · alíquotas {resultado.versaoTabelaAliquotas}
            </p>
          </>
        ) : (
          <>
            <Corte />
            <p className="recibo-linha font-semibold">Não calculado</p>
            <p className="recibo-linha mt-1 text-suave">{resultado.mensagem}</p>
          </>
        )}
      </div>
    </figure>
  );
}
