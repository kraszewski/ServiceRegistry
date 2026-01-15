# API Endpoint Implementation Plan: GET /api/users

## 1. Przegląd punktu końcowego

Endpoint `GET /api/users` służy do pobierania paginowanej listy wszystkich użytkowników systemu. Endpoint jest dostępny wyłącznie dla użytkowników z rolą `owner`. Zwraca dane profilowe użytkowników wraz z adresami email pobranymi z tabeli `auth.users`.

**Cel biznesowy:** Umożliwienie właścicielom systemu przeglądania wszystkich zarejestrowanych użytkowników w celu zarządzania dostępem i monitorowania kont.

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/users`
- **Lokalizacja pliku:** `src/pages/api/users/index.ts`

### Parametry

#### Query Parameters (opcjonalne)

| Parametr | Typ | Domyślna wartość | Opis | Walidacja |
|----------|-----|------------------|------|-----------|
| `page` | integer | 1 | Numer strony (1-indexed) | min: 1 |
| `limit` | integer | 50 | Liczba elementów na stronę | min: 1, max: 100 |

### Request Body

Brak - endpoint GET nie przyjmuje body.

### Nagłówki

| Nagłówek | Wymagany | Opis |
|----------|----------|------|
| `Cookie` | Tak | Sesja uwierzytelniania Supabase (sb-access-token, sb-refresh-token) |

## 3. Wykorzystywane typy

### Istniejące typy z `src/types.ts`

```typescript
// DTO dla elementu listy użytkowników
interface UserListItemDTO {
  id: string;           // UUID z profiles.id
  email: string;        // Email z auth.users (nie przechowywany w profiles)
  name: string;         // Nazwa z profiles.name
  role: UserRole;       // Rola z profiles.role ('owner' | 'worker')
  created_at: string;   // Data utworzenia z profiles.created_at
}

// Paginowana odpowiedź
type UserListResponse = PaginatedResponse<UserListItemDTO>;

// Metadane paginacji
interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Parametry paginacji (do walidacji query params)
interface PaginationParams {
  page?: number;
  limit?: number;
}

// Standardowa odpowiedź błędu
interface ErrorResponse {
  error: string;
  details?: Record<string, string[]> | Record<string, unknown>;
}
```

### Nowe typy/schematy do utworzenia

```typescript
// Zod schema dla walidacji query parameters (src/lib/schemas/pagination.schema.ts)
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "owner@example.com",
      "name": "Jan Kowalski",
      "role": "owner",
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "email": "worker@example.com",
      "name": "Anna Nowak",
      "role": "worker",
      "created_at": "2024-01-16T14:20:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 2,
    "totalPages": 1
  }
}
```

### Błędy

| Status | Opis | Przykładowa odpowiedź |
|--------|------|----------------------|
| 400 | Nieprawidłowe parametry zapytania | `{"error": "Validation failed", "details": {"page": ["Number must be greater than or equal to 1"]}}` |
| 401 | Brak uwierzytelnienia | `{"error": "Unauthorized"}` |
| 403 | Użytkownik nie jest właścicielem | `{"error": "Only owner can perform this action"}` |
| 500 | Błąd serwera | `{"error": "Internal server error"}` |

## 5. Przepływ danych

```
┌─────────────────┐
│   Klient HTTP   │
└────────┬────────┘
         │ GET /api/users?page=1&limit=50
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Route Handler                         │
│  src/pages/api/users/index.ts                               │
├─────────────────────────────────────────────────────────────┤
│  1. Parsowanie i walidacja query params (Zod)               │
│  2. Sprawdzenie autentykacji (supabase.auth.getUser())      │
│  3. Sprawdzenie autoryzacji (supabase.rpc('is_owner'))      │
│  4. Wywołanie UserService.listUsers()                       │
│  5. Formatowanie i zwrot odpowiedzi                         │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                      UserService                             │
│  src/lib/services/user.service.ts                           │
├─────────────────────────────────────────────────────────────┤
│  1. Pobranie profili z paginacją                            │
│  2. Pobranie emaili z auth.users (admin API)                │
│  3. Złączenie danych i mapowanie na DTO                     │
│  4. Zwrot paginowanej odpowiedzi                            │
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
└──────────────────────┴──────────────────────────────────────┘
```

### Szczegółowy przepływ

1. **Klient** wysyła żądanie GET z opcjonalnymi parametrami paginacji
2. **API Route** waliduje parametry za pomocą Zod schema
3. **API Route** sprawdza sesję użytkownika przez `supabase.auth.getUser()`
4. **API Route** weryfikuje rolę `owner` przez `supabase.rpc('is_owner')`
5. **UserService** pobiera profile z tabeli `profiles` z paginacją
6. **UserService** pobiera emaile z `auth.users` używając Supabase Admin API
7. **UserService** łączy dane i mapuje na `UserListItemDTO[]`
8. **API Route** zwraca odpowiedź w formacie `UserListResponse`

## 6. Względy bezpieczeństwa

### Uwierzytelnienie

- Weryfikacja sesji przez `supabase.auth.getUser()` na początku handlera
- Sprawdzenie czy `user` oraz `user.id` istnieją
- Odrzucenie żądania z kodem 401 jeśli brak ważnej sesji

### Autoryzacja

- Użycie funkcji bazodanowej `is_owner()` do weryfikacji roli
- Tylko użytkownicy z rolą `owner` mogą wywoływać ten endpoint
- RLS policies na tabeli `profiles` zapewniają dodatkową warstwę ochrony

### Dostęp do danych auth.users

- Emaile są przechowywane w `auth.users`, nie w `profiles`
- Wymagany jest Supabase Admin Client (service role key) do pobierania emaili
- Service role key musi być przechowywany bezpiecznie w zmiennych środowiskowych
- Nigdy nie eksponować service role key po stronie klienta

### Walidacja danych wejściowych

- Wszystkie query params walidowane przez Zod przed użyciem
- Użycie `z.coerce` dla konwersji stringów na liczby
- Ograniczenie `limit` do maksymalnie 100 zapobiega nadmiernemu obciążeniu

### Ochrona przed wyciekiem danych

- Zwracanie tylko niezbędnych pól (bez `updated_at`, haseł, tokenów)
- Brak zwracania wrażliwych metadanych auth.users

## 7. Obsługa błędów

### Scenariusze błędów

| Scenariusz | Kod HTTP | Komunikat | Akcja |
|------------|----------|-----------|-------|
| Brak tokena sesji | 401 | "Unauthorized" | Przekierowanie do logowania |
| Nieważna sesja | 401 | "Unauthorized" | Przekierowanie do logowania |
| Użytkownik nie jest owner | 403 | "Only owner can perform this action" | Wyświetlenie komunikatu |
| Nieprawidłowy `page` | 400 | "Validation failed" + details | Poprawienie parametru |
| Nieprawidłowy `limit` | 400 | "Validation failed" + details | Poprawienie parametru |
| Błąd bazy danych | 500 | "Internal server error" | Logowanie błędu, retry |
| Błąd pobierania emaili | 500 | "Internal server error" | Logowanie błędu |

### Implementacja obsługi błędów

```typescript
// Wzorzec early return dla czystego kodu
export const GET: APIRoute = async ({ locals, request }) => {
  // 1. Walidacja query params
  const validationResult = paginationSchema.safeParse(params);
  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        details: validationResult.error.flatten().fieldErrors
      }),
      { status: 400 }
    );
  }

  // 2. Sprawdzenie autentykacji
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401 }
    );
  }

  // 3. Sprawdzenie autoryzacji
  const { data: isOwner } = await supabase.rpc('is_owner');
  if (!isOwner) {
    return new Response(
      JSON.stringify({ error: "Only owner can perform this action" }),
      { status: 403 }
    );
  }

  // 4. Happy path - pobieranie danych
  try {
    const result = await userService.listUsers(page, limit);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
};
```

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

1. **Pobieranie emaili z auth.users** - wymaga osobnego zapytania do Admin API
2. **Duża liczba użytkowników** - bez paginacji mogłoby przeciążyć system
3. **N+1 problem** - jeśli emaile byłyby pobierane pojedynczo

### Strategie optymalizacji

1. **Batch fetching emaili:**
   - Pobieranie wszystkich profili z paginacją
   - Jedno zapytanie do Admin API po wszystkie emaile dla pobranych ID
   - Mapowanie w pamięci

2. **Paginacja po stronie bazy:**
   ```typescript
   const offset = (page - 1) * limit;
   const { data, count } = await supabase
     .from('profiles')
     .select('*', { count: 'exact' })
     .order('created_at', { ascending: false })
     .range(offset, offset + limit - 1);
   ```

3. **Indeksy bazodanowe:**
   - `profiles.created_at` - dla sortowania domyślnego
   - Indeks już istnieje jako część tabeli

4. **Cache (przyszła optymalizacja):**
   - Lista użytkowników zmienia się rzadko
   - Możliwość cache'owania z invalidacją przy CRUD operacjach

### Limity

- Maksymalny `limit`: 100 rekordów na stronę
- Timeout zapytania: standardowy timeout Supabase

## 9. Etapy wdrożenia

### Krok 1: Utworzenie Supabase Admin Client

**Plik:** `src/db/supabase.admin.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = createClient<Database>(
  supabaseUrl, 
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
```

**Aktualizacja `.env.example`:**
```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Krok 2: Utworzenie schematu walidacji paginacji

**Plik:** `src/lib/schemas/pagination.schema.ts`

```typescript
import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

export type PaginationInput = z.infer<typeof paginationSchema>;
```

### Krok 3: Utworzenie UserService

**Plik:** `src/lib/services/user.service.ts`

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';
import { supabaseAdmin } from '../../db/supabase.admin';
import type { UserListItemDTO, UserListResponse } from '../../types';

export class UserService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async listUsers(page: number, limit: number): Promise<UserListResponse> {
    const offset = (page - 1) * limit;

    // 1. Pobranie profili z paginacją
    const { data: profiles, count, error } = await this.supabase
      .from('profiles')
      .select('id, name, role, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch profiles: ${error.message}`);
    }

    if (!profiles || profiles.length === 0) {
      return {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      };
    }

    // 2. Pobranie emaili z auth.users używając Admin API
    const userIds = profiles.map(p => p.id);
    const { data: authUsers, error: authError } = await supabaseAdmin
      .auth
      .admin
      .listUsers();

    if (authError) {
      throw new Error(`Failed to fetch auth users: ${authError.message}`);
    }

    // 3. Utworzenie mapy email po ID
    const emailMap = new Map<string, string>();
    authUsers.users.forEach(u => {
      emailMap.set(u.id, u.email || '');
    });

    // 4. Mapowanie na DTO
    const data: UserListItemDTO[] = profiles.map(profile => ({
      id: profile.id,
      email: emailMap.get(profile.id) || '',
      name: profile.name,
      role: profile.role,
      created_at: profile.created_at
    }));

    const total = count || 0;

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

// Factory function dla łatwiejszego użycia
export function createUserService(supabase: SupabaseClient<Database>): UserService {
  return new UserService(supabase);
}
```

### Krok 4: Implementacja API Route

**Plik:** `src/pages/api/users/index.ts`

```typescript
import type { APIRoute } from 'astro';
import { paginationSchema } from '../../../lib/schemas/pagination.schema';
import { createUserService } from '../../../lib/services/user.service';
import type { ErrorResponse } from '../../../types';

export const prerender = false;

export const GET: APIRoute = async ({ locals, request }) => {
  const supabase = locals.supabase;

  // 1. Parsowanie query params
  const url = new URL(request.url);
  const queryParams = {
    page: url.searchParams.get('page'),
    limit: url.searchParams.get('limit')
  };

  // 2. Walidacja parametrów
  const validationResult = paginationSchema.safeParse(queryParams);
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

  const { page, limit } = validationResult.data;

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

  // 5. Pobranie listy użytkowników
  try {
    const userService = createUserService(supabase);
    const result = await userService.listUsers(page, limit);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    const errorResponse: ErrorResponse = { error: 'Internal server error' };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

### Krok 5: Aktualizacja typów środowiskowych

**Plik:** `src/env.d.ts` - dodanie typu dla service role key

```typescript
interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
}
```

### Krok 6: Utworzenie struktury katalogów

```
src/
├── lib/
│   ├── schemas/
│   │   └── pagination.schema.ts    # Nowy
│   └── services/
│       └── user.service.ts         # Nowy
├── db/
│   ├── supabase.client.ts          # Istniejący
│   └── supabase.admin.ts           # Nowy
└── pages/
    └── api/
        └── users/
            └── index.ts            # Nowy
```

### Krok 7: Testy manualne

1. **Test bez autentykacji:**
   ```bash
   curl -X GET http://localhost:4321/api/users
   # Oczekiwany: 401 Unauthorized
   ```

2. **Test z autentykacją (worker):**
   ```bash
   # Po zalogowaniu jako worker
   curl -X GET http://localhost:4321/api/users \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 403 Forbidden
   ```

3. **Test z autentykacją (owner):**
   ```bash
   # Po zalogowaniu jako owner
   curl -X GET http://localhost:4321/api/users \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 200 OK z listą użytkowników
   ```

4. **Test paginacji:**
   ```bash
   curl -X GET "http://localhost:4321/api/users?page=1&limit=10" \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 200 OK z max 10 użytkowników
   ```

5. **Test nieprawidłowych parametrów:**
   ```bash
   curl -X GET "http://localhost:4321/api/users?page=0&limit=200" \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 400 Bad Request z walidacyjnymi błędami
   ```

## 10. Checklist przed wdrożeniem

- [ ] Utworzono `src/db/supabase.admin.ts` z klientem admin
- [ ] Dodano `SUPABASE_SERVICE_ROLE_KEY` do `.env` i `.env.example`
- [ ] Utworzono `src/lib/schemas/pagination.schema.ts`
- [ ] Utworzono `src/lib/services/user.service.ts`
- [ ] Utworzono `src/pages/api/users/index.ts`
- [ ] Zaktualizowano `src/env.d.ts` o nowe zmienne środowiskowe
- [ ] Przeprowadzono testy manualne wszystkich scenariuszy
- [ ] Sprawdzono czy linter nie zgłasza błędów
- [ ] Zweryfikowano działanie z rzeczywistą bazą Supabase
