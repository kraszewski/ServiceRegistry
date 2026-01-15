# API Endpoint Implementation Plan: DELETE /api/service-entries/{id}

## 1. Przegląd punktu końcowego

Endpoint `DELETE /api/service-entries/{id}` służy do usuwania pojedynczego wpisu serwisowego. **Dostępny tylko dla użytkowników z rolą owner.**

**Cel biznesowy:** Umożliwienie właścicielom systemu usunięcia błędnych lub niepotrzebnych wpisów serwisowych z historii sprzętu.

## 2. Szczegóły żądania

- **Metoda HTTP:** DELETE
- **Struktura URL:** `/api/service-entries/{id}`
- **Lokalizacja pliku:** `src/pages/api/service-entries/[id].ts`

### Parametry ścieżki

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `id` | uuid | Tak | UUID wpisu serwisowego do usunięcia |

### Request Body

Brak - operacja DELETE nie wymaga body.

### Nagłówki

| Nagłówek | Wymagany | Opis |
|----------|----------|------|
| `Cookie` | Tak | Sesja uwierzytelniania Supabase |

## 3. Wykorzystywane typy

### Istniejące typy z `src/types.ts`

```typescript
// Standard success response for delete operations
interface DeleteResponse {
  message: string;
}

// Standard error response format
interface ErrorResponse {
  error: string;
  details?: Record<string, string[]> | Record<string, unknown>;
}
```

### Istniejące schematy

```typescript
// src/lib/schemas/service-entry.schema.ts
export const serviceEntryIdSchema = z.string().uuid("Invalid service entry ID format");
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
{
  "message": "Service entry deleted successfully"
}
```

### Błędy

| Status | Opis | Przykładowa odpowiedź |
|--------|------|----------------------|
| 400 | Nieprawidłowe ID wpisu | `{"error": "Invalid service entry ID format"}` |
| 401 | Brak uwierzytelnienia | `{"error": "Unauthorized"}` |
| 403 | Użytkownik nie jest owner | `{"error": "Only owner can delete service entries"}` |
| 404 | Wpis nie znaleziony | `{"error": "Service entry not found"}` |
| 500 | Błąd serwera | `{"error": "Internal server error"}` |

## 5. Przepływ danych

```
┌─────────────────┐
│   Klient HTTP   │
└────────┬────────┘
         │ DELETE /api/service-entries/{id}
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Route Handler                         │
│  src/pages/api/service-entries/[id].ts                      │
├─────────────────────────────────────────────────────────────┤
│  1. Walidacja path parameter (UUID)                         │
│  2. Sprawdzenie autentykacji (supabase.auth.getUser())      │
│  3. Sprawdzenie autoryzacji (supabase.rpc('is_owner'))      │
│  4. Wywołanie ServiceEntryService.deleteServiceEntry()      │
│  5. Zwrot odpowiedzi sukcesu                                │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                  ServiceEntryService                         │
│  src/lib/services/service-entry.service.ts                  │
├─────────────────────────────────────────────────────────────┤
│  1. Sprawdzenie czy wpis istnieje                           │
│  2. DELETE z tabeli service_entries                         │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                                │
├─────────────────────────────────────────────────────────────┤
│  service_entries                                             │
│  - DELETE WHERE id = {id}                                   │
└─────────────────────────────────────────────────────────────┘
```

### Szczegółowy przepływ

1. **Klient** wysyła żądanie DELETE z ID w URL
2. **API Route** waliduje UUID z parametru ścieżki
3. **API Route** sprawdza sesję użytkownika przez `supabase.auth.getUser()`
4. **API Route** sprawdza czy użytkownik ma rolę owner przez `supabase.rpc('is_owner')`
5. **ServiceEntryService** sprawdza czy wpis istnieje
6. **ServiceEntryService** wykonuje DELETE
7. **API Route** zwraca odpowiedź ze statusem 200 OK

## 6. Względy bezpieczeństwa

### Uwierzytelnienie

- Weryfikacja sesji przez `supabase.auth.getUser()` przed jakąkolwiek operacją
- Odrzucenie żądania z kodem 401 jeśli brak ważnej sesji

### Autoryzacja

- **Tylko właściciele (owner)** mogą usuwać wpisy serwisowe
- Sprawdzenie roli przez funkcję bazodanową `is_owner()`
- Odrzucenie żądania z kodem 403 jeśli użytkownik nie jest owner
- RLS policies zapewniają dodatkową warstwę ochrony

### Walidacja danych wejściowych

- Walidacja UUID parametru ścieżki przed dalszym przetwarzaniem

### Ochrona przed przypadkowym usunięciem

- Autoryzacja tylko dla owner zapobiega przypadkowemu usunięciu przez pracowników
- Brak możliwości przywrócenia usuniętych danych

## 7. Obsługa błędów

### Scenariusze błędów

| Scenariusz | Kod HTTP | Komunikat | Akcja |
|------------|----------|-----------|-------|
| Nieprawidłowy UUID | 400 | "Invalid service entry ID format" | Poprawienie ID w URL |
| Brak tokena sesji | 401 | "Unauthorized" | Przekierowanie do logowania |
| Nieważna sesja | 401 | "Unauthorized" | Przekierowanie do logowania |
| Użytkownik nie jest owner | 403 | "Only owner can delete service entries" | Brak dostępu |
| Wpis nie istnieje | 404 | "Service entry not found" | Sprawdzenie ID |
| Błąd bazy danych | 500 | "Internal server error" | Logowanie, retry |

### Implementacja obsługi błędów

```typescript
export const DELETE: APIRoute = async ({ params, locals }) => {
  const supabase = locals.supabase;

  // 1. Walidacja path parameter
  const idValidation = serviceEntryIdSchema.safeParse(params.id);
  if (!idValidation.success) {
    return new Response(
      JSON.stringify({ error: "Invalid service entry ID format" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 2. Sprawdzenie autentykacji
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // 3. Sprawdzenie autoryzacji (tylko owner)
  const { data: isOwner } = await supabase.rpc("is_owner");
  if (!isOwner) {
    return new Response(
      JSON.stringify({ error: "Only owner can delete service entries" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // 4. Usunięcie wpisu serwisowego
  try {
    const serviceEntryService = createServiceEntryService(supabase);
    await serviceEntryService.deleteServiceEntry(idValidation.data);

    return new Response(
      JSON.stringify({ message: "Service entry deleted successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error deleting service entry:", error);

    if (error instanceof Error && error.message === "Service entry not found") {
      return new Response(
        JSON.stringify({ error: "Service entry not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
```

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

1. **Sprawdzenie roli owner** - dodatkowe wywołanie RPC
2. **Sprawdzenie istnienia wpisu** - dodatkowe zapytanie SELECT

### Strategie optymalizacji

1. **Sprawdzenie owner przez RPC:**
   - Funkcja `is_owner()` jest zoptymalizowana (SECURITY DEFINER)
   - Wykonuje proste zapytanie do tabeli profiles

2. **Indeksy bazodanowe:**
   - `service_entries.id` - PRIMARY KEY (indeks automatyczny)

3. **Transakcyjność:**
   - DELETE jest atomowy
   - Rollback w przypadku błędu

4. **Kolejność operacji:**
   - Sprawdzenie autoryzacji przed operacją delete
   - Fail-fast pattern dla nieautoryzowanych żądań

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie ServiceEntryService

**Plik:** `src/lib/services/service-entry.service.ts` (dodanie metody)

```typescript
/**
 * Deletes a service entry.
 * @throws Error if service entry not found
 */
async deleteServiceEntry(id: string): Promise<void> {
  // First check if service entry exists
  const { data: existing, error: checkError } = await this.supabase
    .from("service_entries")
    .select("id")
    .eq("id", id)
    .single();

  if (checkError || !existing) {
    throw new Error("Service entry not found");
  }

  // Delete service entry
  const { error } = await this.supabase
    .from("service_entries")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete service entry: ${error.message}`);
  }
}
```

### Krok 2: Dodanie DELETE handlera do API Route

**Plik:** `src/pages/api/service-entries/[id].ts` (rozszerzenie)

```typescript
import type { APIRoute } from "astro";
import type { ErrorResponse, DeleteResponse } from "../../../types";
import { serviceEntryIdSchema } from "../../../lib/schemas/service-entry.schema";
import { createServiceEntryService } from "../../../lib/services/service-entry.service";

export const prerender = false;

// ... existing GET and PATCH handlers ...

/**
 * DELETE /api/service-entries/{id}
 *
 * Deletes a service entry. Owner only.
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  const supabase = locals.supabase;

  // 1. Validate path parameter
  const idValidation = serviceEntryIdSchema.safeParse(params.id);
  if (!idValidation.success) {
    const errorResponse: ErrorResponse = { error: "Invalid service entry ID format" };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    const errorResponse: ErrorResponse = { error: "Unauthorized" };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. Check authorization (owner only)
  const { data: isOwner } = await supabase.rpc("is_owner");
  if (!isOwner) {
    const errorResponse: ErrorResponse = { error: "Only owner can delete service entries" };
    return new Response(JSON.stringify(errorResponse), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 4. Delete service entry
  try {
    const serviceEntryService = createServiceEntryService(supabase);
    await serviceEntryService.deleteServiceEntry(idValidation.data);

    const successResponse: DeleteResponse = { message: "Service entry deleted successfully" };
    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting service entry:", error);

    if (error instanceof Error && error.message === "Service entry not found") {
      const errorResponse: ErrorResponse = { error: "Service entry not found" };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const errorResponse: ErrorResponse = { error: "Internal server error" };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

### Krok 3: Testy manualne

1. **Test bez autentykacji:**
   ```bash
   curl -X DELETE "http://localhost:4321/api/service-entries/550e8400-e29b-41d4-a716-446655440010"
   # Oczekiwany: 401 Unauthorized
   ```

2. **Test z nieprawidłowym UUID:**
   ```bash
   curl -X DELETE "http://localhost:4321/api/service-entries/invalid-uuid" \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 400 Invalid service entry ID format
   ```

3. **Test jako worker (nie-owner):**
   ```bash
   # Zaloguj się jako worker
   curl -X DELETE "http://localhost:4321/api/service-entries/550e8400-e29b-41d4-a716-446655440010" \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 403 Only owner can delete service entries
   ```

4. **Test z nieistniejącym wpisem (jako owner):**
   ```bash
   curl -X DELETE "http://localhost:4321/api/service-entries/550e8400-e29b-41d4-a716-000000000000" \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 404 Service entry not found
   ```

5. **Test poprawnego usunięcia (jako owner):**
   ```bash
   curl -X DELETE "http://localhost:4321/api/service-entries/550e8400-e29b-41d4-a716-446655440010" \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 200 { "message": "Service entry deleted successfully" }
   ```

## 10. Checklist przed wdrożeniem

- [ ] Dodano metodę deleteServiceEntry do `src/lib/services/service-entry.service.ts`
- [ ] Dodano DELETE handler do `src/pages/api/service-entries/[id].ts`
- [ ] Zweryfikowano działanie funkcji is_owner() w bazie
- [ ] Przeprowadzono testy manualne wszystkich scenariuszy
- [ ] Sprawdzono czy linter nie zgłasza błędów
- [ ] Zweryfikowano autoryzację tylko dla owner (403)
- [ ] Zweryfikowano obsługę nieistniejącego wpisu (404)
- [ ] Zweryfikowano atomowość operacji
