/**
 * Dados estruturados (schema.org) para o Google entender a página.
 * O "<" é escapado para que nenhum texto feche a tag <script> por engano.
 */
export function DadosEstruturados({ dados }: { dados: object | object[] }) {
  const lista = Array.isArray(dados) ? dados : [dados];
  return (
    <>
      {lista.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(d).replace(/</g, "\\u003c") }}
        />
      ))}
    </>
  );
}
