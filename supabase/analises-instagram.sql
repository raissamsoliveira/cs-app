-- Tabela para análises de Instagram avulsas (página /analise-instagram)
-- Execute no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS analises_instagram (
  id         uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  nome_aluno text,
  conteudo   text not null,
  criado_por uuid references auth.users(id) on delete set null
);

ALTER TABLE analises_instagram ENABLE ROW LEVEL SECURITY;

-- Leitura pública — necessário para os links /analise/publico/[id]
CREATE POLICY "Leitura pública das análises"
  ON analises_instagram FOR SELECT
  USING (true);

-- Inserção — qualquer usuário autenticado
CREATE POLICY "Autenticados inserem análises"
  ON analises_instagram FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Índice para buscas por criador
CREATE INDEX IF NOT EXISTS analises_instagram_criado_por_idx
  ON analises_instagram(criado_por);
