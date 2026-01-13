# Database Usage Examples

This document provides practical SQL examples for working with the ServiceRegistry database.

## Table of Contents

- [User Management](#user-management)
- [Equipment Operations](#equipment-operations)
- [Service Entry Operations](#service-entry-operations)
- [Queries and Reports](#queries-and-reports)
- [Helper Functions](#helper-functions)

## User Management

### Check Current User's Role

```sql
select get_current_user_role();
```

### Check if Current User is Owner

```sql
select is_owner();
```

### View All Profiles (Owner Only)

```sql
select 
  p.id,
  p.name,
  p.role,
  u.email,
  p.created_at
from profiles p
join auth.users u on u.id = p.id
order by p.created_at desc;
```

### Upgrade User to Owner (Owner Only)

```sql
update profiles
set role = 'owner'
where id = '<user-uuid>';
```

### View Own Profile

```sql
select * from profiles where id = auth.uid();
```

## Equipment Operations

### Add New Equipment

Equipment ID is auto-generated via trigger:

```sql
insert into equipment (
  name,
  category,
  manufacturer,
  model,
  serial_number,
  description,
  location,
  purchase_date,
  created_by,
  updated_by
) values (
  'Dell Latitude 5520',
  'computer',
  'Dell',
  'Latitude 5520',
  'SN123456789',
  'Laptop for office work',
  'Office 2A, Desk 5',
  '2024-01-15',
  auth.uid(),
  auth.uid()
) returning equipment_id;
```

### View All Equipment

```sql
select 
  e.equipment_id,
  e.name,
  e.category,
  e.manufacturer,
  e.model,
  e.serial_number,
  e.location,
  e.purchase_date,
  e.created_at,
  p.name as created_by_name
from equipment e
join profiles p on p.id = e.created_by
order by e.created_at desc;
```

### Search Equipment by ID

```sql
select * from equipment 
where equipment_id = 'EQ-2024-00001';
```

### Update Equipment

```sql
update equipment
set 
  location = 'Office 3B, Desk 12',
  updated_by = auth.uid()
where equipment_id = 'EQ-2024-00001';
```

### Delete Equipment (Owner Only)

```sql
-- This will cascade delete all service_entries
delete from equipment
where equipment_id = 'EQ-2024-00001';
```

## Service Entry Operations

### Add Service Entry

```sql
insert into service_entries (
  equipment_id,
  service_timestamp,
  service_type,
  description,
  performer_id,
  created_by,
  updated_by
) values (
  (select id from equipment where equipment_id = 'EQ-2024-00001'),
  now(),
  'maintenance',
  'Cleaned keyboard and screen, checked battery health',
  auth.uid(),
  auth.uid(),
  auth.uid()
);
```

### View Service History for Equipment

```sql
select 
  se.service_timestamp,
  se.service_type,
  se.description,
  p.name as performer_name,
  se.created_at
from service_entries se
join profiles p on p.id = se.performer_id
where se.equipment_id = (
  select id from equipment where equipment_id = 'EQ-2024-00001'
)
order by se.service_timestamp desc;
```

### View My Service Entries

```sql
select 
  e.equipment_id,
  e.name as equipment_name,
  se.service_timestamp,
  se.service_type,
  se.description
from service_entries se
join equipment e on e.id = se.equipment_id
where se.performer_id = auth.uid()
order by se.service_timestamp desc;
```

### Update Service Entry

```sql
update service_entries
set 
  description = 'Cleaned keyboard and screen, checked battery health, updated BIOS',
  updated_by = auth.uid()
where id = '<service-entry-uuid>';
```

### Delete Service Entry (Owner Only)

```sql
delete from service_entries
where id = '<service-entry-uuid>';
```

## Queries and Reports

### Equipment with Last Service Date

```sql
select 
  e.equipment_id,
  e.name,
  e.category,
  max(se.service_timestamp) as last_service_date,
  count(se.id) as total_services
from equipment e
left join service_entries se on se.equipment_id = e.id
group by e.id, e.equipment_id, e.name, e.category
order by last_service_date desc nulls last;
```

### Service Statistics by Type

```sql
select 
  service_type,
  count(*) as count
from service_entries
group by service_type
order by count desc;
```

### Most Active Service Performers

```sql
select 
  p.name,
  count(se.id) as service_count
from profiles p
join service_entries se on se.performer_id = p.id
group by p.id, p.name
order by service_count desc;
```

### Equipment by Category

```sql
select 
  category,
  count(*) as count
from equipment
group by category
order by count desc;
```

### Equipment Needing Service (No Service in 90 Days)

```sql
select 
  e.equipment_id,
  e.name,
  e.location,
  max(se.service_timestamp) as last_service
from equipment e
left join service_entries se on se.equipment_id = e.id
group by e.id, e.equipment_id, e.name, e.location
having max(se.service_timestamp) < now() - interval '90 days'
   or max(se.service_timestamp) is null
order by last_service nulls first;
```

## Helper Functions

### Generate Equipment ID (Internal Use Only)

This function is called automatically by trigger. You normally don't need to call it directly:

```sql
select generate_equipment_id();
-- Returns: 'EQ-2026-00001'
```

### View Current Counter State (For Debugging)

Owner can query via function (direct access is blocked by RLS):

```sql
-- Note: This won't work due to RLS blocking direct access
-- Counter is managed internally by generate_equipment_id()
```

## Tips and Best Practices

1. **Always use equipment_id for user-facing operations** - The internal UUID `id` is for foreign keys only.

2. **Let triggers handle automation** - Don't manually set `equipment_id`, `updated_at`, or `created_at`.

3. **Use transactions for complex operations**:
   ```sql
   begin;
   -- multiple operations here
   commit;
   ```

4. **Test RLS policies** - Always test as different users to ensure policies work correctly.

5. **Check audit trail** - Use `created_by` and `updated_by` to track who made changes.

6. **Filter equipment by category** - Use the `equipment_category` enum for consistent filtering.

## Common Patterns

### Creating Equipment with Initial Service Entry

```sql
begin;

insert into equipment (
  name, category, manufacturer, model, serial_number,
  created_by, updated_by
) values (
  'HP LaserJet Pro', 'printer', 'HP', 'LaserJet Pro MFP M428fdw', 'SN987654321',
  auth.uid(), auth.uid()
) returning id into equipment_uuid;

insert into service_entries (
  equipment_id, service_type, description,
  performer_id, created_by, updated_by
) values (
  equipment_uuid, 'inspection', 'Initial inspection and setup',
  auth.uid(), auth.uid(), auth.uid()
);

commit;
```

### Bulk Update Location

```sql
update equipment
set 
  location = 'Building B - Storage',
  updated_by = auth.uid()
where category = 'peripheral'
  and location is null;
```

### Export Service History (CSV Format)

```sql
copy (
  select 
    e.equipment_id,
    e.name,
    se.service_timestamp,
    se.service_type,
    se.description,
    p.name as performer
  from service_entries se
  join equipment e on e.id = se.equipment_id
  join profiles p on p.id = se.performer_id
  order by se.service_timestamp desc
) to '/tmp/service_history.csv' with csv header;
```
