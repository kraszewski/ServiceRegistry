# Auth API Reference

Quick reference card for authentication endpoints.

---

## 🔐 POST /api/auth/login

**Purpose:** Authenticate user and establish session

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Jan Kowalski",
    "role": "owner" | "worker"
  }
}
```

**Side Effects:**
- Sets HttpOnly cookie: `sb-access-token` (1h)
- Sets HttpOnly cookie: `sb-refresh-token` (7d)

**Error Responses:**
- `400` - Validation error
- `401` - Invalid credentials (generic message)
- `500` - Internal server error

---

## 📝 POST /api/auth/register

**Purpose:** Create new user account

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Jan Kowalski"
}
```

**Success Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Jan Kowalski",
    "role": "owner" | "worker"
  }
}
```

**Logic:**
- First user → `role: "owner"`
- Subsequent users → `role: "worker"`

**Note:** Does NOT establish session. User must log in after registration.

**Error Responses:**
- `400` - Validation error
- `409` - Email already exists
- `500` - Internal server error

---

## 🚪 POST /api/auth/logout

**Purpose:** End user session and clear cookies

**Request:** No body required

**Success Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

**Side Effects:**
- Calls `supabase.auth.signOut()`
- Deletes cookie: `sb-access-token`
- Deletes cookie: `sb-refresh-token`

**Error Responses:**
- `500` - Internal server error

---

## 👤 GET /api/auth/session

**Purpose:** Get current user session information

**Request:** No body required (reads from cookies)

**Success Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Jan Kowalski",
    "role": "owner" | "worker"
  }
}
```

**Error Responses:**
- `401` - Not authenticated / Invalid session
- `404` - Profile not found
- `500` - Internal server error

---

## 🍪 Cookie Details

### sb-access-token
- **Type:** HttpOnly
- **Lifetime:** 1 hour
- **Secure:** Production only
- **SameSite:** Lax
- **Purpose:** Short-lived access token

### sb-refresh-token
- **Type:** HttpOnly
- **Lifetime:** 7 days
- **Secure:** Production only
- **SameSite:** Lax
- **Purpose:** Long-lived refresh token

---

## 🔄 Middleware Behavior

**Every request:**
1. Reads cookies (`sb-access-token`, `sb-refresh-token`)
2. Calls `supabase.auth.setSession()` if cookies present
3. Supabase auto-refreshes expired access token if needed
4. Updated tokens are available to request handlers

**No manual refresh endpoint needed!**

---

## 🎯 Frontend Integration

### LoginForm.tsx
```typescript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

if (response.ok) {
  // Cookies are set automatically by server
  window.location.href = '/equipment';
}
```

### RegisterForm.tsx
```typescript
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, name })
});

if (response.ok) {
  // Redirect to login
  window.location.href = '/login?registered=true';
}
```

### useUser Hook
```typescript
const { user, role, isOwner, isLoading } = useUser();

// Automatically fetches from /api/auth/session
// Returns null user if not authenticated (401)
```

### useRequireAuth Hook
```typescript
const { user, isLoading } = useRequireAuth();

// Redirects to /login if user is null after loading
// Use in protected route components
```

---

## 🔒 Security Features

✅ **HttpOnly Cookies** - Tokens not accessible from JavaScript  
✅ **Secure Flag** - HTTPS only in production  
✅ **SameSite: Lax** - CSRF protection  
✅ **Generic Error Messages** - No information disclosure  
✅ **Server-side Validation** - Zod schemas  
✅ **Auto Token Refresh** - Handled by middleware  

---

## 📋 Validation Rules

### Email
- Required
- Valid email format
- Max 255 characters

### Password
- Required
- Min 8 characters
- Max 72 characters

### Name (registration only)
- Required
- Min 1 character
- Max 100 characters

---

## 🧪 Testing with cURL

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testtest123",
    "name": "Test User"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testtest123"
  }' \
  -c cookies.txt  # Save cookies
```

### Session Check
```bash
curl http://localhost:3000/api/auth/session \
  -b cookies.txt  # Use saved cookies
```

### Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

---

## 🎯 Quick Troubleshooting

**Problem:** Cookies not set  
**Solution:** Check you're using `http://localhost` not `127.0.0.1`

**Problem:** 401 on session endpoint  
**Solution:** Check cookies exist in browser DevTools

**Problem:** "Email confirmation required"  
**Solution:** Disable in Supabase Studio → Authentication settings

**Problem:** Auto-refresh not working  
**Solution:** Verify middleware is running, check terminal logs

---

**Last Updated:** 2026-01-25  
**API Version:** 1.0.0  
**Supabase Auth:** v2.x  
