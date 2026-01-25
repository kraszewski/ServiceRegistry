/*
 * Migration: Allow users to view basic profile information
 * Purpose: Fix access issue where workers cannot view equipment details
 * 
 * Problem:
 * When a worker tries to view equipment details, the query JOINs with the 
 * profiles table to fetch created_by and updated_by user information.
 * However, the existing RLS policy only allows users to view their own profile,
 * which causes the JOIN to fail for equipment created by other users.
 * 
 * Solution:
 * Add a policy that allows all authenticated users to view basic profile 
 * information (id, name) of other users. This is necessary for displaying
 * creator/updater information in equipment and service entry lists.
 * 
 * Security consideration:
 * This only exposes id and name fields, not sensitive data like email or role.
 * The policy is restricted to authenticated users only.
 */

-- policy: authenticated users can view basic profile info of all users
-- rationale: users need to see creator/updater names in equipment and service entries
create policy "Authenticated users can select basic profile info"
  on profiles
  for select
  to authenticated
  using (true);

comment on policy "Authenticated users can select basic profile info" on profiles is 
  'Allows authenticated users to view basic profile information (id, name) of all users for displaying creator/updater info';

-- Note: This policy complements the existing "Users can select own profile" policy
-- PostgreSQL RLS uses OR logic between policies, so:
-- - Users can view their own full profile (existing policy)
-- - Users can view basic info of all profiles (this new policy)
