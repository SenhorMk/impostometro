import { emPercentual, emReais } from "@/lib/formato";
import type { ResultadoCalculo } from "@/lib/tipos";

/**
 * "Vídeo" de 12 segundos feito só com CSS: alguém digita "pizzaria", o valor aparece,
 * o botão é apertado e o resultado sobe. Pesa quase nada no celular (não é arquivo de vídeo).
 * Os números vêm do porte (lib/exemplos.ts). Sem animação (reduzir movimento), mostra a tela final.
 */
export function DemoAnimada({ resultado, valor, cidade }: { resultado: ResultadoCalculo; valor: number; cidade: string }) {
  return (
    <figure className="mx-auto w-full max-w-sm">
      <div aria-hidden className="flutuar rounded-[2rem] border border-borda bg-white p-3 shadow-2xl shadow-marca-900/10">
        <div className="rounded-[1.5rem] bg-fundo p-4">
          <div className="mb-3 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-borda" />
            <span className="h-2 w-2 rounded-full bg-borda" />
            <span className="h-2 w-2 rounded-full bg-borda" />
          </div>
          <p className="text-[11px] font-medium text-suave">O que você vende?</p>
          <div className="mt-1 rounded-lg border border-borda bg-white px-3 py-2 text-sm">
            <span className="demo-digitar inline-block max-w-full overflow-hidden whitespace-nowrap align-bottom">pizzaria</span>
            <span className="demo-cursor ml-px inline-block h-4 w-px bg-tinta align-middle" />
          </div>
          <div className="demo-valor mt-3 grid grid-cols-2 gap-2">
            <div>
              <p className="text-[11px] font-medium text-suave">Valor da venda</p>
              <div className="mt-1 rounded-lg border border-borda bg-white px-3 py-2 text-sm">{emReais(valor)}</div>
            </div>
            <div>
              <p className="text-[11px] font-medium text-suave">Cidade</p>
              <div className="mt-1 truncate rounded-lg border border-borda bg-white px-3 py-2 text-sm">{cidade}</div>
            </div>
          </div>
          <div className="demo-botao mt-3 rounded-lg bg-marca-700 py-2 text-center text-sm font-semibold text-white">
            Calcular meu imposto
          </div>
          <div className="demo-resultado mt-3 overflow-hidden rounded-xl border border-borda bg-white">
            {resultado.ok ? (
              <>
                <div className="bg-marca-900 px-3 py-2.5 text-white">
                  <p className="text-xl font-bold">{emReais(resultado.total)}</p>
                  <p className="text-[11px] text-marca-100">
                    de CBS + IBS, {emPercentual(resultado.percentualSobreVenda)} do valor
                  </p>
                </div>
                <div className="grid grid-cols-2 divide-x divide-borda text-center text-[11px]">
                  <p className="p-2"><span className="block text-suave">CBS</span><b>{emReais(resultado.cbs.valor)}</b></p>
                  <p className="p-2"><span className="block text-suave">IBS (teste)</span><b>{emReais(resultado.ibsTotal)}</b></p>
                </div>
                {resultado.cbs.reducao > 0 && (
                  <p className="border-t border-borda bg-marca-50 px-3 py-1.5 text-[11px] font-medium text-marca-800">
                    Redução de {resultado.cbs.reducao.toLocaleString("pt-BR")}% para o seu setor
                    {resultado.fundamentacao ? ` (${resultado.fundamentacao})` : ""}
                  </p>
                )}
              </>
            ) : (
              <p className="p-3 text-xs text-suave">Não calculado: {resultado.mensagem}</p>
            )}
          </div>
        </div>
      </div>
      <figcaption className="mt-4 text-center text-xs text-suave">
        Exemplo real: pizzaria, venda de {emReais(valor)} em {cidade}, calculada com a mesma conta da calculadora da
        Receita Federal.
      </figcaption>
    </figure>
  );
}
