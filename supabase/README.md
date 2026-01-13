# Supabase Database Configuration

This directory contains all database-related configuration, migrations, and documentation for the ServiceRegistry application.

## 📁 Directory Structure

```
supabase/
├── config.toml           # Supabase CLI configuration
├── seed.sql              # Initial database seed data
├── .gitignore            # Git ignore rules for Supabase
├── migrations/           # Database migration files
│   ├── README.md         # Migration documentation
│   ├── 20260113120000_create_enums.sql
│   ├── 20260113120100_create_profiles.sql
│   ├── 20260113120200_create_equipment_counter.sql
│   ├── 20260113120300_create_equipment.sql
│   ├── 20260113120400_create_service_entries.sql
│   ├── 20260113120500_create_functions.sql
│   ├── 20260113120600_create_triggers.sql
│   └── 20260113120700_create_rls_policies.sql
├── QUICKSTART.md         # Quick setup guide (START HERE!)
├── EXAMPLES.md           # SQL usage examples
└── README.md             # This file
```

## 🚀 Quick Links

- **New to the project?** → [Quick Start Guide](./QUICKSTART.md)
- **Need SQL examples?** → [Usage Examples](./EXAMPLES.md)
- **Working with migrations?** → [Migrations README](./migrations/README.md)
- **Schema documentation** → [DB Plan](../.ai/db-plan.md)

## 📊 Database Overview

### Tables

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `profiles` | User profiles and roles | 1:1 with auth.users, auto-created on signup |
| `equipment` | Equipment inventory | Auto-generated IDs (EQ-YYYY-NNNNN), full audit trail |
| `service_entries` | Service operation logs | Linked to equipment and performer, cascading delete |
| `equipment_counter` | Internal ID counter | Hidden via RLS, accessed only by SECURITY DEFINER functions |

### ENUM Types

- `user_role`: `owner`, `worker`
- `equipment_category`: `computer`, `printer`, `monitor`, `network_device`, `phone`, `tablet`, `peripheral`, `other`
- `service_type`: `inspection`, `repair`, `maintenance`

### Key Features

✅ **Row Level Security (RLS)** - All tables protected with granular policies  
✅ **Automatic Audit Trail** - created_at/by, updated_at/by on all records  
✅ **Equipment ID Generation** - Thread-safe, yearly counter reset  
✅ **Trigger Automation** - Auto-update timestamps, profiles, IDs  
✅ **Cascading Deletes** - Maintain referential integrity  
✅ **Role-Based Access** - Owner vs Worker permissions  

## 🛠️ Development Workflow

### Initial Setup

```bash
# Install dependencies (includes Supabase CLI)
npm install

# Start local Supabase (requires Docker)
npm run db:start

# Access Studio
npm run db:studio
```

### Daily Development

```bash
# Check status
npm run db:status

# Reset database (reapply migrations)
npm run db:reset

# Stop services
npm run db:stop
```

### Creating New Migrations

```bash
# Create new migration file
npx supabase migration new your_migration_name

# Edit the generated file in supabase/migrations/

# Test migration
npm run db:reset

# Check in Studio that changes applied correctly
npm run db:studio
```

### Deploying to Production

```bash
# Link to your Supabase project
npx supabase link --project-ref your-project-ref

# Push migrations
npx supabase db push

# Verify in production Studio
```

## 📝 Migration Files

Migrations are executed in chronological order:

1. **Enums** - Custom types (user_role, equipment_category, service_type)
2. **Profiles** - User profiles table with RLS
3. **Equipment Counter** - Internal counter for ID generation
4. **Equipment** - Main inventory table
5. **Service Entries** - Service logs table
6. **Functions** - Helper functions (role checks, ID generation)
7. **Triggers** - Automatic updates (timestamps, IDs, profiles)
8. **RLS Policies** - Row level security policies

Each migration follows PostgreSQL best practices:
- Lowercase SQL
- Extensive comments
- SECURITY DEFINER where needed
- Explicit search_path setting

## 🔐 Security Features

### Row Level Security

All tables have RLS enabled with granular policies:

- **Profiles**: Users see own profile, owners see all
- **Equipment**: All authenticated users can read/write, only owners delete
- **Service Entries**: All authenticated users can read/write, only owners delete
- **Equipment Counter**: Completely hidden, accessed only via functions

### Functions

All security-critical functions use `SECURITY DEFINER` with `SET search_path = public`:

- `is_owner()` - Check if current user is owner
- `get_current_user_role()` - Get current user's role
- `generate_equipment_id()` - Generate unique equipment ID
- `create_profile_for_new_user()` - Auto-create profile on signup

## 📖 Documentation

- [Quick Start Guide](./QUICKSTART.md) - Get up and running in 5 minutes
- [Usage Examples](./EXAMPLES.md) - SQL queries and patterns
- [Migrations README](./migrations/README.md) - Migration details
- [Database Plan](../.ai/db-plan.md) - Complete schema documentation

## 🐛 Troubleshooting

### Common Issues

**Problem**: Tables don't exist after `supabase start`  
**Solution**: Run `npm run db:reset` to reapply migrations

**Problem**: Can't create owner account  
**Solution**: Create user via Studio, then manually update profile role to 'owner'

**Problem**: RLS blocking queries  
**Solution**: Ensure you're authenticated and have correct permissions

**Problem**: Equipment ID not generating  
**Solution**: Check trigger is enabled: `SELECT * FROM pg_trigger WHERE tgname = 'trigger_set_equipment_id';`

### Getting Help

1. Check [QUICKSTART.md](./QUICKSTART.md) troubleshooting section
2. Review [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
3. Check migration comments for specific table behavior

## 📞 Support

For database-related questions:
1. Review the [Database Plan](../.ai/db-plan.md)
2. Check [SQL Examples](./EXAMPLES.md)
3. Open an issue in the repository

## 🔄 Version History

- **v1.0** (2026-01-13) - Initial database schema with 8 migrations
  - Core tables: profiles, equipment, service_entries, equipment_counter
  - Full RLS implementation
  - Automatic ID generation
  - Audit trail triggers
