-- Permite leitura pública (sem autenticação) da tabela planos
-- Necessário para a rota /publico/[id] funcionar sem login
-- Execute no Supabase SQL Editor

CREATE POLICY "Leitura pública dos planos"
  ON planos FOR SELECT
  USING (true);
