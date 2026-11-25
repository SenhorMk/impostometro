import { PaginaConteudo } from "@/components/Conteudo";

export default function ArtigoNaoEncontrado() {
  return (
    <PaginaConteudo titulo="Guia não encontrado" descricao="Esse endereço não corresponde a um artigo disponível.">
      <p className="mt-8 leading-7 text-suave">Consulte os guias da reforma ou o glossário pelos links acima.</p>
    </PaginaConteudo>
  );
}
