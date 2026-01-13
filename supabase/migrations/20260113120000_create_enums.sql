/*
 * Migration: Create ENUM types
 * Purpose: Define custom ENUM types for user roles, equipment categories, and service types
 * Tables affected: None (defines types used by future tables)
 * Special notes: These types must be created before tables that use them
 */

-- create enum type for user roles
-- defines two possible roles: owner (full access) and worker (standard user)
create type user_role as enum ('owner', 'worker');

-- create enum type for equipment categories
-- defines standard hardware categories for classification
create type equipment_category as enum (
  'computer',
  'printer', 
  'monitor',
  'network_device',
  'phone',
  'tablet',
  'peripheral',
  'other'
);

-- create enum type for service operations
-- defines three types of service activities that can be logged
create type service_type as enum (
  'inspection',
  'repair',
  'maintenance'
);
