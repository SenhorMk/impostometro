-- Função administrativa criada pelo painel ao habilitar RLS automática.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
