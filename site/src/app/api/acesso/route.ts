import { acessoImportacao, cobrancaDisponivel } from "@/lib/acesso";
import { vendeAssinatura } from "@/lib/acesso-regras";
import { limitarPorIp } from "@/lib/limite";

/**
 * GET /api/acesso  (T37)
 * Diz à tela o que o SERVIDOR decidiu para esta pessoa (manda "Authorization: Bearer <token>" se estiver logada):
 *   { situacao, limiteNotas, mensagem, proximoPasso, vendeAssinatura, cancelamentoDisponivel }
 * A tela só mostra; quem barra de verdade é /api/calcular-lote, com a mesma regra.
 * Não devolve nomes de variáveis nem detalhes de configuração.
 */
export async function GET(request: Request) {
  const limite = limitarPorIp(request, "acesso", 60);
  if (limite) return limite;
  const { modo, decisao } = await acessoImportacao(request);
  return Response.json(
    {
      situacao: decisao.situacao,
      limiteNotas: decisao.limiteNotas,
      mensagem: decisao.mensagem,
      proximoPasso: decisao.proximoPasso,
      vendeAssinatura: vendeAssinatura(modo),
      cancelamentoDisponivel: cobrancaDisponivel(),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
