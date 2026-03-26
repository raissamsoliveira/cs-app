-- Migração: análise de Instagram e leitura pública dos planos
-- Execute no Supabase SQL Editor (projeto > SQL Editor > New query)

-- ── 1. Nova coluna para armazenar a análise de Instagram ────────────────────
ALTER TABLE planos ADD COLUMN IF NOT EXISTS analise_instagram text;

-- ── 2. Policy de leitura pública para links compartilhados ──────────────────
-- Permite acesso anônimo (anon key) a todos os planos.
-- Usado pela rota pública /p/[id] para exibir o plano sem exigir login.
DROP POLICY IF EXISTS "Leitura pública dos planos" ON planos;
CREATE POLICY "Leitura pública dos planos"
  ON planos FOR SELECT
  USING (true);

-- Nota: esta policy substitui a policy "Usuários autenticados veem todos os planos"
-- (USING true cobre qualquer usuário, autenticado ou não). Se quiser manter
-- granularidade, você pode deletar a policy anterior:
-- DROP POLICY IF EXISTS "Usuários autenticados veem todos os planos" ON planos;
