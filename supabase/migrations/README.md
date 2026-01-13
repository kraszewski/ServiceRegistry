# Database Migrations

This directory contains PostgreSQL migration files for the ServiceRegistry application using Supabase CLI.

## Migration Files

Migrations are executed in chronological order based on the timestamp prefix:

| File | Purpose |
|------|---------|
| `20260113120000_create_enums.sql` | Creates custom ENUM types (user_role, equipment_category, service_type) |
| `20260113120100_create_profiles.sql` | Creates profiles table with 1:1 link to auth.users |
| `20260113120200_create_equipment_counter.sql` | Creates internal counter table for equipment ID generation |
| `20260113120300_create_equipment.sql` | Creates main equipment inventory table |
| `20260113120400_create_service_entries.sql` | Creates service operation logs table |
| `20260113120500_create_functions.sql` | Creates helper functions (role checks, ID generation, triggers) |
| `20260113120600_create_triggers.sql` | Creates automatic triggers (updated_at, equipment_id, profile creation) |
| `20260113120700_create_rls_policies.sql` | Creates Row Level Security policies for all tables |

## Running Migrations

### Local Development

1. Start Supabase locally:
   ```bash
   npm run db:start
   ```

2. Apply migrations:
   ```bash
   npm run db:reset
   ```

3. Access local Studio at: http://localhost:54323

### Production

1. Link to your project:
   ```bash
   npx supabase link --project-ref your-project-ref
   ```

2. Push migrations:
   ```bash
   npx supabase db push
   ```

## Creating New Migrations

To create a new migration file:

```bash
npx supabase migration new your_migration_name
```

This will create a new file with the correct timestamp format.

## Migration Naming Convention

All migration files follow the format: `YYYYMMDDHHmmss_description.sql`

- `YYYY` - Four-digit year
- `MM` - Two-digit month (01-12)
- `DD` - Two-digit day (01-31)
- `HH` - Two-digit hour in 24-hour format (00-23)
- `mm` - Two-digit minute (00-59)
- `ss` - Two-digit second (00-59)
- `description` - Snake_case description of the migration

Example: `20260113120000_create_enums.sql`

## Key Features

### Security
- All tables have Row Level Security (RLS) enabled
- Granular policies for each operation and role
- SECURITY DEFINER functions with explicit search_path
- equipment_counter table hidden from direct access

### Audit Trail
- Full audit trail on equipment and service_entries
- created_at, created_by, updated_at, updated_by fields
- Automatic updated_at updates via triggers

### Equipment ID Generation
- Unique format: EQ-YYYY-NNNNN
- Thread-safe atomic counter
- Yearly counter reset
- Automatic generation via trigger

### User Management
- Automatic profile creation on signup
- Role-based access control (owner/worker)
- Protected role elevation (only owners can change roles)

## Important Notes

1. **equipment_counter**: Never access directly. Only through `generate_equipment_id()` function.

2. **Owner Account**: Create through Supabase Auth, then manually update role:
   ```sql
   UPDATE profiles SET role = 'owner' WHERE id = '<user-uuid>';
   ```

3. **Cascading Deletes**:
   - Deleting auth.users → deletes profile
   - Deleting equipment → deletes all service_entries
   - Cannot delete profile if user has service_entries as performer

4. **All SQL is lowercase** following PostgreSQL best practices for consistency.

## Database Schema Documentation

For detailed schema documentation, see: `.ai/db-plan.md`
