/*
 * Migration: Create triggers
 * Purpose: Set up automatic triggers for updated_at, equipment_id generation, and profile creation
 * Tables affected: profiles, equipment, service_entries, auth.users
 * Special notes:
 *   - Triggers execute functions defined in previous migration
 *   - Profile creation trigger fires on auth.users (Supabase auth schema)
 */

-- trigger to automatically update updated_at timestamp on profiles table
-- fires before any update operation
create trigger trigger_profiles_updated_at
  before update on profiles
  for each row
  execute function update_updated_at_column();

-- add comment for documentation
comment on trigger trigger_profiles_updated_at on profiles is 'Automatically updates updated_at timestamp on profile modifications';

-- trigger to automatically update updated_at timestamp on equipment table
-- fires before any update operation
create trigger trigger_equipment_updated_at
  before update on equipment
  for each row
  execute function update_updated_at_column();

-- add comment for documentation
comment on trigger trigger_equipment_updated_at on equipment is 'Automatically updates updated_at timestamp on equipment modifications';

-- trigger to automatically generate equipment_id when new equipment is inserted
-- fires before insert operation, calls generate_equipment_id() function
-- this is the primary mechanism for assigning sequential equipment IDs
create trigger trigger_set_equipment_id
  before insert on equipment
  for each row
  execute function set_equipment_id();

-- add comment for documentation
comment on trigger trigger_set_equipment_id on equipment is 'Automatically generates unique equipment_id in format EQ-YYYY-NNNNN';

-- trigger to automatically update updated_at timestamp on service_entries table
-- fires before any update operation
create trigger trigger_service_entries_updated_at
  before update on service_entries
  for each row
  execute function update_updated_at_column();

-- add comment for documentation
comment on trigger trigger_service_entries_updated_at on service_entries is 'Automatically updates updated_at timestamp on service entry modifications';

-- trigger to automatically create profile after user signs up
-- fires after insert on auth.users table (Supabase auth schema)
-- this ensures every authenticated user has a corresponding profile
-- note: cannot add comment to trigger on auth.users due to schema ownership restrictions
create trigger trigger_create_profile_after_signup
  after insert on auth.users
  for each row
  execute function create_profile_for_new_user();
