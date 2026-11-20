-- GYM EMPIRE online leaderboards (NOT deployed in this release; local AI rivals are used).
-- Clients never write scores directly: inserts go through the submit-score edge function
-- (service role) which validates every submission.

create table if not exists public.players (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 16),
  created_at timestamptz not null default now()
);

create table if not exists public.leaderboard_scores (
  player_id uuid not null references public.players(id) on delete cascade,
  category text not null check (category in ('level','gym','members','strength','achievements','weekly')),
  period text not null default 'all',           -- 'all' or ISO week like '2026-W47'
  value bigint not null check (value >= 0),
  submitted_at timestamptz not null default now(),
  primary key (player_id, category, period)
);

create index if not exists leaderboard_rank_idx on public.leaderboard_scores (category, period, value desc);

create table if not exists public.purchase_receipts (
  transaction_id text primary key,             -- prevents replaying the same receipt
  player_id uuid references public.players(id),
  product_id text not null,
  platform text not null,
  verified_at timestamptz not null default now()
);

alter table public.players enable row level security;
alter table public.leaderboard_scores enable row level security;
alter table public.purchase_receipts enable row level security;

-- Anyone signed in may read boards; nobody may write through the public API.
create policy "read scores" on public.leaderboard_scores for select to authenticated using (true);
create policy "read players" on public.players for select to authenticated using (true);
create policy "own player row" on public.players for insert to authenticated with check (auth.uid() = id);
