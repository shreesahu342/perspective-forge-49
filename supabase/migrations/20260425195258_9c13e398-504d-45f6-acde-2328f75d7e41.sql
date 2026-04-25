
-- Roles enum + table (separate from profiles for security)
create type public.app_role as enum ('admin', 'moderator', 'user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

-- Security definer function to check roles without recursion
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- Characters
create type public.character_category as enum ('philosopher', 'everyday', 'archetype');

create table public.characters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,  -- null = built-in
  is_builtin boolean not null default false,
  slug text unique,  -- only for built-ins
  name text not null,
  era text,
  category character_category not null,
  credo text not null,                   -- one-line motto
  worldview text not null,               -- core beliefs / first principles
  argument_style text not null,          -- how they reason
  voice text not null,                   -- vocabulary, register, tics
  refusals text,                         -- what they won't concede
  opening_move text,                     -- how they tend to start
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Dialogues
create type public.dialogue_mode as enum ('debate', 'roleplay', 'open');
create type public.cognitive_level as enum ('child', 'teen', 'adult', 'scholar');

create table public.dialogues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  character_id uuid references public.characters(id) on delete set null,
  title text not null default 'Untitled dialogue',
  mode dialogue_mode not null default 'debate',
  cognitive_level cognitive_level not null default 'adult',
  user_role text,                  -- e.g. "parent", "student"
  ai_role text,                    -- e.g. "5-year-old", "strict teacher"
  relationship text,               -- e.g. "authority", "care", "conflict"
  topic text,                      -- optional opening thesis
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.message_role as enum ('user', 'assistant', 'system');

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  dialogue_id uuid references public.dialogues(id) on delete cascade not null,
  role message_role not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index messages_dialogue_id_idx on public.messages(dialogue_id, created_at);
create index dialogues_user_id_idx on public.dialogues(user_id, created_at desc);
create index characters_category_idx on public.characters(category);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.characters enable row level security;
alter table public.dialogues enable row level security;
alter table public.messages enable row level security;

-- profiles policies
create policy "Profiles readable by self"
  on public.profiles for select to authenticated
  using (auth.uid() = id);
create policy "Profiles insertable by self"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);
create policy "Profiles updatable by self"
  on public.profiles for update to authenticated
  using (auth.uid() = id);

-- user_roles policies
create policy "Users can view their own roles"
  on public.user_roles for select to authenticated
  using (auth.uid() = user_id);
create policy "Admins can manage roles"
  on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- characters policies
create policy "Anyone authenticated can read built-in characters"
  on public.characters for select to authenticated
  using (is_builtin = true or owner_id = auth.uid());
create policy "Users can insert their own characters"
  on public.characters for insert to authenticated
  with check (owner_id = auth.uid() and is_builtin = false);
create policy "Users can update their own characters"
  on public.characters for update to authenticated
  using (owner_id = auth.uid() and is_builtin = false);
create policy "Users can delete their own characters"
  on public.characters for delete to authenticated
  using (owner_id = auth.uid() and is_builtin = false);

-- dialogues policies
create policy "Users read own dialogues"
  on public.dialogues for select to authenticated
  using (auth.uid() = user_id);
create policy "Users insert own dialogues"
  on public.dialogues for insert to authenticated
  with check (auth.uid() = user_id);
create policy "Users update own dialogues"
  on public.dialogues for update to authenticated
  using (auth.uid() = user_id);
create policy "Users delete own dialogues"
  on public.dialogues for delete to authenticated
  using (auth.uid() = user_id);

-- messages policies (scoped via dialogue ownership)
create policy "Users read messages from own dialogues"
  on public.messages for select to authenticated
  using (exists (select 1 from public.dialogues d where d.id = dialogue_id and d.user_id = auth.uid()));
create policy "Users insert messages into own dialogues"
  on public.messages for insert to authenticated
  with check (exists (select 1 from public.dialogues d where d.id = dialogue_id and d.user_id = auth.uid()));
create policy "Users delete messages from own dialogues"
  on public.messages for delete to authenticated
  using (exists (select 1 from public.dialogues d where d.id = dialogue_id and d.user_id = auth.uid()));

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_profiles before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at_characters before update on public.characters
  for each row execute function public.set_updated_at();
create trigger set_updated_at_dialogues before update on public.dialogues
  for each row execute function public.set_updated_at();

-- Auto-create profile on new user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
