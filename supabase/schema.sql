-- Schema do banco de dados para o Primus CS
-- Execute este SQL no Supabase SQL Editor

-- Tabela principal de planos de ação
create table if not exists planos (
  id          uuid default gen_random_uuid() primary key,
  created_at  timestamp with time zone default timezone('utc', now()) not null,
  nome_aluno  text not null,
  tutora      text not null,
  conteudo    text not null,
  criado_por  uuid references auth.users(id) on delete set null
);

-- Row Level Security: cada usuário vê/insere apenas seus próprios planos
alter table planos enable row level security;

create policy "Usuários veem seus próprios planos"
  on planos for select
  using (auth.uid() = criado_por);

create policy "Usuários inserem seus próprios planos"
  on planos for insert
  with check (auth.uid() = criado_por);

create policy "Usuários atualizam seus próprios planos"
  on planos for update
  using (auth.uid() = criado_por);

create policy "Usuários deletam seus próprios planos"
  on planos for delete
  using (auth.uid() = criado_por);

-- Índices para buscas frequentes
create index if not exists planos_criado_por_idx on planos(criado_por);
create index if not exists planos_tutora_idx on planos(tutora);
create index if not exists planos_created_at_idx on planos(created_at desc);
