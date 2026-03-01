-- Academy codes table for academy membership verification
create table if not exists academy_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  academy_name text not null,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

-- RLS for academy_codes
alter table academy_codes enable row level security;

-- Authenticated users can read codes (for validation)
create policy "authenticated_read_codes" on academy_codes
  for select using (auth.role() = 'authenticated');

-- Only service role can insert/update/delete codes (admin manages via settings)
-- We'll use the admin's session for code management, so add admin-specific policies
create policy "admin_manage_codes" on academy_codes
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Add email and academy_id columns to profiles
alter table profiles add column if not exists email text;
alter table profiles add column if not exists academy_id uuid references academy_codes(id);

-- Make phone nullable (social login users add phone during onboarding)
alter table profiles alter column phone drop not null;

-- Drop existing phone unique constraint if exists, add partial unique index
-- (phone must be unique when not null, but multiple nulls allowed)
do $$
begin
  -- Drop existing unique constraint on phone if it exists
  if exists (
    select 1 from pg_constraint
    where conname = 'profiles_phone_key' and conrelid = 'profiles'::regclass
  ) then
    alter table profiles drop constraint profiles_phone_key;
  end if;
end $$;

create unique index if not exists idx_profiles_phone_unique
  on profiles (phone) where phone is not null;

-- Policy for users to update their own profile (for onboarding completion)
do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'users_update_own_profile' and tablename = 'profiles'
  ) then
    create policy "users_update_own_profile" on profiles
      for update using (id = auth.uid())
      with check (id = auth.uid());
  end if;
end $$;

-- Policy for users to read their own profile
do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'users_read_own_profile' and tablename = 'profiles'
  ) then
    create policy "users_read_own_profile" on profiles
      for select using (id = auth.uid());
  end if;
end $$;
