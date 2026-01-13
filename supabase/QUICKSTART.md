# Quick Start Guide - Database Setup

This guide will help you get the database up and running in under 5 minutes.

## Prerequisites

- Docker installed and running
- Node.js and npm (already installed if you've set up the project)

## Setup Steps

### 1. Start Supabase

```bash
cd /path/to/ServiceRegistry
npm run db:start
```

**Wait for services to start** (usually takes 30-60 seconds on first run).

You'll see output like:

```
Started supabase local development setup.

         API URL: http://localhost:54321
     GraphQL URL: http://localhost:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGc...
service_role key: eyJhbGc...
```

**Save these credentials** - you'll need them for your `.env` file.

### 2. Verify Migrations

Migrations are automatically applied when you run `npm run db:start`.

To verify, open Supabase Studio: http://localhost:54323

Go to **Table Editor** and check that these tables exist:
- profiles
- equipment
- equipment_counter
- service_entries

### 3. Create Owner Account

1. Open Studio: http://localhost:54323
2. Go to **Authentication** → **Users** → **Add user**
3. Enter:
   - Email: `owner@example.com`
   - Password: `password123`
   - Confirm password: `password123`
4. Click **Create user**
5. **Copy the user's UUID** from the table
6. Go to **Table Editor** → **profiles**
7. Find the profile with the UUID you copied
8. Click to edit
9. Change `role` from `worker` to `owner`
10. Save

### 4. Configure Your App

Create `.env` file in project root:

```env
PUBLIC_SUPABASE_URL=http://localhost:54321
PUBLIC_SUPABASE_ANON_KEY=<paste anon key from step 1>
```

### 5. Start Development Server

```bash
npm run dev
```

Visit: http://localhost:4321

## Quick Commands

| Command | Description |
|---------|-------------|
| `npm run db:start` | Start Supabase |
| `npm run db:stop` | Stop Supabase |
| `npm run db:reset` | Reset database (reapply migrations) |
| `npm run db:status` | Check service status |
| `npm run db:studio` | Open Studio in browser |

## Testing the Database

### Test 1: Create Equipment

```sql
insert into equipment (
  name, category, manufacturer, model, serial_number,
  created_by, updated_by
) values (
  'Test Laptop', 'computer', 'Dell', 'Latitude 5520', 'TEST001',
  '<your-user-uuid>', '<your-user-uuid>'
) returning equipment_id;
```

Expected result: Returns `EQ-2026-00001` (or similar with current year).

### Test 2: Create Service Entry

```sql
insert into service_entries (
  equipment_id,
  service_type,
  description,
  performer_id,
  created_by,
  updated_by
) values (
  (select id from equipment where equipment_id = 'EQ-2026-00001'),
  'inspection',
  'Initial test inspection',
  '<your-user-uuid>',
  '<your-user-uuid>',
  '<your-user-uuid>'
);
```

### Test 3: Query Data

```sql
select 
  e.equipment_id,
  e.name,
  se.service_type,
  se.description
from equipment e
join service_entries se on se.equipment_id = e.id
order by se.created_at desc;
```

## Troubleshooting

### Docker Not Running

**Error**: `Cannot connect to the Docker daemon`

**Solution**: Start Docker Desktop or Docker daemon:
```bash
sudo systemctl start docker
```

### Port Already in Use

**Error**: `Port 54321 is already allocated`

**Solution**: Stop existing Supabase instance:
```bash
npm run db:stop
```

Or change ports in `supabase/config.toml`.

### Migrations Not Applied

**Error**: Tables don't exist after `supabase start`

**Solution**: Reset database:
```bash
npm run db:reset
```

### Can't Create Owner Account

**Error**: Profile is automatically created as worker

**Solution**: This is expected. Update the profile role manually after creation:
```sql
update profiles set role = 'owner' where id = '<user-uuid>';
```

### Authentication Issues

**Error**: Can't login or get 401 errors

**Solution**: 
1. Check `.env` file has correct `PUBLIC_SUPABASE_ANON_KEY`
2. Verify user was created in Studio
3. Check that Supabase is running: `npm run db:status`

## Next Steps

- Read [Database Schema Documentation](../.ai/db-plan.md)
- Check [SQL Usage Examples](./EXAMPLES.md)
- Review [Migrations README](./migrations/README.md)

## Resources

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Supabase Studio Guide](https://supabase.com/docs/guides/database/overview)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
