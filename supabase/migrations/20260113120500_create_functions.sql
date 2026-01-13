/*
 * Migration: Create helper functions
 * Purpose: Define utility functions for role checking, equipment ID generation, and triggers
 * Tables affected: None (functions are standalone)
 * Special notes:
 *   - All functions use SECURITY DEFINER with SET search_path for security
 *   - generate_equipment_id() is the only way to modify equipment_counter
 *   - Trigger functions for automatic field updates
 */

-- function to get the current user's role
-- used in RLS policies and application logic
-- security definer allows reading from profiles even with RLS enabled
create or replace function get_current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

-- add comment for documentation
comment on function get_current_user_role is 'Returns the role of the currently authenticated user';

-- function to check if current user is an owner
-- used extensively in RLS policies for owner-only operations
-- security definer allows reading from profiles even with RLS enabled
create or replace function is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles 
    where id = auth.uid() and role = 'owner'
  );
$$;

-- add comment for documentation
comment on function is_owner is 'Returns true if the currently authenticated user has owner role';

-- function to generate unique equipment ID in format EQ-YYYY-NNNNN
-- this is the ONLY way to access and modify equipment_counter table
-- security definer bypasses RLS to allow atomic counter updates
create or replace function generate_equipment_id()
returns varchar(15)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_year integer;
  next_counter integer;
  new_equipment_id varchar(15);
begin
  -- get current year for counter partitioning
  current_year := extract(year from now());
  
  -- atomically insert new year or increment existing counter
  -- this is thread-safe and handles concurrent requests
  insert into equipment_counter (year, counter)
  values (current_year, 1)
  on conflict (year) do update 
  set counter = equipment_counter.counter + 1
  returning counter into next_counter;
  
  -- format equipment ID: EQ-YYYY-NNNNN
  -- counter is padded with leading zeros to 5 digits
  new_equipment_id := 'EQ-' || current_year || '-' || lpad(next_counter::text, 5, '0');
  
  return new_equipment_id;
end;
$$;

-- add comment for documentation
comment on function generate_equipment_id is 'Generates unique equipment ID in format EQ-YYYY-NNNNN, thread-safe';

-- trigger function to automatically update updated_at timestamp
-- used by multiple tables (profiles, equipment, service_entries)
create or replace function update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  -- set updated_at to current timestamp
  new.updated_at = now();
  return new;
end;
$$;

-- add comment for documentation
comment on function update_updated_at_column is 'Trigger function to automatically update updated_at column on row update';

-- trigger function to automatically set equipment_id before insert
-- calls generate_equipment_id() if equipment_id is null
-- security definer allows calling generate_equipment_id which accesses equipment_counter
create or replace function set_equipment_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- only generate ID if not explicitly provided
  if new.equipment_id is null then
    new.equipment_id := generate_equipment_id();
  end if;
  return new;
end;
$$;

-- add comment for documentation
comment on function set_equipment_id is 'Trigger function to automatically generate equipment_id before insert';

-- trigger function to automatically create profile when user signs up
-- creates a profile entry linked to the new auth.users record
-- security definer allows inserting into profiles even with RLS enabled
create or replace function create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- insert new profile with data from auth.users
  insert into profiles (id, name, role)
  values (
    new.id,
    -- use name from metadata if available, otherwise default
    coalesce(new.raw_user_meta_data->>'name', 'Nowy użytkownik'),
    -- all new users start as workers
    'worker'
  );
  return new;
end;
$$;

-- add comment for documentation
comment on function create_profile_for_new_user is 'Trigger function to automatically create profile when user signs up';
