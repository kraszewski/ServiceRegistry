# API Endpoint Implementation Plan: GET /api/users/{id}

## 1. Przegląd punktu końcowego

Endpoint `GET /api/users/{id}` służy do pobierania szczegółowych informacji o profilu konkretnego użytkownika. Endpoint jest dostępny wyłącznie dla użytkowników z rolą `owner`. Zwraca dane profilowe użytkownika wraz z adresem email pobranym z tabeli `auth.users`.

**Cel biznesowy:** Umożliwienie właścicielom systemu przeglądania szczegółów kont użytkowników w celu weryfikacji danych, audytu lub przed wykonaniem operacji administracyjnych.

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/users/{id}`
- **Lokalizacja pliku:** `src/pages/api/users/[id].ts`

### Parametry

#### Path Parameters

| Parametr | Typ | Wymagany | Opis | Walidacja |
|----------|-----|----------|------|-----------|
| `id` | UUID | Tak | Identyfikator użytkownika | Format UUID v4 |

#### Query Parameters

Brak

### Request Body

Brak - endpoint GET nie przyjmuje body.

### Nagłówki

| Nagłówek | Wymagany | Opis |
|----------|----------|------|
| `Cookie` | Tak | Sesja uwierzytelniania Supabase (sb-access-token, sb-refresh-token) |

## 3. Wykorzystywane typy

### Istniejące typy z `src/types.ts`

```typescript
// DTO dla szczegółów użytkownika (GET /api/users/{id})
interface UserDTO extends UserListItemDTO {
  updated_at: string;  // Data ostatniej modyfikacji z profiles.updated_at
}

// Bazowy DTO
interface UserListItemDTO {
  id: string;           // UUID z profiles.id
  email: string;        // Email z auth.users (nie przechowywany w profiles)
  name: string;         // Nazwa z profiles.name
  role: UserRole;       // Rola z profiles.role ('owner' | 'worker')
  created_at: string;   // Data utworzenia z profiles.created_at
}

// Standardowa odpowiedź błędu
interface ErrorResponse {
  error: string;
  details?: Record<string, string[]> | Record<string, unknown>;
}
```

### Nowe typy/schematy do utworzenia

```typescript
// Zod schema dla walidacji UUID (src/lib/schemas/user.schema.ts)
import { z } from 'zod';

export const userIdSchema = z.object({
  id: z.string().uuid('Invalid user ID format')
});

export type UserIdInput = z.infer<typeof userIdSchema>;
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "worker@example.com",
  "name": "Anna Nowak",
  "role": "worker",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T15:45:00Z"
}
```

### Błędy

| Status | Opis | Przykładowa odpowiedź |
|--------|------|----------------------|
| 400 | Nieprawidłowy format UUID | `{"error": "Validation failed", "details": {"id": ["Invalid user ID format"]}}` |
| 401 | Brak uwierzytelnienia | `{"error": "Unauthorized"}` |
| 403 | Użytkownik nie jest właścicielem | `{"error": "Only owner can perform this action"}` |
| 404 | Użytkownik nie istnieje | `{"error": "User not found"}` |
| 500 | Błąd serwera | `{"error": "Internal server error"}` |

## 5. Przepływ danych

```
┌─────────────────┐
│   Klient HTTP   │
└────────┬────────┘
         │ GET /api/users/{id}
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Route Handler                         │
│  src/pages/api/users/[id].ts                                │
├─────────────────────────────────────────────────────────────┤
│  1. Parsowanie i walidacja path param (Zod)                 │
│  2. Sprawdzenie autentykacji (supabase.auth.getUser())      │
│  3. Sprawdzenie autoryzacji (supabase.rpc('is_owner'))      │
│  4. Wywołanie UserService.getUser()                         │
│  5. Formatowanie i zwrot odpowiedzi                         │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                      UserService                             │
│  src/lib/services/user.service.ts                           │
├─────────────────────────────────────────────────────────────┤
│  1. Pobranie profilu z tabeli profiles                      │
│  2. Sprawdzenie czy użytkownik istnieje (404)               │
│  3. Pobranie emaila z auth.users (admin API)                │
│  4. Złączenie danych i zwrot UserDTO                        │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                                │
├──────────────────────┬──────────────────────────────────────┤
│  profiles (public)   │  auth.users (Supabase Auth)          │
│  - id               │  - id                                 │
│  - name             │  - email                              │
│  - role             │                                       │
│  - created_at       │                                       │
│  - updated_at       │                                       │
└──────────────────────┴──────────────────────────────────────┘
```

### Szczegółowy przepływ

1. **Klient** wysyła żądanie GET z UUID użytkownika w ścieżce
2. **API Route** waliduje format UUID za pomocą Zod schema
3. **API Route** sprawdza sesję użytkownika przez `supabase.auth.getUser()`
4. **API Route** weryfikuje rolę `owner` przez `supabase.rpc('is_owner')`
5. **UserService** pobiera profil z tabeli `profiles` po ID
6. **UserService** sprawdza czy użytkownik istnieje (jeśli nie - rzuca błąd)
7. **UserService** pobiera email z `auth.users` używając Supabase Admin API
8. **UserService** zwraca dane jako `UserDTO`
9. **API Route** zwraca odpowiedź 200 OK

## 6. Względy bezpieczeństwa

### Uwierzytelnienie

- Weryfikacja sesji przez `supabase.auth.getUser()` na początku handlera
- Sprawdzenie czy `user` oraz `user.id` istnieją
- Odrzucenie żądania z kodem 401 jeśli brak ważnej sesji

### Autoryzacja

- Użycie funkcji bazodanowej `is_owner()` do weryfikacji roli
- Tylko użytkownicy z rolą `owner` mogą wywoływać ten endpoint
- RLS policies na tabeli `profiles` zapewniają dodatkową warstwę ochrony

### Walidacja danych wejściowych

- Walidacja UUID przez Zod (`z.string().uuid()`)
- Odrzucenie nieprawidłowych formatów z kodem 400
- Ochrona przed SQL injection (parametryzowane zapytania Supabase)

### Dostęp do auth.users

- Wymagany Supabase Admin Client (service role key) do pobierania emaila
- Service role key przechowywany bezpiecznie w zmiennych środowiskowych
- Nigdy nie eksponować service role key po stronie klienta

### Ochrona przed IDOR

- Sprawdzenie autoryzacji (owner) przed każdą operacją
- Brak możliwości dostępu do danych użytkowników bez odpowiedniej roli

### Ochrona przed wyciekiem danych

- Zwracanie tylko niezbędnych pól (bez haseł, tokenów, wrażliwych metadanych)
- Brak zwracania wewnętrznych identyfikatorów Supabase Auth

## 7. Obsługa błędów

### Scenariusze błędów

| Scenariusz | Kod HTTP | Komunikat | Akcja |
|------------|----------|-----------|-------|
| Nieprawidłowy format UUID | 400 | "Validation failed" + details | Poprawienie formatu ID |
| Brak tokena sesji | 401 | "Unauthorized" | Przekierowanie do logowania |
| Nieważna sesja | 401 | "Unauthorized" | Ponowne zalogowanie |
| Użytkownik nie jest owner | 403 | "Only owner can perform this action" | Wyświetlenie komunikatu |
| Użytkownik nie istnieje | 404 | "User not found" | Informacja o braku użytkownika |
| Błąd bazy danych | 500 | "Internal server error" | Logowanie błędu, retry |
| Błąd pobierania emaila | 500 | "Internal server error" | Logowanie błędu |

### Implementacja obsługi błędów

```typescript
export const GET: APIRoute = async ({ locals, params }) => {
  // 1. Walidacja path param
  const validationResult = userIdSchema.safeParse({ id: params.id });
  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: 'Validation failed',
        details: validationResult.error.flatten().fieldErrors
      }),
      { status: 400 }
    );
  }

  // 2. Sprawdzenie autentykacji
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401 }
    );
  }

  // 3. Sprawdzenie autoryzacji
  const { data: isOwner } = await supabase.rpc('is_owner');
  if (!isOwner) {
    return new Response(
      JSON.stringify({ error: 'Only owner can perform this action' }),
      { status: 403 }
    );
  }

  // 4. Happy path
  try {
    const result = await userService.getUser(id);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    if (error.message === 'User not found') {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404 }
      );
    }
    console.error('Error fetching user:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
};
```

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

1. **Pobieranie emaila z auth.users** - wymaga osobnego zapytania do Admin API
2. **Dwa zapytania sekwencyjne** - profiles + auth.users

### Strategie optymalizacji

1. **Single query optimization:**
   - Jedno zapytanie do `profiles` po konkretnym ID
   - Jedno zapytanie do Admin API po pojedynczy email
   - Brak N+1 problemu (pojedynczy user)

2. **Indeksy bazodanowe:**
   - `profiles.id` - PRIMARY KEY (automatyczny indeks)
   - Brak potrzeby dodatkowych indeksów dla single-record operations

3. **Cache (przyszła optymalizacja):**
   - Dane użytkownika rzadko się zmieniają
   - Możliwość cache'owania z invalidacją przy update

### Limity

- Timeout zapytania: standardowy timeout Supabase
- Rate limiting: standardowe limity Supabase

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie schematu walidacji użytkownika

**Plik:** `src/lib/schemas/user.schema.ts`

Dodanie nowego schematu do istniejącego pliku:

```typescript
import { z } from 'zod';

// Istniejący schemat createUserSchema...

/**
 * Schema for validating user ID path parameter.
 * Used in GET /api/users/{id} and DELETE /api/users/{id}.
 */
export const userIdSchema = z.object({
  id: z.string().uuid('Invalid user ID format')
});

export type UserIdInput = z.infer<typeof userIdSchema>;
```

### Krok 2: Rozszerzenie UserService o metodę getUser

**Plik:** `src/lib/services/user.service.ts`

Dodanie nowej metody do klasy `UserService`:

```typescript
import type { UserDTO } from '../../types';

/**
 * Fetches a single user by ID.
 *
 * This method retrieves user profile from the database and enriches it
 * with email address from Supabase Auth (auth.users).
 *
 * @param id - User UUID
 * @returns User details as UserDTO
 * @throws Error with message "User not found" if user doesn't exist
 * @throws Error if database query fails or auth user cannot be fetched
 */
async getUser(id: string): Promise<UserDTO> {
  // 1. Fetch profile by ID
  const { data: profile, error } = await this.supabase
    .from('profiles')
    .select('id, name, role, created_at, updated_at')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('User not found');
    }
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  // 2. Fetch email from auth.users using Admin API
  const { data: authData, error: authError } = await supabaseAdmin
    .auth
    .admin
    .getUserById(id);

  if (authError) {
    throw new Error(`Failed to fetch auth user: ${authError.message}`);
  }

  // 3. Return user as DTO
  return {
    id: profile.id,
    email: authData.user?.email || '',
    name: profile.name,
    role: profile.role,
    created_at: profile.created_at,
    updated_at: profile.updated_at
  };
}
```

### Krok 3: Utworzenie API Route dla GET /api/users/[id]

**Plik:** `src/pages/api/users/[id].ts`

```typescript
/**
 * API Endpoints: /api/users/{id}
 *
 * GET /api/users/{id} - Returns a specific user's profile (owner only)
 * DELETE /api/users/{id} - Deletes a worker account (owner only)
 */
import type { APIRoute } from 'astro';

import { userIdSchema } from '../../../lib/schemas/user.schema';
import { createUserService } from '../../../lib/services/user.service';
import type { ErrorResponse } from '../../../types';

export const prerender = false;

/**
 * GET /api/users/{id}
 *
 * Returns a specific user's profile including email, name, role, and timestamps.
 * Only accessible by users with the 'owner' role.
 *
 * Path Parameters:
 * - id (required): User UUID
 *
 * Responses:
 * - 200: Success with user details
 * - 400: Validation error (invalid UUID format)
 * - 401: Unauthorized (no valid session)
 * - 403: Forbidden (user is not an owner)
 * - 404: User not found
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ locals, params }) => {
  const supabase = locals.supabase;

  // 1. Validate path parameter
  const validationResult = userIdSchema.safeParse({ id: params.id });
  if (!validationResult.success) {
    const errorResponse: ErrorResponse = {
      error: 'Validation failed',
      details: validationResult.error.flatten().fieldErrors
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { id } = validationResult.data;

  // 2. Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    const errorResponse: ErrorResponse = { error: 'Unauthorized' };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 3. Check authorization (owner only)
  const { data: isOwner, error: roleError } = await supabase.rpc('is_owner');
  if (roleError || !isOwner) {
    const errorResponse: ErrorResponse = {
      error: 'Only owner can perform this action'
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 4. Fetch user details
  try {
    const userService = createUserService(supabase);
    const result = await userService.getUser(id);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching user:', error);

    // Handle not found error
    if (error instanceof Error && error.message === 'User not found') {
      const errorResponse: ErrorResponse = { error: 'User not found' };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const errorResponse: ErrorResponse = { error: 'Internal server error' };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

### Krok 4: Aktualizacja importów w UserService

**Plik:** `src/lib/services/user.service.ts`

```typescript
import type { CreateUserCommand, UserDTO, UserListItemDTO, UserListResponse } from '../../types';
```

### Krok 5: Aktualizacja struktury katalogów

```
src/
├── lib/
│   ├── schemas/
│   │   ├── pagination.schema.ts   # Istniejący
│   │   └── user.schema.ts         # Rozszerzony o userIdSchema
│   └── services/
│       └── user.service.ts        # Rozszerzony o getUser()
├── db/
│   ├── supabase.client.ts         # Istniejący
│   └── supabase.admin.ts          # Istniejący
└── pages/
    └── api/
        └── users/
            ├── index.ts           # Istniejący (GET list, POST create)
            └── [id].ts            # Nowy (GET detail)
```

### Krok 6: Testy manualne

1. **Test bez autentykacji:**
   ```bash
   curl -X GET http://localhost:4321/api/users/550e8400-e29b-41d4-a716-446655440000
   # Oczekiwany: 401 Unauthorized
   ```

2. **Test z autentykacją (worker):**
   ```bash
   # Po zalogowaniu jako worker
   curl -X GET http://localhost:4321/api/users/550e8400-e29b-41d4-a716-446655440000 \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 403 Forbidden
   ```

3. **Test z autentykacją (owner) - sukces:**
   ```bash
   # Po zalogowaniu jako owner
   curl -X GET http://localhost:4321/api/users/550e8400-e29b-41d4-a716-446655440000 \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 200 OK z danymi użytkownika
   ```

4. **Test nieprawidłowego UUID:**
   ```bash
   curl -X GET http://localhost:4321/api/users/invalid-uuid \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 400 Bad Request
   ```

5. **Test nieistniejącego użytkownika:**
   ```bash
   curl -X GET http://localhost:4321/api/users/00000000-0000-0000-0000-000000000000 \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 404 Not Found
   ```

## 10. Checklist przed wdrożeniem

- [ ] Rozszerzono `src/lib/schemas/user.schema.ts` o `userIdSchema`
- [ ] Rozszerzono `UserService` o metodę `getUser()`
- [ ] Zaktualizowano importy typów w `UserService` o `UserDTO`
- [ ] Utworzono `src/pages/api/users/[id].ts` z handlerem GET
- [ ] Przeprowadzono testy manualne wszystkich scenariuszy
- [ ] Sprawdzono czy linter nie zgłasza błędów
- [ ] Zweryfikowano działanie z rzeczywistą bazą Supabase
- [ ] Sprawdzono logowanie błędów w konsoli serwera
