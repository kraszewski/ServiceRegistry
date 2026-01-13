/*
 * Migration: Create profiles table
 * Purpose: Store extended user profile information linked to auth.users
 * Tables affected: profiles (created)
 * Special notes: 
 *   - 1:1 relationship with auth.users via CASCADE delete
 *   - Automatically created via trigger when user signs up
 *   - RLS enabled, policies defined in separate migration
 */

-- create profiles table to extend auth.users with application-specific data
-- this table has a 1:1 relationship with auth.users
create table profiles (
  -- primary key linked to supabase auth.users
  -- when auth user is deleted, profile is automatically removed (cascade)
  id uuid primary key references auth.users(id) on delete cascade,
  
  -- user's display name
  -- must not be empty (minimum 1 character)
  name varchar(100) not null check (length(name) >= 1),
  
  -- user's role in the system
  -- defaults to 'worker' for new accounts
  -- only owners can elevate privileges
  role user_role not null default 'worker',
  
  -- timestamp of profile creation
  created_at timestamptz not null default now(),
  
  -- timestamp of last profile update
  -- automatically updated by trigger
  updated_at timestamptz not null default now()
);

-- enable row level security on profiles table
-- policies will be defined in a separate migration
alter table profiles enable row level security;

-- create index on name for searching/sorting users
create index idx_profiles_name on profiles(name);

-- add comment to table for documentation
comment on table profiles is 'Extended user profiles linked to auth.users in 1:1 relationship';
comment on column profiles.id is 'User ID from auth.users, cascades on delete';
comment on column profiles.name is 'Display name, minimum 1 character';
comment on column profiles.role is 'User role: owner (full access) or worker (standard)';
