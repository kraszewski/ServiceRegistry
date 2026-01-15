# API Endpoint Implementation Plan: POST /api/users

## 1. Przegląd punktu końcowego

Endpoint `POST /api/users` służy do tworzenia nowych kont użytkowników typu `worker`. Endpoint jest dostępny wyłącznie dla użytkowników z rolą `owner`. Operacja tworzy wpis w tabeli `auth.users` (Supabase Auth) oraz powiązany rekord w tabeli `profiles`.

**Cel biznesowy:** Umożliwienie właścicielom systemu tworzenia nowych kont pracowników (workerów), którzy będą mogli korzystać z systemu do zarządzania sprzętem i wpisami serwisowymi.

**Kluczowe założenia:**
- Nowo utworzeni użytkownicy zawsze otrzymują rolę `worker` (nie można tworzyć właścicieli przez API)
- Email musi być unikalny w systemie
- Hasło musi spełniać minimalne wymagania bezpieczeństwa (min. 8 znaków)

## 2. Szczegóły żądania

- **Metoda HTTP:** POST
- **Struktura URL:** `/api/users`
- **Lokalizacja pliku:** `src/pages/api/users/index.ts`

### Parametry

#### Path Parameters
Brak

#### Query Parameters
Brak

### Request Body

| Pole | Typ | Wymagane | Opis | Walidacja |
|------|-----|----------|------|-----------|
| `email` | string | Tak | Adres email nowego użytkownika | Poprawny format email |
| `password` | string | Tak | Hasło do konta | Minimum 8 znaków |
| `name` | string | Tak | Imię/nazwa użytkownika | 1-100 znaków |

**Przykładowe body:**
```json
{
  "email": "worker@example.com",
  "password": "securePassword123",
  "name": "Jan Kowalski"
}
```

### Nagłówki

| Nagłówek | Wymagany | Opis |
|----------|----------|------|
| `Content-Type` | Tak | `application/json` |
| `Cookie` | Tak | Sesja uwierzytelniania Supabase (sb-access-token, sb-refresh-token) |

## 3. Wykorzystywane typy

### Istniejące typy z `src/types.ts`

```typescript
// Command model dla tworzenia użytkownika
interface CreateUserCommand {
  email: string;
  password: string;
  name: string;
}

// DTO odpowiedzi (ten sam co dla elementu listy)
interface UserListItemDTO {
  id: string;           // UUID z profiles.id
  email: string;        // Email z auth.users
  name: string;         // Nazwa z profiles.name
  role: UserRole;       // Rola z profiles.role (zawsze 'worker')
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
// Zod schema dla walidacji request body (src/lib/schemas/user.schema.ts)
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must not exceed 100 characters')
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
```

## 4. Szczegóły odpowiedzi

### Sukces (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "worker@example.com",
  "name": "Jan Kowalski",
  "role": "worker",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Błędy

| Status | Opis | Przykładowa odpowiedź |
|--------|------|----------------------|
| 400 | Nieprawidłowe dane wejściowe | `{"error": "Validation failed", "details": {"email": ["Invalid email format"], "password": ["Password must be at least 8 characters"]}}` |
| 401 | Brak uwierzytelnienia | `{"error": "Unauthorized"}` |
| 403 | Użytkownik nie jest właścicielem | `{"error": "Only owner can perform this action"}` |
| 409 | Email już istnieje | `{"error": "User with this email already exists"}` |
| 500 | Błąd serwera | `{"error": "Internal server error"}` |

## 5. Przepływ danych

```
┌─────────────────┐
│   Klient HTTP   │
└────────┬────────┘
         │ POST /api/users
         │ Body: { email, password, name }
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Route Handler                         │
│  src/pages/api/users/index.ts                               │
├─────────────────────────────────────────────────────────────┤
│  1. Parsowanie i walidacja request body (Zod)               │
│  2. Sprawdzenie autentykacji (supabase.auth.getUser())      │
│  3. Sprawdzenie autoryzacji (supabase.rpc('is_owner'))      │
│  4. Wywołanie UserService.createUser()                      │
│  5. Formatowanie i zwrot odpowiedzi 201                     │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                      UserService                             │
│  src/lib/services/user.service.ts                           │
├─────────────────────────────────────────────────────────────┤
│  1. Utworzenie użytkownika w auth.users (Admin API)         │
│  2. Utworzenie profilu w tabeli profiles                    │
│  3. Zwrot UserListItemDTO                                   │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                                │
├──────────────────────┬──────────────────────────────────────┤
│  auth.users          │  profiles (public)                    │
│  - id (UUID)         │  - id (FK -> auth.users.id)          │
│  - email             │  - name                               │
│  - encrypted_password│  - role (default: 'worker')          │
│  - created_at        │  - created_at                        │
│                      │  - updated_at                        │
└──────────────────────┴──────────────────────────────────────┘
```

### Szczegółowy przepływ

1. **Klient** wysyła żądanie POST z danymi nowego użytkownika w body
2. **API Route** parsuje i waliduje body za pomocą Zod schema
3. **API Route** sprawdza sesję użytkownika przez `supabase.auth.getUser()`
4. **API Route** weryfikuje rolę `owner` przez `supabase.rpc('is_owner')`
5. **UserService** tworzy użytkownika w `auth.users` używając Supabase Admin API
6. **UserService** tworzy profil w tabeli `profiles` z rolą `worker`
7. **UserService** zwraca utworzonego użytkownika jako `UserListItemDTO`
8. **API Route** zwraca odpowiedź 201 Created

### Obsługa błędów w przepływie

- Jeśli email już istnieje w `auth.users`, Supabase Admin API zwróci błąd → 409 Conflict
- Jeśli tworzenie profilu nie powiedzie się (np. constraint violation), transakcja powinna być wycofana
- W przypadku częściowego błędu (user utworzony, ale profil nie) - implementacja cleanup

## 6. Względy bezpieczeństwa

### Uwierzytelnienie

- Weryfikacja sesji przez `supabase.auth.getUser()` na początku handlera
- Sprawdzenie czy `user` oraz `user.id` istnieją
- Odrzucenie żądania z kodem 401 jeśli brak ważnej sesji

### Autoryzacja

- Użycie funkcji bazodanowej `is_owner()` do weryfikacji roli
- Tylko użytkownicy z rolą `owner` mogą tworzyć nowych użytkowników
- Nowo utworzeni użytkownicy zawsze otrzymują rolę `worker` (hardcoded)

### Walidacja danych wejściowych

- **Email:** Walidacja formatu przez Zod (`z.string().email()`)
- **Password:** Minimum 8 znaków (zgodnie z dobrymi praktykami bezpieczeństwa)
- **Name:** 1-100 znaków (zgodnie z ograniczeniami bazy danych)

### Bezpieczeństwo hasła

- Hasło jest przekazywane przez HTTPS
- Hashowanie hasła wykonuje Supabase Auth (bcrypt)
- Hasło nigdy nie jest zwracane w odpowiedzi
- Hasło nie jest logowane

### Ochrona przed atakami

- **Brute force:** Limitowanie przez Supabase Auth
- **Duplicate emails:** Sprawdzenie unikalności na poziomie bazy danych
- **SQL Injection:** Używanie parametryzowanych zapytań przez Supabase SDK
- **XSS:** Walidacja i sanityzacja danych wejściowych przez Zod

### Użycie Supabase Admin Client

- Service role key wymagany do `auth.admin.createUser()`
- Service role key przechowywany w zmiennych środowiskowych
- Nigdy nie eksponować service role key po stronie klienta

## 7. Obsługa błędów

### Scenariusze błędów

| Scenariusz | Kod HTTP | Komunikat | Akcja recovery |
|------------|----------|-----------|----------------|
| Brak body lub niepoprawny JSON | 400 | "Invalid request body" | Poprawienie struktury żądania |
| Niepoprawny email | 400 | "Validation failed" + details | Poprawienie formatu email |
| Za krótkie hasło | 400 | "Validation failed" + details | Podanie dłuższego hasła |
| Pusta lub za długa nazwa | 400 | "Validation failed" + details | Poprawienie nazwy |
| Brak tokena sesji | 401 | "Unauthorized" | Zalogowanie się |
| Nieważna sesja | 401 | "Unauthorized" | Ponowne zalogowanie |
| Użytkownik nie jest owner | 403 | "Only owner can perform this action" | Kontakt z właścicielem |
| Email już istnieje | 409 | "User with this email already exists" | Użycie innego emaila |
| Błąd Supabase Auth | 500 | "Internal server error" | Retry, sprawdzenie logów |
| Błąd tworzenia profilu | 500 | "Internal server error" | Retry, sprawdzenie logów |

### Implementacja obsługi błędów

```typescript
// Wzorzec early return dla czystego kodu
export const POST: APIRoute = async ({ locals, request }) => {
  const supabase = locals.supabase;

  // 1. Parsowanie body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 2. Walidacja danych
  const validationResult = createUserSchema.safeParse(body);
  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: 'Validation failed',
        details: validationResult.error.flatten().fieldErrors
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 3. Sprawdzenie autentykacji
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 4. Sprawdzenie autoryzacji
  const { data: isOwner } = await supabase.rpc('is_owner');
  if (!isOwner) {
    return new Response(
      JSON.stringify({ error: 'Only owner can perform this action' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 5. Tworzenie użytkownika (happy path)
  try {
    const userService = createUserService(supabase);
    const result = await userService.createUser(validationResult.data);
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    // Obsługa specyficznych błędów
    if (error instanceof Error && error.message.includes('already exists')) {
      return new Response(
        JSON.stringify({ error: 'User with this email already exists' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.error('Error creating user:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

1. **Wywołanie Supabase Auth Admin API** - wymaga połączenia z zewnętrzną usługą
2. **Dwie operacje bazodanowe** - tworzenie auth.user i profiles

### Strategie optymalizacji

1. **Minimalizacja roundtrips:**
   - Połączenie walidacji i tworzenia w jednym flow
   - Brak zbędnych zapytań do bazy przed tworzeniem

2. **Obsługa błędów atomowa:**
   - Jeśli tworzenie profilu nie powiedzie się, próba usunięcia utworzonego auth.user
   - Alternatywnie: trigger bazodanowy do automatycznego tworzenia profilu

3. **Timeout handling:**
   - Ustawienie rozsądnych timeoutów dla operacji
   - Graceful degradation przy timeout

### Limity

- Supabase Auth rate limiting na tworzenie użytkowników
- Maksymalna długość nazwy: 100 znaków (ograniczenie bazy)

## 9. Etapy wdrożenia

### Krok 1: Utworzenie schematu walidacji użytkownika

**Plik:** `src/lib/schemas/user.schema.ts`

```typescript
import { z } from 'zod';

/**
 * Schema walidacji dla tworzenia nowego użytkownika.
 * Używana w endpoint POST /api/users.
 */
export const createUserSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email must not exceed 255 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must not exceed 72 characters'), // bcrypt limit
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must not exceed 100 characters')
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
```

### Krok 2: Rozszerzenie UserService o metodę createUser

**Plik:** `src/lib/services/user.service.ts`

Dodanie nowej metody do istniejącej klasy `UserService`:

```typescript
import type { CreateUserCommand, UserListItemDTO } from '../../types';

// Dodać do klasy UserService:

/**
 * Creates a new worker user.
 * 
 * This method creates both an auth.users entry and a profiles entry.
 * New users are always created with the 'worker' role.
 * 
 * @param command - User creation data (email, password, name)
 * @returns Created user as UserListItemDTO
 * @throws Error if email already exists or database operation fails
 */
async createUser(command: CreateUserCommand): Promise<UserListItemDTO> {
  const { email, password, name } = command;

  // 1. Create auth user using Admin API
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true // Auto-confirm email
  });

  if (authError) {
    // Check for duplicate email error
    if (authError.message.includes('already') || authError.message.includes('exists')) {
      throw new Error('User with this email already exists');
    }
    throw new Error(`Failed to create auth user: ${authError.message}`);
  }

  if (!authData.user) {
    throw new Error('Failed to create auth user: no user returned');
  }

  const userId = authData.user.id;

  // 2. Create profile with 'worker' role
  const { data: profile, error: profileError } = await this.supabase
    .from('profiles')
    .insert({
      id: userId,
      name,
      role: 'worker'
    })
    .select('id, name, role, created_at')
    .single();

  if (profileError) {
    // Cleanup: delete auth user if profile creation fails
    console.error('Profile creation failed, cleaning up auth user:', profileError);
    await supabaseAdmin.auth.admin.deleteUser(userId);
    throw new Error(`Failed to create user profile: ${profileError.message}`);
  }

  // 3. Return created user as DTO
  return {
    id: profile.id,
    email,
    name: profile.name,
    role: profile.role,
    created_at: profile.created_at
  };
}
```

### Krok 3: Dodanie POST handler do API Route

**Plik:** `src/pages/api/users/index.ts`

Dodanie eksportu `POST` do istniejącego pliku (obok `GET`):

```typescript
import type { APIRoute } from 'astro';
import { paginationSchema } from '../../../lib/schemas/pagination.schema';
import { createUserSchema } from '../../../lib/schemas/user.schema';
import { createUserService } from '../../../lib/services/user.service';
import type { ErrorResponse } from '../../../types';

export const prerender = false;

// ... istniejący GET handler ...

export const POST: APIRoute = async ({ locals, request }) => {
  const supabase = locals.supabase;

  // 1. Parsowanie request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    const errorResponse: ErrorResponse = { error: 'Invalid request body' };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 2. Walidacja danych wejściowych
  const validationResult = createUserSchema.safeParse(body);
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

  // 3. Sprawdzenie autentykacji
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    const errorResponse: ErrorResponse = { error: 'Unauthorized' };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 4. Sprawdzenie autoryzacji (tylko owner)
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

  // 5. Tworzenie użytkownika
  try {
    const userService = createUserService(supabase);
    const createdUser = await userService.createUser(validationResult.data);

    return new Response(JSON.stringify(createdUser), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    // 6. Obsługa błędu duplikatu emaila
    if (error instanceof Error && error.message.includes('already exists')) {
      const errorResponse: ErrorResponse = { 
        error: 'User with this email already exists' 
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 7. Obsługa innych błędów
    console.error('Error creating user:', error);
    const errorResponse: ErrorResponse = { error: 'Internal server error' };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

### Krok 4: Aktualizacja struktury plików

```
src/
├── lib/
│   ├── schemas/
│   │   ├── pagination.schema.ts   # Istniejący
│   │   └── user.schema.ts         # Nowy
│   └── services/
│       └── user.service.ts        # Rozszerzony o createUser()
├── db/
│   ├── supabase.client.ts         # Istniejący
│   └── supabase.admin.ts          # Istniejący
└── pages/
    └── api/
        └── users/
            └── index.ts           # Rozszerzony o POST handler
```

### Krok 5: Testy manualne

1. **Test bez autentykacji:**
   ```bash
   curl -X POST http://localhost:4321/api/users \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "password": "password123", "name": "Test User"}'
   # Oczekiwany: 401 Unauthorized
   ```

2. **Test z autentykacją (worker):**
   ```bash
   # Po zalogowaniu jako worker
   curl -X POST http://localhost:4321/api/users \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=..." \
     -d '{"email": "test@example.com", "password": "password123", "name": "Test User"}'
   # Oczekiwany: 403 Forbidden
   ```

3. **Test z autentykacją (owner) - sukces:**
   ```bash
   # Po zalogowaniu jako owner
   curl -X POST http://localhost:4321/api/users \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=..." \
     -d '{"email": "newworker@example.com", "password": "password123", "name": "New Worker"}'
   # Oczekiwany: 201 Created z danymi użytkownika
   ```

4. **Test walidacji - niepoprawny email:**
   ```bash
   curl -X POST http://localhost:4321/api/users \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=..." \
     -d '{"email": "invalid-email", "password": "password123", "name": "Test"}'
   # Oczekiwany: 400 Bad Request z błędem walidacji email
   ```

5. **Test walidacji - za krótkie hasło:**
   ```bash
   curl -X POST http://localhost:4321/api/users \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=..." \
     -d '{"email": "test@example.com", "password": "short", "name": "Test"}'
   # Oczekiwany: 400 Bad Request z błędem walidacji hasła
   ```

6. **Test walidacji - pusta nazwa:**
   ```bash
   curl -X POST http://localhost:4321/api/users \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=..." \
     -d '{"email": "test@example.com", "password": "password123", "name": ""}'
   # Oczekiwany: 400 Bad Request z błędem walidacji nazwy
   ```

7. **Test duplikatu emaila:**
   ```bash
   # Po utworzeniu użytkownika, próba utworzenia drugiego z tym samym emailem
   curl -X POST http://localhost:4321/api/users \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=..." \
     -d '{"email": "newworker@example.com", "password": "password123", "name": "Another Worker"}'
   # Oczekiwany: 409 Conflict
   ```

8. **Test niepoprawnego JSON:**
   ```bash
   curl -X POST http://localhost:4321/api/users \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=..." \
     -d 'not-a-json'
   # Oczekiwany: 400 Bad Request "Invalid request body"
   ```

## 10. Checklist przed wdrożeniem

- [ ] Utworzono `src/lib/schemas/user.schema.ts` ze schematem walidacji
- [ ] Rozszerzono `UserService` o metodę `createUser()`
- [ ] Dodano `POST` handler do `src/pages/api/users/index.ts`
- [ ] Zaimportowano `createUserSchema` w route handler
- [ ] Przeprowadzono testy manualne wszystkich scenariuszy
- [ ] Sprawdzono czy linter nie zgłasza błędów
- [ ] Zweryfikowano działanie z rzeczywistą bazą Supabase
- [ ] Sprawdzono logowanie błędów w konsoli serwera
- [ ] Zweryfikowano cleanup auth.user przy błędzie tworzenia profilu
- [ ] Sprawdzono czy nowy użytkownik może się zalogować
