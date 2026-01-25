/*
 * Migration: Fix first user owner role assignment
 * Purpose: Ensure the first user is automatically assigned owner role
 * Changes: Update create_profile_for_new_user() function to check if this is the first user
 * 
 * Previously: All users were created as 'worker', then register endpoint tried to upgrade first user
 * Problem: Race condition and timing issues meant first user might not get owner role
 * Solution: Atomically check user count and assign role in the trigger function
 */

-- Replace the trigger function to check if this is the first user
-- If it is, assign 'owner' role, otherwise 'worker'
create or replace function create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_count integer;
  assigned_role user_role;
begin
  -- atomically count existing profiles
  -- this happens in the same transaction as the insert
  select count(*) into user_count from profiles;
  
  -- if no users exist yet, this is the first user (owner)
  -- otherwise, new user is a worker
  if user_count = 0 then
    assigned_role := 'owner';
  else
    assigned_role := 'worker';
  end if;
  
  -- insert new profile with data from auth.users
  insert into profiles (id, name, role)
  values (
    new.id,
    -- use name from metadata if available, otherwise default
    coalesce(new.raw_user_meta_data->>'name', 'Nowy użytkownik'),
    -- assign role based on whether this is first user
    assigned_role
  );
  
  return new;
end;
$$;

-- add comment for documentation
comment on function create_profile_for_new_user is 'Trigger function to automatically create profile when user signs up. First user gets owner role, rest get worker role.';
