-- Webase FC initial schema
-- profiles, games, registrations, teams, team_players, matches, player_stats

-- =========================
-- 1. Tables
-- =========================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text unique,
  position text check (position in ('GK', 'DEF', 'MID', 'FWD')),
  skill_rating integer check (skill_rating between 1 and 10) default 5,
  photo_url text,
  role text not null check (role in ('admin', 'player')) default 'player',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  played_at timestamptz not null,
  location text,
  status text not null check (status in ('upcoming', 'team_formed', 'in_progress', 'completed', 'cancelled')) default 'upcoming',
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now() not null
);

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('going', 'not_going', 'maybe')) default 'going',
  registered_at timestamptz default now() not null,
  unique(game_id, player_id)
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz default now() not null
);

create table if not exists public.team_players (
  team_id uuid not null references public.teams(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  primary key (team_id, player_id)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  team_a_id uuid not null references public.teams(id),
  team_b_id uuid not null references public.teams(id),
  score_a integer not null default 0,
  score_b integer not null default 0,
  played_at timestamptz default now(),
  check (team_a_id <> team_b_id)
);

create table if not exists public.player_stats (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  goals integer not null default 0,
  assists integer not null default 0,
  is_mvp boolean not null default false,
  unique(match_id, player_id)
);

-- =========================
-- 2. Indexes
-- =========================

create index if not exists idx_registrations_game on public.registrations(game_id);
create index if not exists idx_registrations_player on public.registrations(player_id);
create index if not exists idx_teams_game on public.teams(game_id);
create index if not exists idx_team_players_team on public.team_players(team_id);
create index if not exists idx_team_players_player on public.team_players(player_id);
create index if not exists idx_matches_game on public.matches(game_id);
create index if not exists idx_player_stats_match on public.player_stats(match_id);
create index if not exists idx_player_stats_player on public.player_stats(player_id);
create index if not exists idx_games_played_at on public.games(played_at desc);

-- =========================
-- 3. Helpers + Triggers
-- =========================

create or replace function public.is_admin(uid uuid) returns boolean
language sql security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = uid), false);
$$;

create or replace function public.handle_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Auto-create profile on auth signup
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public, auth as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1),
      new.phone,
      'O''yinchi'
    ),
    new.phone,
    'player'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================
-- 4. RLS
-- =========================

alter table public.profiles       enable row level security;
alter table public.games          enable row level security;
alter table public.registrations  enable row level security;
alter table public.teams          enable row level security;
alter table public.team_players   enable row level security;
alter table public.matches        enable row level security;
alter table public.player_stats   enable row level security;

-- profiles
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all"
  on public.profiles for select to authenticated using (true);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all"
  on public.profiles for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- games
drop policy if exists "games_select_all" on public.games;
create policy "games_select_all"
  on public.games for select to authenticated using (true);

drop policy if exists "games_admin_all" on public.games;
create policy "games_admin_all"
  on public.games for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- registrations
drop policy if exists "registrations_select_all" on public.registrations;
create policy "registrations_select_all"
  on public.registrations for select to authenticated using (true);

drop policy if exists "registrations_self_insert" on public.registrations;
create policy "registrations_self_insert"
  on public.registrations for insert to authenticated with check (auth.uid() = player_id);

drop policy if exists "registrations_self_update" on public.registrations;
create policy "registrations_self_update"
  on public.registrations for update to authenticated
  using (auth.uid() = player_id) with check (auth.uid() = player_id);

drop policy if exists "registrations_self_delete" on public.registrations;
create policy "registrations_self_delete"
  on public.registrations for delete to authenticated using (auth.uid() = player_id);

drop policy if exists "registrations_admin_all" on public.registrations;
create policy "registrations_admin_all"
  on public.registrations for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- teams
drop policy if exists "teams_select_all" on public.teams;
create policy "teams_select_all"
  on public.teams for select to authenticated using (true);

drop policy if exists "teams_admin_all" on public.teams;
create policy "teams_admin_all"
  on public.teams for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- team_players
drop policy if exists "team_players_select_all" on public.team_players;
create policy "team_players_select_all"
  on public.team_players for select to authenticated using (true);

drop policy if exists "team_players_admin_all" on public.team_players;
create policy "team_players_admin_all"
  on public.team_players for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- matches
drop policy if exists "matches_select_all" on public.matches;
create policy "matches_select_all"
  on public.matches for select to authenticated using (true);

drop policy if exists "matches_admin_all" on public.matches;
create policy "matches_admin_all"
  on public.matches for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- player_stats
drop policy if exists "player_stats_select_all" on public.player_stats;
create policy "player_stats_select_all"
  on public.player_stats for select to authenticated using (true);

drop policy if exists "player_stats_admin_all" on public.player_stats;
create policy "player_stats_admin_all"
  on public.player_stats for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
