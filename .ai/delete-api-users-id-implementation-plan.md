# API Endpoint Implementation Plan: DELETE /api/users/{id}

## 1. Przegląd punktu końcowego

Endpoint `DELETE /api/users/{id}` służy do usuwania kont użytkowników typu `worker`. Endpoint jest dostępny wyłącznie dla użytkowników z rolą `owner`. Zawiera dodatkowe ograniczenia bezpieczeństwa: nie pozwala na usunięcie własnego konta ani kont innych właścicieli.

**Cel biznesowy:** Umożliwienie właścicielom systemu zarządzania kontami pracowników poprzez usuwanie nieaktywnych, niepotrzebnych lub błędnie utworzonych kont.

**Kluczowe ograniczenia:**
- Nie można usunąć własnego konta (ochrona przed przypadkowym "wylogowaniem")
- Nie można usunąć kont innych ownerów (ochrona przed eskalacją uprawnień)
- Tylko użytkownicy z rolą `worker` mogą być usunięci

## 2. Szczegóły żądania

- **Metoda HTTP:** DELETE
- **Struktura URL:** `/api/users/{id}`
- **Lokalizacja pliku:** `src/pages/api/users/[id].ts`

### Parametry

#### Path Parameters

| Parametr | Typ | Wymagany | Opis | Walidacja |
|----------|-----|----------|------|-----------|
| `id` | UUID | Tak | Identyfikator użytkownika do usunięcia | Format UUID v4 |

#### Query Parameters

Brak

### Request Body

Brak - endpoint DELETE nie przyjmuje body.

### Nagłówki

| Nagłówek | Wymagany | Opis |
|----------|----------|------|
| `Cookie` | Tak | Sesja uwierzytelniania Supabase (sb-access-token, sb-refresh-token) |

## 3. Wykorzystywane typy

### Istniejące typy z `src/types.ts`

```typescript
// Standardowa odpowiedź dla operacji DELETE
interface DeleteResponse {
  message: string;
}

// Standardowa odpowiedź błędu
interface ErrorResponse {
  error: string;
  details?: Record<string, string[]> | Record<string, unknown>;
}
```

### Typy/schematy do wykorzystania

```typescript
// Zod schema dla walidacji UUID (src/lib/schemas/user.schema.ts)
// Ten sam schemat co dla GET /api/users/{id}
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
  "message": "User deleted successfully"
}
```

### Błędy

| Status | Opis | Przykładowa odpowiedź |
|--------|------|----------------------|
| 400 | Nieprawidłowy format UUID | `{"error": "Validation failed", "details": {"id": ["Invalid user ID format"]}}` |
| 401 | Brak uwierzytelnienia | `{"error": "Unauthorized"}` |
| 403 | Użytkownik nie jest właścicielem | `{"error": "Only owner can perform this action"}` |
| 403 | Próba usunięcia własnego konta | `{"error": "Cannot delete your own account"}` |
| 403 | Próba usunięcia innego ownera | `{"error": "Cannot delete owner accounts"}` |
| 404 | Użytkownik nie istnieje | `{"error": "User not found"}` |
| 500 | Błąd serwera | `{"error": "Internal server error"}` |

## 5. Przepływ danych

```
┌─────────────────┐
│   Klient HTTP   │
└────────┬────────┘
         │ DELETE /api/users/{id}
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Route Handler                         │
│  src/pages/api/users/[id].ts                                │
├─────────────────────────────────────────────────────────────┤
│  1. Parsowanie i walidacja path param (Zod)                 │
│  2. Sprawdzenie autentykacji (supabase.auth.getUser())      │
│  3. Sprawdzenie autoryzacji (supabase.rpc('is_owner'))      │
│  4. Wywołanie UserService.deleteUser()                      │
│  5. Formatowanie i zwrot odpowiedzi                         │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                      UserService                             │
│  src/lib/services/user.service.ts                           │
├─────────────────────────────────────────────────────────────┤
│  1. Walidacja: czy nie własne konto                         │
│  2. Pobranie profilu celu (sprawdzenie istnienia)           │
│  3. Walidacja: czy cel nie jest ownerem                     │
│  4. Usunięcie użytkownika z auth.users (Admin API)          │
│  5. Profile usunięte automatycznie (CASCADE)                │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                                │
├──────────────────────┬──────────────────────────────────────┤
│  auth.users          │  profiles                             │
│  - DELETE user       │  - CASCADE DELETE                     │
│                      │    (automatycznie)                    │
└──────────────────────┴──────────────────────────────────────┘
```

### Szczegółowy przepływ

1. **Klient** wysyła żądanie DELETE z UUID użytkownika w ścieżce
2. **API Route** waliduje format UUID za pomocą Zod schema
3. **API Route** sprawdza sesję użytkownika przez `supabase.auth.getUser()`
4. **API Route** weryfikuje rolę `owner` przez `supabase.rpc('is_owner')`
5. **UserService** sprawdza czy `targetId !== currentUserId` (własne konto)
6. **UserService** pobiera profil celu z tabeli `profiles`
7. **UserService** sprawdza czy cel istnieje (jeśli nie - rzuca błąd 404)
8. **UserService** sprawdza czy cel nie jest `owner` (jeśli jest - rzuca błąd 403)
9. **UserService** usuwa użytkownika z `auth.users` przez Supabase Admin API
10. **Baza danych** automatycznie usuwa rekord z `profiles` (CASCADE)
11. **API Route** zwraca odpowiedź 200 OK z komunikatem sukcesu

### Hierarchia walidacji (early returns)

Kolejność sprawdzania zapewnia najbardziej specyficzny komunikat błędu:

1. Walidacja UUID (400)
2. Uwierzytelnienie (401)
3. Autoryzacja owner (403 - "Only owner can perform this action")
4. Sprawdzenie własnego konta (403 - "Cannot delete your own account")
5. Istnienie użytkownika celu (404)
6. Sprawdzenie czy cel nie jest owner (403 - "Cannot delete owner accounts")
7. Operacja usunięcia (500 przy błędzie)

## 6. Względy bezpieczeństwa

### Uwierzytelnienie

- Weryfikacja sesji przez `supabase.auth.getUser()` na początku handlera
- Sprawdzenie czy `user` oraz `user.id` istnieją
- Odrzucenie żądania z kodem 401 jeśli brak ważnej sesji

### Autoryzacja

- Użycie funkcji bazodanowej `is_owner()` do weryfikacji roli
- Tylko użytkownicy z rolą `owner` mogą wywoływać ten endpoint
- RLS policies na tabeli `profiles` zapewniają dodatkową warstwę ochrony

### Ograniczenia DELETE

1. **Nie można usunąć własnego konta:**
   - Sprawdzenie `targetId !== currentUserId` przed operacją
   - Zapobiega przypadkowemu "wylogowaniu" ownera
   - Chroni przed atakami social engineering

2. **Nie można usunąć innych ownerów:**
   - Pobranie profilu celu i sprawdzenie roli
   - Tylko użytkownicy z rolą `worker` mogą być usunięci
   - Chroni przed eskalacją uprawnień i atakami wewnętrznymi

### Walidacja danych wejściowych

- Walidacja UUID przez Zod (`z.string().uuid()`)
- Odrzucenie nieprawidłowych formatów z kodem 400
- Ochrona przed SQL injection (parametryzowane zapytania Supabase)

### Dostęp do auth.users

- Wymagany Supabase Admin Client (service role key) do usunięcia użytkownika
- Service role key przechowywany bezpiecznie w zmiennych środowiskowych
- Nigdy nie eksponować service role key po stronie klienta

### Cascade Delete

- Usunięcie z `auth.users` automatycznie usuwa powiązany rekord w `profiles`
- Relacja `ON DELETE CASCADE` zapewnia spójność danych
- **Uwaga:** Usunięcie użytkownika może wpłynąć na powiązane rekordy:
  - `equipment.created_by` / `equipment.updated_by`
  - `service_entries.created_by` / `service_entries.updated_by` / `service_entries.performer_id`
  - Należy rozważyć politykę dla osieroconych rekordów (soft delete vs SET NULL)

### Ochrona przed IDOR

- Sprawdzenie autoryzacji (owner) przed każdą operacją
- Dodatkowa walidacja biznesowa (nie własne konto, nie owner)

## 7. Obsługa błędów

### Scenariusze błędów

| Scenariusz | Kod HTTP | Komunikat | Akcja |
|------------|----------|-----------|-------|
| Nieprawidłowy format UUID | 400 | "Validation failed" + details | Poprawienie formatu ID |
| Brak tokena sesji | 401 | "Unauthorized" | Przekierowanie do logowania |
| Nieważna sesja | 401 | "Unauthorized" | Ponowne zalogowanie |
| Użytkownik nie jest owner | 403 | "Only owner can perform this action" | Wyświetlenie komunikatu |
| Próba usunięcia własnego konta | 403 | "Cannot delete your own account" | Informacja o ograniczeniu |
| Próba usunięcia ownera | 403 | "Cannot delete owner accounts" | Informacja o ograniczeniu |
| Użytkownik nie istnieje | 404 | "User not found" | Informacja o braku użytkownika |
| Błąd bazy danych | 500 | "Internal server error" | Logowanie błędu, retry |
| Błąd usunięcia auth user | 500 | "Internal server error" | Logowanie błędu |

### Implementacja obsługi błędów

```typescript
export const DELETE: APIRoute = async ({ locals, params }) => {
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

  // 4. Usunięcie użytkownika
  try {
    await userService.deleteUser(targetId, user.id);
    return new Response(
      JSON.stringify({ message: 'User deleted successfully' }),
      { status: 200 }
    );
  } catch (error) {
    if (error.message === 'Cannot delete your own account') {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 403 }
      );
    }
    if (error.message === 'Cannot delete owner accounts') {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 403 }
      );
    }
    if (error.message === 'User not found') {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 404 }
      );
    }
    console.error('Error deleting user:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
};
```

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

1. **Dwie operacje walidacyjne** - sprawdzenie profilu celu przed usunięciem
2. **Cascade operations** - usunięcie może triggerować inne operacje bazodanowe
3. **Admin API call** - zewnętrzne wywołanie do Supabase Auth

### Strategie optymalizacji

1. **Minimalne zapytania:**
   - Jedno zapytanie do `profiles` dla walidacji (sprawdzenie istnienia + roli)
   - Jedno wywołanie Admin API dla usunięcia
   - Cascade obsługiwany przez bazę danych (nie wymaga dodatkowych zapytań)

2. **Early validation:**
   - Sprawdzenie własnego konta przed zapytaniem do bazy
   - Szybkie odrzucenie nieprawidłowych żądań

3. **Indeksy bazodanowe:**
   - `profiles.id` - PRIMARY KEY (automatyczny indeks)
   - Brak potrzeby dodatkowych indeksów

### Limity

- Timeout zapytania: standardowy timeout Supabase
- Rate limiting: Supabase Auth limituje operacje administracyjne

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie UserService o metodę deleteUser

**Plik:** `src/lib/services/user.service.ts`

Dodanie nowej metody do klasy `UserService`:

```typescript
/**
 * Deletes a worker user.
 *
 * This method performs validation and deletes the user from auth.users.
 * The profile record is automatically deleted via CASCADE.
 *
 * @param targetId - ID of the user to delete
 * @param currentUserId - ID of the currently authenticated user (owner performing the action)
 * @throws Error with message "Cannot delete your own account" if targetId === currentUserId
 * @throws Error with message "User not found" if target user doesn't exist
 * @throws Error with message "Cannot delete owner accounts" if target is an owner
 * @throws Error if database operation fails
 */
async deleteUser(targetId: string, currentUserId: string): Promise<void> {
  // 1. Check if trying to delete own account
  if (targetId === currentUserId) {
    throw new Error('Cannot delete your own account');
  }

  // 2. Fetch target user profile to verify existence and role
  const { data: targetProfile, error } = await this.supabase
    .from('profiles')
    .select('id, role')
    .eq('id', targetId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('User not found');
    }
    throw new Error(`Failed to fetch target profile: ${error.message}`);
  }

  // 3. Check if target is an owner
  if (targetProfile.role === 'owner') {
    throw new Error('Cannot delete owner accounts');
  }

  // 4. Delete user from auth.users (profile will be deleted via CASCADE)
  const { error: deleteError } = await supabaseAdmin
    .auth
    .admin
    .deleteUser(targetId);

  if (deleteError) {
    throw new Error(`Failed to delete user: ${deleteError.message}`);
  }
}
```

### Krok 2: Dodanie DELETE handler do API Route

**Plik:** `src/pages/api/users/[id].ts`

Dodanie eksportu `DELETE` do istniejącego pliku (obok `GET`):

```typescript
import type { DeleteResponse, ErrorResponse } from '../../../types';

/**
 * DELETE /api/users/{id}
 *
 * Deletes a worker account from the system.
 * Only accessible by users with the 'owner' role.
 * Cannot delete own account or other owner accounts.
 *
 * Path Parameters:
 * - id (required): User UUID to delete
 *
 * Responses:
 * - 200: User deleted successfully
 * - 400: Validation error (invalid UUID format)
 * - 401: Unauthorized (no valid session)
 * - 403: Forbidden (not owner / deleting own account / deleting owner)
 * - 404: User not found
 * - 500: Internal server error
 */
export const DELETE: APIRoute = async ({ locals, params }) => {
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

  const { id: targetId } = validationResult.data;

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

  // 4. Delete user
  try {
    const userService = createUserService(supabase);
    await userService.deleteUser(targetId, user.id);

    const successResponse: DeleteResponse = {
      message: 'User deleted successfully'
    };
    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting user:', error);

    if (error instanceof Error) {
      // Handle specific business logic errors
      if (error.message === 'Cannot delete your own account') {
        const errorResponse: ErrorResponse = { error: error.message };
        return new Response(JSON.stringify(errorResponse), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (error.message === 'Cannot delete owner accounts') {
        const errorResponse: ErrorResponse = { error: error.message };
        return new Response(JSON.stringify(errorResponse), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (error.message === 'User not found') {
        const errorResponse: ErrorResponse = { error: error.message };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    const errorResponse: ErrorResponse = { error: 'Internal server error' };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

### Krok 3: Aktualizacja struktury katalogów

```
src/
├── lib/
│   ├── schemas/
│   │   ├── pagination.schema.ts   # Istniejący
│   │   └── user.schema.ts         # Z userIdSchema (z GET /api/users/{id})
│   └── services/
│       └── user.service.ts        # Rozszerzony o deleteUser()
├── db/
│   ├── supabase.client.ts         # Istniejący
│   └── supabase.admin.ts          # Istniejący
└── pages/
    └── api/
        └── users/
            ├── index.ts           # Istniejący (GET list, POST create)
            └── [id].ts            # Rozszerzony o DELETE handler
```

### Krok 4: Testy manualne

1. **Test bez autentykacji:**
   ```bash
   curl -X DELETE http://localhost:4321/api/users/550e8400-e29b-41d4-a716-446655440000
   # Oczekiwany: 401 Unauthorized
   ```

2. **Test z autentykacją (worker):**
   ```bash
   # Po zalogowaniu jako worker
   curl -X DELETE http://localhost:4321/api/users/550e8400-e29b-41d4-a716-446655440000 \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 403 Forbidden
   ```

3. **Test usunięcia własnego konta (owner):**
   ```bash
   # Po zalogowaniu jako owner, próba usunięcia własnego konta
   curl -X DELETE http://localhost:4321/api/users/[własne-id-ownera] \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 403 "Cannot delete your own account"
   ```

4. **Test usunięcia innego ownera:**
   ```bash
   # Po zalogowaniu jako owner, próba usunięcia innego ownera
   curl -X DELETE http://localhost:4321/api/users/[id-innego-ownera] \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 403 "Cannot delete owner accounts"
   ```

5. **Test usunięcia workera - sukces:**
   ```bash
   # Po zalogowaniu jako owner
   curl -X DELETE http://localhost:4321/api/users/[id-workera] \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 200 OK "User deleted successfully"
   ```

6. **Test nieprawidłowego UUID:**
   ```bash
   curl -X DELETE http://localhost:4321/api/users/invalid-uuid \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 400 Bad Request
   ```

7. **Test nieistniejącego użytkownika:**
   ```bash
   curl -X DELETE http://localhost:4321/api/users/00000000-0000-0000-0000-000000000000 \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 404 Not Found
   ```

8. **Weryfikacja cascade delete:**
   ```bash
   # Po usunięciu użytkownika, sprawdzenie czy profil został usunięty
   # Próba pobrania profilu powinna zwrócić 404
   curl -X GET http://localhost:4321/api/users/[usunięty-id] \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 404 Not Found
   ```

## 10. Checklist przed wdrożeniem

- [ ] Rozszerzono `UserService` o metodę `deleteUser()`
- [ ] Dodano `DELETE` handler do `src/pages/api/users/[id].ts`
- [ ] Zaimportowano `DeleteResponse` w route handler
- [ ] Przeprowadzono testy manualne wszystkich scenariuszy
- [ ] Sprawdzono czy linter nie zgłasza błędów
- [ ] Zweryfikowano działanie z rzeczywistą bazą Supabase
- [ ] Sprawdzono logowanie błędów w konsoli serwera
- [ ] Zweryfikowano CASCADE delete (profil usuwany automatycznie)
- [ ] Sprawdzono wpływ usunięcia użytkownika na powiązane rekordy
- [ ] Rozważono politykę dla osieroconych rekordów (equipment, service_entries)
