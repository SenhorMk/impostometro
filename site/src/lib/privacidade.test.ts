import { test } from "node:test";
import assert from "node:assert/strict";
import { BASES_LEGAIS, TRATAMENTOS, montarExportacao, nomeArquivoExportacao, type DadosDaConta } from "./privacidade.ts";

test("inventário: todo tratamento tem finalidade, base legal conhecida, retenção e local", () => {
  const ids = new Set<string>();
  for (const t of TRATAMENTOS) {
    assert.ok(!ids.has(t.id), `id repetido: ${t.id}`);
    ids.add(t.id);
    assert.ok(BASES_LEGAIS[t.base], `${t.id}: base legal desconhecida`);
    for (const campo of ["nome", "dados", "finalidade", "retencao", "onde"] as const) {
      assert.ok(t[campo].trim().length > 3, `${t.id}: falta ${campo}`);
    }
  }
  // cada tabela com dado pessoal da conta aparece no inventário
  for (const id of ["conta", "aceites", "empresa", "historico", "assinatura"]) assert.ok(ids.has(id), id);
});

const dados: DadosDaConta = {
  usuario: { id: "u1", email: "a@b.com", criado_em: "2026-11-01T00:00:00Z", ultimo_acesso_em: null, formas_de_entrar: ["email"] },
  perfil: { termos_versao: "2026-11", termos_aceitos_em: "2026-11-01T00:00:00Z" },
  aceites: [],
  empresa: { uf: "SP", municipio: 3550308, regime: "regular", cnpj: null, razao_social: null },
  assinatura: null,
  calculos: [{ id: "c1", titulo: "Teste" }],
  navegador: { "termos-aceitos": "2026-11" },
};

test("exportação: leva todos os dados da conta, explica cada parte e diz o que ficou de fora", () => {
  const e = montarExportacao(dados, new Date("2026-11-28T12:00:00Z"), "2026-11-28");
  assert.equal(e.sobre.gerado_em, "2026-11-28T12:00:00.000Z");
  assert.equal(e.sobre.versao_da_politica, "2026-11-28");
  assert.match(e.sobre.fora_deste_arquivo, /Asaas/);
  assert.equal(e.conta.email, "a@b.com");
  assert.deepEqual(e.historico_de_calculos, [{ id: "c1", titulo: "Teste" }]);
  assert.equal(e.empresa?.uf, "SP");
  // sem a tabela de aceites (SQL ainda não rodado), usa o aceite guardado no perfil
  assert.deepEqual(e.aceites_dos_termos, [dados.perfil]);
  assert.ok(e.tratamentos.length >= 5);
  assert.ok(e.tratamentos.every((t) => t.base_legal && t.retencao));
  // vira JSON sem perder nada
  assert.deepEqual(JSON.parse(JSON.stringify(e)).conta, dados.usuario);
});

test("exportação: com a tabela de aceites, lista o histórico completo", () => {
  const aceites = [{ versao: "2026-11" }, { versao: "2026-11-28" }];
  assert.deepEqual(montarExportacao({ ...dados, aceites }, new Date(), "x").aceites_dos_termos, aceites);
});

test("nome do arquivo leva a data", () => {
  assert.equal(nomeArquivoExportacao(new Date("2026-11-28T23:00:00Z")), "meus-dados-2026-11-28.json");
});
