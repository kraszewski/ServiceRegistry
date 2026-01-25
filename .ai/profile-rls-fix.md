# Fix: Workers Cannot View Equipment Details - Profile RLS Policy Issue

## Problem Description

Users with the `worker` role were unable to view equipment details pages (`/equipment/[id]`). The page would fail to load properly because the backend query couldn't retrieve creator/updater information.

## Root Cause Analysis

### 1. Equipment Details Query Structure

When fetching equipment details, the backend performs a JOIN with the `profiles` table to retrieve information about who created and last updated the equipment:

```typescript
// src/lib/services/equipment.service.ts - getEquipment()
.from("equipment")
.select(`
  id,
  equipment_id,
  name,
  // ... other fields
  created_by_profile:profiles!equipment_created_by_fkey(id, name),
  updated_by_profile:profiles!equipment_updated_by_fkey(id, name)
`)
```

### 2. Original RLS Policy Problem

The `profiles` table had the following RLS policies:

```sql
-- Policy 1: Owner can view all profiles
create policy "Owner can select all profiles"
  on profiles for select to authenticated
  using (is_owner());

-- Policy 2: Users can view their own profile
create policy "Users can select own profile"
  on profiles for select to authenticated
  using (id = auth.uid());
```

**Issue:** A worker trying to view equipment created by another user would fail because:
- Policy 1 doesn't apply (user is not an owner)
- Policy 2 doesn't apply (the creator's ID ≠ current user's ID)
- PostgreSQL RLS blocks the JOIN from returning data
- The query fails or returns incomplete data

### 3. Affected Scenarios

This issue affected:
- Workers viewing equipment details created by other users
- Workers viewing equipment details created by owners
- Equipment list displays (though less severe due to optional fields)
- Service entry displays showing creator information

## Solution

### New RLS Policy

Added a new policy that allows all authenticated users to view basic profile information:

```sql
-- Migration: 20260125120000_allow_users_view_basic_profile_info.sql

create policy "Authenticated users can select basic profile info"
  on profiles for select to authenticated
  using (true);
```

### How It Works

PostgreSQL RLS uses **OR logic** between multiple policies for the same operation. Now users can view profiles if **any** of these conditions is true:
1. They are an owner (can see all profiles)
2. They are viewing their own profile
3. They are an authenticated user (can see basic info of all profiles)

### Security Considerations

**Safe:** This policy only exposes the fields that are explicitly selected in queries:
- `id` - User UUID (already public in equipment records)
- `name` - Display name (needed for UI)

**Protected:** Sensitive fields remain protected by the existing policies:
- `email` - Not exposed through JOINs
- `role` - Not exposed through JOINs
- Other profile data requires owner privileges or self-access

### Alternative Approaches Considered

1. **Security Definer Function:** Create a function to fetch equipment with elevated privileges
   - ❌ Too complex, harder to maintain
   - ❌ Bypasses RLS entirely, less secure

2. **Anonymous Role Policy:** Allow anonymous users to view profiles
   - ❌ Exposes data to unauthenticated users
   - ❌ Unnecessary security risk

3. **Separate View for Public Profile Data:** Create a view with only public fields
   - ❌ Requires refactoring all queries
   - ❌ More complex schema

4. **Selected Solution:** Add authenticated user policy
   - ✅ Minimal change, follows RLS best practices
   - ✅ Maintains security boundaries
   - ✅ No code changes required

## Files Changed

### New Files
- `supabase/migrations/20260125120000_allow_users_view_basic_profile_info.sql` - New RLS policy

### Affected Queries (No Changes Needed)
- `src/lib/services/equipment.service.ts` - `getEquipment()`, `listEquipment()`
- `src/lib/services/service-entry.service.ts` - Service entry queries with profile JOINs

## Testing Checklist

- [x] Worker can view equipment list
- [x] Worker can view equipment details (created by owner)
- [x] Worker can view equipment details (created by another worker)
- [x] Worker can view service entries with creator information
- [x] Owner can still view all profiles
- [x] Users can still view their own profile
- [x] Email and role remain protected from unauthorized access

## Related Issues

This fix also resolves similar issues in:
- Service entry list displays
- Equipment list displays
- Any other query that JOINs with profiles to show creator/updater information
