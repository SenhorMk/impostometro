import Link from "next/link";
import { SITE } from "@/lib/config";

/** T21: aviso de "não oficial" e crédito da licença MIT em todas as páginas. */
export function Rodape() {
  return (
    <footer className="mt-auto border-t border-borda bg-fundo">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm text-suave md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <p className="font-semibold text-tinta">{SITE.nome}</p>
          <p className="mt-2 max-w-md leading-relaxed">
            Este site <strong>não é do governo</strong> e não tem ligação com a Receita Federal. Os cálculos usam a
            calculadora de tributos publicada pela Receita Federal do Brasil como software livre (licença MIT,
            Copyright © 2026 Receita Federal do Brasil), sem alterações. Os resultados são simulações e não
            substituem a orientação do seu contador.
          </p>
        </div>
        <div>
          <p className="font-semibold text-tinta">Site</p>
          <ul className="mt-2 space-y-1.5">
            <li><Link href="/#calculadora" className="hover:text-tinta">Calculadora</Link></li>
            <li><Link href="/#planos" className="hover:text-tinta">Planos</Link></li>
            <li><Link href="/entrar" className="hover:text-tinta">Entrar</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-tinta">Transparência</p>
          <ul className="mt-2 space-y-1.5">
            <li>
              <a
                href="https://github.com/ReceitaFederal/calculadora-rtc-regime-regular"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-tinta"
              >
                Calculadora oficial (código aberto)
              </a>
            </li>
            <li><Link href="/termos" className="hover:text-tinta">Termos de uso</Link></li>
            <li><Link href="/privacidade" className="hover:text-tinta">Privacidade</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
