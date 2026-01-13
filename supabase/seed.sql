/*
 * Seed data for ServiceRegistry database
 * Purpose: Initialize database with essential data for development and testing
 * 
 * IMPORTANT NOTES:
 * ================
 * 1. This file is executed AFTER all migrations when running `supabase db reset`
 * 
 * 2. Creating the owner account:
 *    - In production, create the first owner account through Supabase Auth Dashboard
 *      or Auth API (signUp method), then manually update the role
 *    
 *    - Steps to create owner account:
 *      a) Create user through Supabase Auth (Dashboard or API)
 *      b) The trigger will automatically create a profile with role='worker'
 *      c) Manually update the profile role:
 *         UPDATE profiles SET role = 'owner' WHERE id = '<user-id-from-auth>';
 * 
 * 3. For local development:
 *    - You can use Supabase CLI to create test users
 *    - Example: Use Supabase Studio (http://localhost:54323) after `supabase start`
 * 
 * 4. Security considerations:
 *    - NEVER commit actual passwords or credentials to version control
 *    - Use environment variables or secure secret management in production
 *    - This seed file should only contain non-sensitive test data
 */

-- seed data will be added here as needed for development
-- for now, the database schema is complete and ready for use

-- example: if you want to seed some equipment categories or test data,
-- you would add INSERT statements here

-- uncomment below to add sample test data (for development only)
/*
-- example: insert test equipment counter initialization
insert into equipment_counter (year, counter) 
values (extract(year from now())::integer, 0)
on conflict (year) do nothing;
*/
