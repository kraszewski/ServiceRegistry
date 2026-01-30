# REST API Plan

## 1. Resources

| Resource | Database Table | Description |
|----------|----------------|-------------|
| Auth | auth.users (Supabase) | Authentication endpoints |
| Users | profiles | User management (linked to auth.users) |
| Equipment | equipment | Equipment inventory management |
| Service Entries | service_entries | Service history entries for equipment |

### Enum Types

**equipment_category**: `computer`, `printer`, `monitor`, `network_device`, `phone`, `tablet`, `peripheral`, `other`

**service_type**: `inspection`, `repair`, `maintenance`

**user_role**: `owner`, `worker`

---

## 2. Endpoints

### 2.2 User Management

User management is restricted to users with the `owner` role.

#### GET /api/users

Lists all users. **Owner only.**

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit: 10 | Items per page (max 100) |

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "string",
      "role": "owner" | "worker",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit: 10,
    "total": 100,
    "totalPages": 2
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - User is not an owner

---

#### POST /api/users

Creates a new worker account. **Owner only.**

**Request Body:**
```json
{
  "email": "worker@example.com",
  "password": "string",
  "name": "string"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "email": "worker@example.com",
  "name": "string",
  "role": "worker",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid request body or validation error
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - User is not an owner
- `409 Conflict` - Email already exists

---

#### GET /api/users/{id}

Gets a specific user's profile. **Owner only.**

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | uuid | User ID |

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "string",
  "role": "owner" | "worker",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - User is not an owner
- `404 Not Found` - User not found

---

#### DELETE /api/users/{id}

Deletes a worker account. **Owner only.** Cannot delete own account or other owners.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | uuid | User ID to delete |

**Response (200 OK):**
```json
{
  "message": "User deleted successfully"
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - User is not an owner, or attempting to delete self/owner
- `404 Not Found` - User not found
- `409 Conflict` - User has service entries as performer (RESTRICT constraint)

---

### 2.3 Equipment Management

#### GET /api/equipment

Lists all equipment with pagination, sorting, and filtering.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit: 10 | Items per page (max 100) |
| sort | string | created_at | Sort field: `created_at`, `name`, `equipment_id`, `category`, `manufacturer` |
| order | string | desc | Sort order: `asc`, `desc` |
| category | string | - | Filter by category (enum value) |
| search | string | - | Search by equipment_id (exact match) |

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "equipment_id": "EQ-2024-00001",
      "name": "string",
      "category": "computer",
      "manufacturer": "string",
      "model": "string",
      "serial_number": "string",
      "description": "string" | null,
      "location": "string" | null,
      "purchase_date": "2024-01-01" | null,
      "created_at": "2024-01-01T00:00:00Z",
      "created_by": {
        "id": "uuid",
        "name": "string"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit: 10,
    "total": 100,
    "totalPages": 2
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid query parameters
- `401 Unauthorized` - Not authenticated

---

#### POST /api/equipment

Creates new equipment. The `equipment_id` is auto-generated.

**Request Body:**
```json
{
  "name": "string",
  "category": "computer",
  "manufacturer": "string",
  "model": "string",
  "serial_number": "string",
  "description": "string" | null,
  "location": "string" | null,
  "purchase_date": "2024-01-01" | null
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "equipment_id": "EQ-2024-00001",
  "name": "string",
  "category": "computer",
  "manufacturer": "string",
  "model": "string",
  "serial_number": "string",
  "description": "string" | null,
  "location": "string" | null,
  "purchase_date": "2024-01-01" | null,
  "created_at": "2024-01-01T00:00:00Z",
  "created_by": "uuid",
  "updated_at": "2024-01-01T00:00:00Z",
  "updated_by": "uuid"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid request body or validation error
- `401 Unauthorized` - Not authenticated
- `409 Conflict` - Serial number already exists

---

#### GET /api/equipment/{id}

Gets equipment details with recent service entries.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | uuid | Equipment UUID |

**Response (200 OK):**
```json
{
  "id": "uuid",
  "equipment_id": "EQ-2024-00001",
  "name": "string",
  "category": "computer",
  "manufacturer": "string",
  "model": "string",
  "serial_number": "string",
  "description": "string" | null,
  "location": "string" | null,
  "purchase_date": "2024-01-01" | null,
  "created_at": "2024-01-01T00:00:00Z",
  "created_by": {
    "id": "uuid",
    "name": "string"
  },
  "updated_at": "2024-01-01T00:00:00Z",
  "updated_by": {
    "id": "uuid",
    "name": "string"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Equipment not found

---

#### PATCH /api/equipment/{id}

Updates equipment. Cannot modify `equipment_id`.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | uuid | Equipment UUID |

**Request Body:** (all fields optional)
```json
{
  "name": "string",
  "category": "computer",
  "manufacturer": "string",
  "model": "string",
  "serial_number": "string",
  "description": "string" | null,
  "location": "string" | null,
  "purchase_date": "2024-01-01" | null
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "equipment_id": "EQ-2024-00001",
  "name": "string",
  "category": "computer",
  "manufacturer": "string",
  "model": "string",
  "serial_number": "string",
  "description": "string" | null,
  "location": "string" | null,
  "purchase_date": "2024-01-01" | null,
  "created_at": "2024-01-01T00:00:00Z",
  "created_by": "uuid",
  "updated_at": "2024-01-01T00:00:00Z",
  "updated_by": "uuid"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid request body or validation error
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Equipment not found
- `409 Conflict` - Serial number already exists (if changed)

---

#### DELETE /api/equipment/{id}

Deletes equipment and all associated service entries (cascade). **Owner only.**

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | uuid | Equipment UUID |

**Response (200 OK):**
```json
{
  "message": "Equipment deleted successfully"
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - User is not an owner
- `404 Not Found` - Equipment not found

---

### 2.4 Service Entries Management

#### GET /api/equipment/{equipmentId}/service-entries

Lists service entries for specific equipment.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| equipmentId | uuid | Equipment UUID |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit: 10 | Items per page (max 100) |

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "equipment_id": "uuid",
      "service_timestamp": "2024-01-01T12:30:00Z",
      "service_type": "inspection" | "repair" | "maintenance",
      "description": "string",
      "performer": {
        "id": "uuid",
        "name": "string"
      },
      "created_at": "2024-01-01T00:00:00Z",
      "created_by": {
        "id": "uuid",
        "name": "string"
      },
      "updated_at": "2024-01-01T00:00:00Z",
      "updated_by": {
        "id": "uuid",
        "name": "string"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit: 10,
    "total": 25,
    "totalPages": 1
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Equipment not found

---

#### POST /api/equipment/{equipmentId}/service-entries

Creates a new service entry for equipment. The `performer_id` is automatically set to the current user.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| equipmentId | uuid | Equipment UUID |

**Request Body:**
```json
{
  "service_timestamp": "2024-01-01T12:30:00Z",
  "service_type": "inspection" | "repair" | "maintenance",
  "description": "string"
}
```

Note: `service_timestamp` defaults to current time if not provided.

**Response (201 Created):**
```json
{
  "id": "uuid",
  "equipment_id": "uuid",
  "service_timestamp": "2024-01-01T12:30:00Z",
  "service_type": "inspection",
  "description": "string",
  "performer_id": "uuid",
  "created_at": "2024-01-01T00:00:00Z",
  "created_by": "uuid",
  "updated_at": "2024-01-01T00:00:00Z",
  "updated_by": "uuid"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid request body or validation error
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Equipment not found

---

#### GET /api/service-entries/{id}

Gets a specific service entry.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | uuid | Service entry UUID |

**Response (200 OK):**
```json
{
  "id": "uuid",
  "equipment_id": "uuid",
  "service_timestamp": "2024-01-01T12:30:00Z",
  "service_type": "inspection" | "repair" | "maintenance",
  "description": "string",
  "performer": {
    "id": "uuid",
    "name": "string"
  },
  "created_at": "2024-01-01T00:00:00Z",
  "created_by": {
    "id": "uuid",
    "name": "string"
  },
  "updated_at": "2024-01-01T00:00:00Z",
  "updated_by": {
    "id": "uuid",
    "name": "string"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Service entry not found

---

#### PATCH /api/service-entries/{id}

Updates a service entry. Cannot modify `performer_id`.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | uuid | Service entry UUID |

**Request Body:** (all fields optional)
```json
{
  "service_timestamp": "2024-01-01T12:30:00Z",
  "service_type": "inspection" | "repair" | "maintenance",
  "description": "string"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "equipment_id": "uuid",
  "service_timestamp": "2024-01-01T12:30:00Z",
  "service_type": "inspection",
  "description": "string",
  "performer_id": "uuid",
  "created_at": "2024-01-01T00:00:00Z",
  "created_by": "uuid",
  "updated_at": "2024-01-01T00:00:00Z",
  "updated_by": "uuid"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid request body or validation error
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Service entry not found

---

#### DELETE /api/service-entries/{id}

Deletes a service entry. **Owner only.**

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | uuid | Service entry UUID |

**Response (200 OK):**
```json
{
  "message": "Service entry deleted successfully"
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - User is not an owner
- `404 Not Found` - Service entry not found

---

## 3. Authentication and Authorization

### 3.1 Authentication Mechanism

The API uses **Supabase Auth** for authentication with JWT tokens.

**Implementation Details:**

1. **Session Management**: Supabase handles session management with access tokens and refresh tokens stored in HTTP-only cookies.

2. **Middleware Integration**: The Astro middleware (`src/middleware/index.ts`) adds the Supabase client to `context.locals`, providing access to the authenticated user in all API routes.

3. **Token Validation**: Each API request validates the session using `supabase.auth.getUser()`.

```typescript
// Example: Getting current user in API route
const { data: { user }, error } = await context.locals.supabase.auth.getUser();
if (error || !user) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
}
```

### 3.2 Authorization Rules

Authorization is enforced at two levels:

**1. Row Level Security (RLS) in Supabase:**
- Configured directly in PostgreSQL
- Enforces access control at the database level
- Prevents unauthorized data access even if API code has bugs

**2. API-level Authorization:**
- Validates user role before performing restricted actions
- Returns appropriate HTTP status codes (403 Forbidden)

| Resource | Action | Owner | Worker |
|----------|--------|-------|--------|
| profiles | Read own | ✓ | ✓ |
| profiles | Read all | ✓ | ✗ |
| profiles | Create | ✓ | ✗ |
| profiles | Delete | ✓ | ✗ |
| equipment | Read | ✓ | ✓ |
| equipment | Create | ✓ | ✓ |
| equipment | Update | ✓ | ✓ |
| equipment | Delete | ✓ | ✗ |
| service_entries | Read | ✓ | ✓ |
| service_entries | Create | ✓ | ✓ |
| service_entries | Update | ✓ | ✓ |
| service_entries | Delete | ✓ | ✗ |

### 3.3 Role Checking Helper

```typescript
// Using the database function is_owner()
async function isOwner(supabase: SupabaseClient): Promise<boolean> {
  const { data } = await supabase.rpc('is_owner');
  return data === true;
}
```

---

## 4. Validation and Business Logic

### 4.1 Validation Rules

All validation is implemented using **Zod schemas** as specified in project guidelines.

#### User Validation

```typescript
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100)
});
```

#### Equipment Validation

```typescript
const equipmentCategoryEnum = z.enum([
  'computer', 'printer', 'monitor', 'network_device',
  'phone', 'tablet', 'peripheral', 'other'
]);

const createEquipmentSchema = z.object({
  name: z.string().min(1).max(100),
  category: equipmentCategoryEnum,
  manufacturer: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  serial_number: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  purchase_date: z.string().date().nullable().optional()
});

const updateEquipmentSchema = createEquipmentSchema.partial();
```

#### Service Entry Validation

```typescript
const serviceTypeEnum = z.enum(['inspection', 'repair', 'maintenance']);

const createServiceEntrySchema = z.object({
  service_timestamp: z.string().datetime().optional(),
  service_type: serviceTypeEnum,
  description: z.string().min(5)
});

const updateServiceEntrySchema = createServiceEntrySchema.partial();
```

### 4.2 Business Logic Implementation

#### Auto-generated Equipment ID

- Format: `EQ-YYYY-NNNNN` (e.g., `EQ-2024-00001`)
- Generated by database trigger `trigger_set_equipment_id` before INSERT
- Uses `equipment_counter` table for atomic counter increment
- The API **does not** accept `equipment_id` in requests; it is always auto-generated

#### Audit Trail

All resources include audit metadata:
- `created_at`: Timestamp when record was created (auto-set by database)
- `created_by`: UUID of user who created the record (set by API from authenticated user)
- `updated_at`: Timestamp when record was last modified (auto-updated by trigger)
- `updated_by`: UUID of user who last modified the record (set by API from authenticated user)

#### Performer Assignment

When creating a service entry:
- `performer_id` is automatically set to the current authenticated user
- `performer_id` cannot be modified after creation
- If `performer_id` is included in update request, it is ignored

#### Cascade Delete

- Deleting equipment cascades to delete all associated service entries
- This is enforced at the database level with `ON DELETE CASCADE`

#### User Deletion Constraints

- Users with service entries as `performer_id` cannot be deleted (RESTRICT)
- API returns `409 Conflict` when attempting to delete such users
- Owner cannot delete their own account through the API

### 4.3 Pagination Implementation

All list endpoints support offset-based pagination:

```typescript
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: 10)
});

// Calculate offset
const offset = (page - 1) * limit;

// Supabase query with pagination
const { data, count } = await supabase
  .from('equipment')
  .select('*', { count: 'exact' })
  .range(offset, offset + limit - 1);
```

### 4.4 Error Handling

All API endpoints follow consistent error response format:

```json
{
  "error": "Error message for client",
  "details": {} // Optional: validation errors or additional info
}
```

**Validation Errors (400):**
```json
{
  "error": "Validation failed",
  "details": {
    "name": ["String must contain at least 1 character(s)"],
    "category": ["Invalid enum value"]
  }
}
```

**Not Found Errors (404):**
```json
{
  "error": "Equipment not found"
}
```

**Authorization Errors (403):**
```json
{
  "error": "Only owner can perform this action"
}
```

### 4.5 API Route File Structure

```
src/pages/api/
├── auth/
│   ├── login.ts
│   ├── logout.ts
│   └── me.ts
├── users/
│   ├── index.ts          # GET (list), POST (create)
│   └── [id].ts           # GET, DELETE
├── equipment/
│   ├── index.ts          # GET (list), POST (create)
│   └── [id]/
│       ├── index.ts      # GET, PATCH, DELETE
│       └── service-entries.ts  # GET (list), POST (create)
└── service-entries/
    └── [id].ts           # GET, PATCH, DELETE
```

Each API route file exports handlers for supported HTTP methods using Astro's API routes pattern:

```typescript
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals, request }) => {
  const supabase = locals.supabase;
  // ... implementation
};

export const POST: APIRoute = async ({ locals, request }) => {
  const supabase = locals.supabase;
  // ... implementation
};
```
