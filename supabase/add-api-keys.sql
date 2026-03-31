-- Migration: tabela de API Keys para integração externa
-- Execute no Supabase SQL Editor

create table if not exists api_keys (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  key_hash     text not null unique,
  key_preview  text not null,
  label        text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz
);

-- Índice de busca usado em toda validação de chave
create index if not exists api_keys_hash_active_idx
  on api_keys (key_hash)
  where is_active = true;

-- Índice para listagem por usuário
create index if not exists api_keys_user_idx
  on api_keys (user_id, is_active, created_at desc);

-- RLS: usuários só lêem/alteram as próprias chaves
-- (o service role ignora RLS, por isso a validação pública funciona sem autenticação)
alter table api_keys enable row level security;

create policy "Usuários veem suas próprias chaves"
  on api_keys for select
  using (auth.uid() = user_id);

create policy "Usuários inserem suas próprias chaves"
  on api_keys for insert
  with check (auth.uid() = user_id);

create policy "Usuários revogam suas próprias chaves"
  on api_keys for update
  using (auth.uid() = user_id);
