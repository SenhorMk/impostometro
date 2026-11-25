import { PaginaConteudo } from "@/components/Conteudo";

export default function CarregandoArtigo() {
  return (
    <PaginaConteudo titulo="Abrindo o guia" descricao="O conteúdo aparecerá em instantes.">
      <p role="status" className="mt-8 text-suave">Carregando artigo…</p>
    </PaginaConteudo>
  );
}
