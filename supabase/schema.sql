-- =========================================================
-- Side Quest — Supabase schema
-- Run this whole file in the Supabase SQL Editor (one paste).
-- =========================================================

-- ---------- PROFILES ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  bio text not null default '',
  photo_url text,
  contact text not null default '',
  gender text not null default 'unspecified' check (gender in ('male', 'female', 'other', 'unspecified')),
  interests text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- ---------- GROUPS ("quests") ----------
create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  activity_type text not null default 'other',
  description text not null default '',
  spots_needed int not null default 1 check (spots_needed >= 0),
  gender_preference text not null default 'any' check (gender_preference in ('any', 'male', 'female')),
  created_at timestamptz not null default now()
);

alter table groups enable row level security;

create policy "groups are viewable by everyone"
  on groups for select
  using (true);

create policy "authenticated users can create groups"
  on groups for insert
  with check (auth.uid() = creator_id);

create policy "creators can update their own groups"
  on groups for update
  using (auth.uid() = creator_id);

create policy "creators can delete their own groups"
  on groups for delete
  using (auth.uid() = creator_id);

-- ---------- GROUP MEMBERS ----------
create table if not exists group_members (
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

alter table group_members enable row level security;

create policy "group members are viewable by everyone"
  on group_members for select
  using (true);

create policy "users can join groups"
  on group_members for insert
  with check (auth.uid() = user_id);

create policy "users can leave groups"
  on group_members for delete
  using (auth.uid() = user_id);

-- ---------- MESSAGES (group chat) ----------
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table messages enable row level security;

-- Only members of a group (or the creator) can read/send its messages
create policy "members can read group messages"
  on messages for select
  using (
    exists (
      select 1 from group_members
      where group_members.group_id = messages.group_id
      and group_members.user_id = auth.uid()
    )
  );

create policy "members can send group messages"
  on messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from group_members
      where group_members.group_id = messages.group_id
      and group_members.user_id = auth.uid()
    )
  );

-- ---------- BLOCKS ----------
create table if not exists blocked_users (
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

alter table blocked_users enable row level security;

create policy "users can see their own block list"
  on blocked_users for select
  using (auth.uid() = blocker_id);

create policy "users can block others"
  on blocked_users for insert
  with check (auth.uid() = blocker_id);

create policy "users can unblock"
  on blocked_users for delete
  using (auth.uid() = blocker_id);

-- ---------- REPORTS ----------
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  target_id uuid not null references profiles(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now()
);

alter table reports enable row level security;

create policy "users can file reports"
  on reports for insert
  with check (auth.uid() = reporter_id);

create policy "users can see their own filed reports"
  on reports for select
  using (auth.uid() = reporter_id);

-- ---------- REALTIME ----------
-- Enable realtime on messages so the chat page gets live updates.
alter publication supabase_realtime add table messages;

-- ---------- STORAGE ----------
-- Run in the SQL editor too — creates a public bucket for profile photos.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
