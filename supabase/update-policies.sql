-- Atualização de políticas RLS da tabela planos
-- Execute este SQL no Supabase SQL Editor (projeto > SQL Editor > New query)
--
-- Objetivo: permitir que qualquer usuário autenticado veja e gerencie todos os planos,
-- independente de quem os criou. O campo criado_por é mantido para rastreabilidade.

-- ── Remover políticas antigas (por-usuário) ─────────────────────────────────
DROP POLICY IF EXISTS "Usuários veem seus próprios planos"     ON planos;
DROP POLICY IF EXISTS "Usuários inserem seus próprios planos"  ON planos;
DROP POLICY IF EXISTS "Usuários atualizam seus próprios planos" ON planos;
DROP POLICY IF EXISTS "Usuários deletam seus próprios planos"  ON planos;

-- ── Novas políticas (qualquer autenticado) ──────────────────────────────────

-- Leitura: qualquer usuário autenticado vê todos os planos
CREATE POLICY "Usuários autenticados veem todos os planos"
  ON planos FOR SELECT
  USING (auth.role() = 'authenticated');

-- Inserção: qualquer usuário autenticado cria planos
CREATE POLICY "Usuários autenticados inserem planos"
  ON planos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Atualização: qualquer usuário autenticado atualiza qualquer plano
CREATE POLICY "Usuários autenticados atualizam planos"
  ON planos FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Exclusão: qualquer usuário autenticado exclui qualquer plano
CREATE POLICY "Usuários autenticados deletam planos"
  ON planos FOR DELETE
  USING (auth.role() = 'authenticated');
