/*
 * Migration: Create Row Level Security (RLS) policies
 * Purpose: Define fine-grained access control for all tables
 * Tables affected: profiles, equipment, service_entries, equipment_counter
 * Special notes:
 *   - All tables must have RLS enabled (done in table creation migrations)
 *   - Policies are granular: separate for each operation (select, insert, update, delete)
 *   - Policies are role-specific: separate for authenticated role
 *   - equipment_counter is completely hidden from direct access
 *   - Policies use is_owner() helper function for owner-specific operations
 */

-- ============================================================================
-- RLS POLICIES FOR profiles TABLE
-- ============================================================================

-- policy: owner can view all profiles
-- rationale: owners need to see all users for management purposes
create policy "Owner can select all profiles"
  on profiles
  for select
  to authenticated
  using (is_owner());

comment on policy "Owner can select all profiles" on profiles is 'Allows owners to view all user profiles';

-- policy: owner can insert new profiles
-- rationale: owners may need to manually create profiles in special cases
create policy "Owner can insert profiles"
  on profiles
  for insert
  to authenticated
  with check (is_owner());

comment on policy "Owner can insert profiles" on profiles is 'Allows owners to manually create user profiles';

-- policy: owner can update any profile
-- rationale: owners need to manage user roles and information
create policy "Owner can update all profiles"
  on profiles
  for update
  to authenticated
  using (is_owner())
  with check (is_owner());

comment on policy "Owner can update all profiles" on profiles is 'Allows owners to modify any user profile including role changes';

-- policy: owner can delete profiles
-- rationale: owners need to remove users from the system
create policy "Owner can delete profiles"
  on profiles
  for delete
  to authenticated
  using (is_owner());

comment on policy "Owner can delete profiles" on profiles is 'Allows owners to delete user profiles';

-- policy: authenticated users can view their own profile
-- rationale: users need to see their own information
create policy "Users can select own profile"
  on profiles
  for select
  to authenticated
  using (id = auth.uid());

comment on policy "Users can select own profile" on profiles is 'Allows users to view their own profile';

-- policy: authenticated users can update their own profile (except role)
-- rationale: users should manage their own data but not elevate privileges
-- with check: ensures role cannot be changed by user themselves
create policy "Users can update own profile except role"
  on profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid() 
    and role = (select role from profiles where id = auth.uid())
  );

comment on policy "Users can update own profile except role" on profiles is 'Allows users to update their own profile but prevents role changes';

-- ============================================================================
-- RLS POLICIES FOR equipment TABLE
-- ============================================================================

-- policy: authenticated users can view all equipment
-- rationale: all logged-in users need to see equipment inventory
create policy "Authenticated users can select equipment"
  on equipment
  for select
  to authenticated
  using (true);

comment on policy "Authenticated users can select equipment" on equipment is 'Allows all authenticated users to view equipment inventory';

-- policy: authenticated users can add new equipment
-- rationale: all logged-in users can contribute to inventory
create policy "Authenticated users can insert equipment"
  on equipment
  for insert
  to authenticated
  with check (true);

comment on policy "Authenticated users can insert equipment" on equipment is 'Allows all authenticated users to add new equipment';

-- policy: authenticated users can update equipment
-- rationale: all logged-in users can edit equipment information
create policy "Authenticated users can update equipment"
  on equipment
  for update
  to authenticated
  using (true)
  with check (true);

comment on policy "Authenticated users can update equipment" on equipment is 'Allows all authenticated users to modify equipment information';

-- policy: only owners can delete equipment
-- rationale: deletion is a destructive operation reserved for administrators
-- this prevents accidental data loss
create policy "Only owner can delete equipment"
  on equipment
  for delete
  to authenticated
  using (is_owner());

comment on policy "Only owner can delete equipment" on equipment is 'Restricts equipment deletion to owners only to prevent accidental data loss';

-- ============================================================================
-- RLS POLICIES FOR service_entries TABLE
-- ============================================================================

-- policy: authenticated users can view all service entries
-- rationale: all logged-in users need to see service history
create policy "Authenticated users can select service entries"
  on service_entries
  for select
  to authenticated
  using (true);

comment on policy "Authenticated users can select service entries" on service_entries is 'Allows all authenticated users to view service history';

-- policy: authenticated users can add new service entries
-- rationale: all logged-in users can log service operations
create policy "Authenticated users can insert service entries"
  on service_entries
  for insert
  to authenticated
  with check (true);

comment on policy "Authenticated users can insert service entries" on service_entries is 'Allows all authenticated users to log new service operations';

-- policy: authenticated users can update service entries
-- rationale: all logged-in users can edit service logs (e.g., fix typos)
create policy "Authenticated users can update service entries"
  on service_entries
  for update
  to authenticated
  using (true)
  with check (true);

comment on policy "Authenticated users can update service entries" on service_entries is 'Allows all authenticated users to modify service entries';

-- policy: only owners can delete service entries
-- rationale: deletion is a destructive operation reserved for administrators
-- this preserves service history integrity
create policy "Only owner can delete service entries"
  on service_entries
  for delete
  to authenticated
  using (is_owner());

comment on policy "Only owner can delete service entries" on service_entries is 'Restricts service entry deletion to owners only to preserve history integrity';

-- ============================================================================
-- RLS POLICIES FOR equipment_counter TABLE
-- ============================================================================

-- policy: no direct access to equipment_counter for any user
-- rationale: this table is internal and should only be accessed through
-- the generate_equipment_id() function which uses SECURITY DEFINER
-- blocking all direct access prevents tampering with counter state
create policy "No direct access to equipment_counter"
  on equipment_counter
  for all
  to authenticated
  using (false);

comment on policy "No direct access to equipment_counter" on equipment_counter is 'Blocks all direct access; table only accessible through SECURITY DEFINER functions';

-- also block access for anonymous users (not authenticated)
create policy "No anonymous access to equipment_counter"
  on equipment_counter
  for all
  to anon
  using (false);

comment on policy "No anonymous access to equipment_counter" on equipment_counter is 'Blocks all anonymous access to counter table';
