/*
 * Migration: Create equipment_counter table
 * Purpose: Generate unique sequential equipment IDs in format EQ-YYYY-NNNNN
 * Tables affected: equipment_counter (created)
 * Special notes:
 *   - Hidden from all users via RLS (USING false)
 *   - Only accessible through SECURITY DEFINER functions
 *   - Separate counter per year for better organization
 */

-- create equipment_counter table for generating unique equipment IDs
-- this table is completely hidden from direct user access through RLS
-- access is only allowed through the generate_equipment_id() function with SECURITY DEFINER
create table equipment_counter (
  -- year for which the counter applies
  -- allows resetting counter each year (EQ-2024-00001, EQ-2025-00001, etc.)
  year integer primary key,
  
  -- current counter value for this year
  -- incremented atomically by generate_equipment_id() function
  counter integer not null default 0
);

-- enable row level security on equipment_counter table
-- this table will have a policy that blocks ALL direct access
-- users can only interact with it through SECURITY DEFINER functions
alter table equipment_counter enable row level security;

-- add comment to table for documentation
comment on table equipment_counter is 'Internal counter for generating unique equipment IDs, hidden from users via RLS';
comment on column equipment_counter.year is 'Year for counter, allows yearly reset of sequence';
comment on column equipment_counter.counter is 'Current counter value, atomically incremented';
