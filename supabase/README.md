# Banco do projeto

O esquema é versionado em `migrations/`. A primeira migração foi gerada pela CLI oficial fixada em 3.4.0:

```powershell
npx --yes supabase@3.4.0 migration new criar_registro_buscas_sem_resultado
```

A primeira migração cria o registro do T10, permissões de inserção sem leitura pública e limpeza diária dos registros com mais de 30 dias. A segunda restringe a execução da função administrativa de RLS automática criada pelo painel.

As duas foram aplicadas manualmente no editor SQL do projeto `uivewvttfvaoqdzltrnc`, organização ReformaImposto, São Paulo. **Não foram registradas no histórico remoto da CLI.** Antes de usar `db push`, reconciliar as versões aplicadas com a CLI oficial; não reaplicar a primeira migração sobre a tabela existente.

Leia [o guia do banco](../docs/banco.md) para verificações reais, configuração e pendências. Nunca aplicar migrações deste produto ao staging ORBITA.
