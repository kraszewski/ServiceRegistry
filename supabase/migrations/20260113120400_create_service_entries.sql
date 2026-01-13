/*
 * Migration: Create service_entries table
 * Purpose: Store service operation logs for equipment (inspections, repairs, maintenance)
 * Tables affected: service_entries (created)
 * Special notes:
 *   - Linked to equipment via CASCADE delete (entries removed with equipment)
 *   - Linked to performer via RESTRICT delete (can't delete user with service entries)
 *   - Full audit trail with created_by/updated_by references
 *   - RLS enabled, policies defined in separate migration
 */

-- create service_entries table for logging service operations on equipment
-- includes full audit trail and performer tracking
create table service_entries (
  -- internal uuid primary key
  id uuid primary key default gen_random_uuid(),
  
  -- reference to equipment being serviced
  -- on delete cascade: when equipment is deleted, all its service entries are also deleted
  equipment_id uuid not null references equipment(id) on delete cascade,
  
  -- date and time when service was performed
  -- defaults to current timestamp but can be set to past/future if needed
  service_timestamp timestamptz not null default now(),
  
  -- type of service operation performed
  -- one of: inspection, repair, maintenance
  service_type service_type not null,
  
  -- detailed description of work performed
  -- must be at least 5 characters to ensure meaningful content
  description text not null check (length(description) >= 5),
  
  -- user who performed the service
  -- on delete restrict: prevents deletion of users who have performed service
  -- this preserves service history integrity
  performer_id uuid not null references profiles(id) on delete restrict,
  
  -- audit trail: when was this service entry created
  created_at timestamptz not null default now(),
  
  -- audit trail: which user created this service entry
  -- may differ from performer_id (e.g., admin creating entry for someone else)
  created_by uuid not null references profiles(id),
  
  -- audit trail: when was this service entry last modified
  -- automatically updated by trigger
  updated_at timestamptz not null default now(),
  
  -- audit trail: which user last modified this service entry
  updated_by uuid not null references profiles(id)
);

-- enable row level security on service_entries table
-- policies will be defined in a separate migration
alter table service_entries enable row level security;

-- create composite index for efficiently fetching service entries for specific equipment
-- sorted by service timestamp (newest first)
-- this is the most common query pattern
create index idx_service_entries_equipment_timestamp 
  on service_entries(equipment_id, service_timestamp desc);

-- create index on performer_id for querying entries by specific user
-- useful for "my service history" queries
create index idx_service_entries_performer on service_entries(performer_id);

-- create index on service_type for filtering by operation type
create index idx_service_entries_type on service_entries(service_type);

-- add comments to table and columns for documentation
comment on table service_entries is 'Service operation logs for equipment with full audit trail';
comment on column service_entries.equipment_id is 'Equipment being serviced, cascades on delete';
comment on column service_entries.service_timestamp is 'Date and time when service was performed';
comment on column service_entries.service_type is 'Type of operation: inspection, repair, or maintenance';
comment on column service_entries.description is 'Detailed description of work performed, minimum 5 characters';
comment on column service_entries.performer_id is 'User who performed the service, restricted on delete';
comment on column service_entries.created_by is 'User who created this entry (may differ from performer)';
comment on column service_entries.updated_by is 'User who last modified this entry';
