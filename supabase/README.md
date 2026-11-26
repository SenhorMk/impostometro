# Banco do projeto

O esquema é versionado em `migrations/`. A primeira migração foi gerada pela CLI oficial fixada em 3.4.0:

```powershell
npx --yes supabase@3.4.0 migration new criar_registro_buscas_sem_resultado
```

O arquivo cria o registro do T10, permissões de inserção sem leitura pública e limpeza diária dos registros com mais de 30 dias. A migração está preparada e ainda não foi aplicada. O destino é a organização separada ReformaImposto; a vaga Free foi liberada pela exclusão autorizada de dois projetos ORBITA, preservando somente o staging ativo. O formulário aguarda definição de senha pelo titular e a conexão MCP ainda não tem acesso a essa organização. Os bloqueios estão em `docs/banco.md`.

O histórico remoto deve ser conferido antes de aplicar a migração por MCP. Leia [o guia do banco](../docs/banco.md) e registre projeto, região, migração aplicada, testes e advisors. Não aplique esta migração a projetos ORBITA existentes.
