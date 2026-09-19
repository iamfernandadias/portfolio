-- ==========================================================================
-- BANCO DO PORTFÓLIO DA FERNANDA DIAS
--
-- COMO USAR (uma vez só):
--   1. Entre em https://supabase.com e abra o seu projeto.
--   2. No menu da esquerda, clique em "SQL Editor".
--   3. Clique em "New query" (nova consulta).
--   4. Apague o que estiver escrito, cole TUDO deste arquivo e clique em "Run".
--   5. Deve aparecer "Success. No rows returned". Pronto.
--
-- Pode rodar de novo sem medo: ele só cria o que ainda não existe e
-- recria as regras de segurança do zero.
-- ==========================================================================


-- ==========================================================================
-- BLOCO 1: QUEM É A DONA
-- Uma pequena função que confere se quem está logado é a Fernanda.
-- Todas as regras de segurança abaixo usam esta função.
-- ==========================================================================
create or replace function public.eh_dona()
returns boolean
language sql
stable
as $$
  select coalesce(lower(auth.jwt() ->> 'email') = 'iamfernandadias@gmail.com', false);
$$;


-- ==========================================================================
-- BLOCO 2: AS TABELAS
-- Cada tabela tem uma coluna "exemplo". Ela marca a linha de exemplo que
-- vem de brinde, só para você entender o formato. Pode apagar depois.
-- ==========================================================================

-- 2.1 VÍDEOS: o que aparece no seu portfólio.
create table if not exists public.videos (
  id         bigint generated always as identity primary key,
  titulo     text    not null check (char_length(titulo) between 1 and 200),
  link       text,                                   -- endereço do vídeo (Instagram, YouTube...)
  nicho      text,                                   -- ex: Skincare, Fitness
  formato    text,                                   -- ex: Reels, Stories
  marca      text,
  destaque   text,                                   -- ex: "2,4M views" (se preencher, vira destaque no site)
  capa       text,                                   -- imagem de capa (opcional), ex: fotos/minha-capa.jpg
  ordem      integer not null default 0,             -- posição na lista
  visivel    boolean not null default true,          -- o olhinho: aparece ou não no site
  exemplo    boolean not null default false,
  criado_em  timestamptz not null default now()
);

-- 2.2 MARCAS: a sua base de contatos de empresas.
create table if not exists public.marcas (
  id             bigint generated always as identity primary key,
  nome           text not null check (char_length(nome) between 1 and 200),
  instagram      text,
  email          text,
  telefone       text,
  situacao       text not null default 'lead'
                 check (situacao in ('lead','conversando','cliente','parada')),
  obs            text,
  ultimo_contato date,
  exemplo        boolean not null default false,
  criado_em      timestamptz not null default now()
);

-- 2.3 CALENDÁRIO: o que gravar, editar e postar, dia a dia.
create table if not exists public.calendario (
  id         bigint generated always as identity primary key,
  titulo     text not null check (char_length(titulo) between 1 and 200),
  marca      text,
  tipo       text not null check (tipo in ('gravar','editar','postar')),
  data       date not null,
  status     text not null default 'a fazer' check (status in ('a fazer','feito')),
  exemplo    boolean not null default false,
  criado_em  timestamptz not null default now()
);

-- 2.4 CAMPANHAS: os trabalhos fechados, com valor e prazo.
create table if not exists public.campanhas (
  id         bigint generated always as identity primary key,
  campanha   text not null check (char_length(campanha) between 1 and 200),
  cliente    text,
  tipo       text not null default 'Conteúdo' check (tipo in ('Conteúdo','Publicidade')),
  status     text not null default 'Briefing'
             check (status in ('Briefing','Roteiro','Aprovação Roteiro','Gravação','Edição','Aprovado','Entregue')),
  qtd        integer not null default 0,
  valor      numeric(12,2) not null default 0,
  prazo      date,
  pagamento  text not null default 'pendente' check (pagamento in ('pendente','pago')),
  ativa      boolean not null default true,
  favorita   boolean not null default false,
  exemplo    boolean not null default false,
  criado_em  timestamptz not null default now()
);

-- 2.5 MARCADOS: o que você já marcou no checklist (guardado por uma chave de texto).
create table if not exists public.marcados (
  chave          text primary key,
  feito          boolean not null default true,
  atualizado_em  timestamptz not null default now()
);

-- 2.6 VISITAS: uma linha para cada pessoa que abre o seu portfólio.
create table if not exists public.visitas (
  id         bigint generated always as identity primary key,
  data       date not null default current_date,
  pagina     text,
  origem     text,                                   -- ex: Instagram, Google, Direto
  criado_em  timestamptz not null default now()
);
create index if not exists visitas_data_idx on public.visitas (data);


-- ==========================================================================
-- BLOCO 3: A TRANCA (RLS, Row Level Security)
-- Ligamos a tranca em TODAS as tabelas. Depois, dizemos quem pode o quê.
-- Sem regra escrita, ninguém entra. É por isso que o padrão é seguro.
-- ==========================================================================
alter table public.videos     enable row level security;
alter table public.marcas     enable row level security;
alter table public.calendario enable row level security;
alter table public.campanhas  enable row level security;
alter table public.marcados   enable row level security;
alter table public.visitas    enable row level security;

-- 3.1 REGRA PRINCIPAL: só a Fernanda, logada, lê e escreve em tudo.
--     (Apagamos a regra antes de criar, para poder rodar este arquivo de novo.)
drop policy if exists "so_dona" on public.videos;
create policy "so_dona" on public.videos
  for all to authenticated using (public.eh_dona()) with check (public.eh_dona());

drop policy if exists "so_dona" on public.marcas;
create policy "so_dona" on public.marcas
  for all to authenticated using (public.eh_dona()) with check (public.eh_dona());

drop policy if exists "so_dona" on public.calendario;
create policy "so_dona" on public.calendario
  for all to authenticated using (public.eh_dona()) with check (public.eh_dona());

drop policy if exists "so_dona" on public.campanhas;
create policy "so_dona" on public.campanhas
  for all to authenticated using (public.eh_dona()) with check (public.eh_dona());

drop policy if exists "so_dona" on public.marcados;
create policy "so_dona" on public.marcados
  for all to authenticated using (public.eh_dona()) with check (public.eh_dona());

drop policy if exists "so_dona" on public.visitas;
create policy "so_dona" on public.visitas
  for all to authenticated using (public.eh_dona()) with check (public.eh_dona());

-- 3.2 EXCEÇÃO 1: qualquer pessoa pode ENVIAR o formulário do seu site.
--     Só pode INSERIR (nunca ler), e só como "lead", sem a marca de exemplo,
--     com textos de tamanho razoável.
drop policy if exists "visitante_envia_contato" on public.marcas;
create policy "visitante_envia_contato" on public.marcas
  for insert to anon
  with check (
    situacao = 'lead'
    and exemplo = false
    and char_length(nome) between 1 and 200
    and coalesce(char_length(email), 0) <= 200
    and coalesce(char_length(telefone), 0) <= 60
    and coalesce(char_length(instagram), 0) <= 200
    and coalesce(char_length(obs), 0) <= 3000
  );

-- 3.3 EXCEÇÃO 2: qualquer pessoa pode REGISTRAR uma visita.
--     Só INSERIR (nunca ler), com data de hoje (aceita 2 dias de folga por causa
--     do fuso horário) e textos curtos.
drop policy if exists "visitante_registra_visita" on public.visitas;
create policy "visitante_registra_visita" on public.visitas
  for insert to anon
  with check (
    data between current_date - 2 and current_date + 2
    and coalesce(char_length(pagina), 0) <= 200
    and coalesce(char_length(origem), 0) <= 200
  );


-- ==========================================================================
-- BLOCO 4: VÍDEOS PARA O SITE PÚBLICO
-- O site precisa mostrar seus vídeos para quem NÃO está logado. Mas a tabela
-- "videos" continua trancada. Em vez de abrir a tabela, criamos uma função
-- que entrega só o necessário: os vídeos com o olhinho aberto, sem os
-- exemplos. O visitante não consegue ver mais nada além disso.
-- ==========================================================================
create or replace function public.videos_publicos()
returns table (
  id bigint, titulo text, link text, nicho text, formato text,
  marca text, destaque text, capa text, ordem integer
)
language sql
stable
security definer
set search_path = public
as $$
  select v.id, v.titulo, v.link, v.nicho, v.formato, v.marca, v.destaque, v.capa, v.ordem
  from public.videos v
  where v.visivel = true and v.exemplo = false
  order by v.ordem, v.id;
$$;

revoke all on function public.videos_publicos() from public;
grant execute on function public.videos_publicos() to anon, authenticated;


-- ==========================================================================
-- BLOCO 5: UMA LINHA DE EXEMPLO EM CADA LISTA
-- Só para você entender o formato. Todas têm "exemplo = true" e aparecem
-- marcadas como exemplo no painel. Pode apagar quando quiser.
-- O vídeo de exemplo já vem escondido (olhinho fechado), então nunca vai
-- para o seu site.
-- ==========================================================================
insert into public.videos (titulo, link, nicho, formato, marca, destaque, ordem, visivel, exemplo)
select 'Vídeo de exemplo (pode apagar)', 'https://www.instagram.com/', 'Skincare', 'Reels',
       'Marca Exemplo', '0 views', 0, false, true
where not exists (select 1 from public.videos where exemplo);

insert into public.marcas (nome, instagram, email, telefone, situacao, obs, ultimo_contato, exemplo)
select 'Marca Exemplo', '@marcaexemplo', 'contato@exemplo.com', '(00) 00000-0000', 'lead',
       'Linha de exemplo, pode apagar.', current_date, true
where not exists (select 1 from public.marcas where exemplo);

insert into public.calendario (titulo, marca, tipo, data, status, exemplo)
select 'Gravar vídeo de exemplo', 'Marca Exemplo', 'gravar', current_date + 1, 'a fazer', true
where not exists (select 1 from public.calendario where exemplo);

insert into public.campanhas (campanha, cliente, tipo, status, qtd, valor, prazo, pagamento, ativa, favorita, exemplo)
select 'Campanha de exemplo', 'Marca Exemplo', 'Conteúdo', 'Briefing', 0, 0, current_date + 7,
       'pendente', true, false, true
where not exists (select 1 from public.campanhas where exemplo);


-- ==========================================================================
-- BLOCO 6: AVISAR O SUPABASE QUE TUDO MUDOU
-- Faz o Supabase reconhecer as tabelas e a função nova na hora.
-- ==========================================================================
notify pgrst, 'reload schema';
