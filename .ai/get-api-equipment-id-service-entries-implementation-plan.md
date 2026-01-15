# API Endpoint Implementation Plan: GET /api/equipment/{equipmentId}/service-entries

## 1. Przegląd punktu końcowego

Endpoint `GET /api/equipment/{equipmentId}/service-entries` służy do pobierania listy wpisów serwisowych dla określonego sprzętu z paginacją. Dostępny dla wszystkich uwierzytelnionych użytkowników.

**Cel biznesowy:** Umożliwienie użytkownikom przeglądania pełnej historii serwisowej konkretnego urządzenia.

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/equipment/{equipmentId}/service-entries`
- **Lokalizacja pliku:** `src/pages/api/equipment/[id]/service-entries.ts`

### Parametry ścieżki

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `equipmentId` | uuid | Tak | UUID sprzętu |

### Query Parameters

| Parametr | Typ | Domyślnie | Opis | Walidacja |
|----------|-----|-----------|------|-----------|
| `page` | integer | 1 | Numer strony | min: 1 |
| `limit` | integer | 50 | Liczba elementów na stronę | min: 1, max: 100 |

### Nagłówki

| Nagłówek | Wymagany | Opis |
|----------|----------|------|
| `Cookie` | Tak | Sesja uwierzytelniania Supabase |

## 3. Wykorzystywane typy

### Istniejące typy z `src/types.ts`

```typescript
// DTO dla wpisu serwisowego z zagnieżdżonymi referencjami użytkowników
interface ServiceEntryDTO {
  id: string;
  equipment_id: string;
  service_timestamp: string;
  service_type: ServiceType;
  description: string;
  performer: UserReference;      // { id, name }
  created_at: string;
  created_by: UserReference;     // { id, name }
  updated_at: string;
  updated_by: UserReference;     // { id, name }
}

// Alias dla listy
type ServiceEntryListItemDTO = ServiceEntryDTO;

// Paginowana odpowiedź
type ServiceEntryListResponse = PaginatedResponse<ServiceEntryListItemDTO>;

// Referencja użytkownika
interface UserReference {
  id: string;
  name: string;
}

// Parametry paginacji
interface PaginationParams {
  page?: number;
  limit?: number;
}
```

### Schematy walidacji

```typescript
// src/lib/schemas/service-entry.schema.ts
import { z } from "zod";

export const serviceEntryListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type ServiceEntryListParams = z.infer<typeof serviceEntryListParamsSchema>;

// src/lib/schemas/equipment.schema.ts (istniejący)
export const equipmentIdSchema = z.string().uuid("Invalid equipment ID format");
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "equipment_id": "550e8400-e29b-41d4-a716-446655440000",
      "service_timestamp": "2024-01-15T14:30:00Z",
      "service_type": "maintenance",
      "description": "Czyszczenie wentylatorów i wymiana pasty termoprzewodzącej",
      "performer": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Jan Kowalski"
      },
      "created_at": "2024-01-15T14:30:00Z",
      "created_by": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Jan Kowalski"
      },
      "updated_at": "2024-01-15T14:30:00Z",
      "updated_by": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Jan Kowalski"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25,
    "totalPages": 1
  }
}
```

### Błędy

| Status | Opis | Przykładowa odpowiedź |
|--------|------|----------------------|
| 400 | Nieprawidłowe ID sprzętu | `{"error": "Invalid equipment ID format"}` |
| 400 | Nieprawidłowe parametry paginacji | `{"error": "Validation failed", "details": {"limit": ["Number must be at most 100"]}}` |
| 401 | Brak uwierzytelnienia | `{"error": "Unauthorized"}` |
| 404 | Sprzęt nie znaleziony | `{"error": "Equipment not found"}` |
| 500 | Błąd serwera | `{"error": "Internal server error"}` |

## 5. Przepływ danych

```
┌─────────────────┐
│   Klient HTTP   │
└────────┬────────┘
         │ GET /api/equipment/{equipmentId}/service-entries?page=1&limit=50
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Route Handler                         │
│  src/pages/api/equipment/[id]/service-entries.ts            │
├─────────────────────────────────────────────────────────────┤
│  1. Walidacja path parameter (UUID)                         │
│  2. Sprawdzenie autentykacji (supabase.auth.getUser())      │
│  3. Parsowanie i walidacja query params (Zod)               │
│  4. Wywołanie ServiceEntryService.listByEquipment()         │
│  5. Formatowanie i zwrot odpowiedzi                         │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                  ServiceEntryService                         │
│  src/lib/services/service-entry.service.ts                  │
├─────────────────────────────────────────────────────────────┤
│  1. Sprawdzenie czy sprzęt istnieje                         │
│  2. SELECT z service_entries WHERE equipment_id             │
│  3. JOIN z profiles dla performer, created_by, updated_by   │
│  4. Paginacja i count                                       │
│  5. Mapowanie na ServiceEntryListItemDTO[]                  │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                                │
├─────────────────────────────────────────────────────────────┤
│  service_entries                  │  profiles               │
│  - SELECT with equipment_id filter│  - JOIN for performer   │
│  - ORDER BY service_timestamp DESC│  - JOIN for created_by  │
│  - RANGE for pagination           │  - JOIN for updated_by  │
└───────────────────────────────────┴─────────────────────────┘
```

### Szczegółowy przepływ

1. **Klient** wysyła żądanie GET z equipmentId w URL i opcjonalnymi parametrami paginacji
2. **API Route** waliduje UUID z parametru ścieżki
3. **API Route** sprawdza sesję użytkownika przez `supabase.auth.getUser()`
4. **API Route** parsuje i waliduje query params przez Zod schema
5. **ServiceEntryService** sprawdza czy sprzęt istnieje
6. **ServiceEntryService** wykonuje SELECT z:
   - Filtrem `equipment_id`
   - JOIN do `profiles` dla performer, created_by, updated_by
   - Sortowaniem po `service_timestamp DESC`
   - Paginacją
7. **ServiceEntryService** mapuje wyniki na `ServiceEntryListItemDTO[]`
8. **API Route** zwraca odpowiedź ze statusem 200 OK

## 6. Względy bezpieczeństwa

### Uwierzytelnienie

- Weryfikacja sesji przez `supabase.auth.getUser()` przed przetwarzaniem
- Odrzucenie żądania z kodem 401 jeśli brak ważnej sesji

### Autoryzacja

- Endpoint dostępny dla wszystkich uwierzytelnionych użytkowników (owner i worker)
- RLS policies zapewniają że użytkownik widzi tylko dozwolone dane

### Walidacja danych wejściowych

- Walidacja UUID parametru ścieżki (equipmentId)
- Walidacja query params przez Zod schema z wartościami domyślnymi
- Ograniczenie limit do maksymalnie 100

### Sprawdzenie istnienia sprzętu

- Weryfikacja że equipment_id istnieje przed pobraniem wpisów
- Zwrot 404 jeśli sprzęt nie istnieje

### Ochrona przed SQL Injection

- Użycie parametryzowanych zapytań Supabase
- Brak bezpośredniego wstawiania danych użytkownika do zapytań

## 7. Obsługa błędów

### Scenariusze błędów

| Scenariusz | Kod HTTP | Komunikat | Akcja |
|------------|----------|-----------|-------|
| Nieprawidłowy UUID | 400 | "Invalid equipment ID format" | Poprawienie ID w URL |
| Nieprawidłowe parametry | 400 | "Validation failed" + details | Poprawienie parametrów |
| Brak tokena sesji | 401 | "Unauthorized" | Przekierowanie do logowania |
| Nieważna sesja | 401 | "Unauthorized" | Przekierowanie do logowania |
| Sprzęt nie istnieje | 404 | "Equipment not found" | Sprawdzenie ID |
| Błąd bazy danych | 500 | "Internal server error" | Logowanie, retry |

### Implementacja obsługi błędów

```typescript
export const GET: APIRoute = async ({ params, locals, request }) => {
  const supabase = locals.supabase;

  // 1. Walidacja path parameter
  const idValidation = equipmentIdSchema.safeParse(params.id);
  if (!idValidation.success) {
    return new Response(
      JSON.stringify({ error: "Invalid equipment ID format" }),
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

  // 3. Parsowanie query params
  const url = new URL(request.url);
  const queryParams = {
    page: url.searchParams.get("page"),
    limit: url.searchParams.get("limit"),
  };

  const paramsValidation = serviceEntryListParamsSchema.safeParse(queryParams);
  if (!paramsValidation.success) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        details: paramsValidation.error.flatten().fieldErrors
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 4. Pobranie wpisów serwisowych
  try {
    const serviceEntryService = createServiceEntryService(supabase);
    const result = await serviceEntryService.listByEquipment(
      idValidation.data,
      paramsValidation.data
    );
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching service entries:", error);

    if (error instanceof Error && error.message === "Equipment not found") {
      return new Response(
        JSON.stringify({ error: "Equipment not found" }),
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

1. **Sprawdzenie istnienia sprzętu** - dodatkowe zapytanie SELECT
2. **Potrójny JOIN** - performer, created_by, updated_by
3. **COUNT dla paginacji** - może być kosztowne przy dużej liczbie rekordów

### Strategie optymalizacji

1. **Indeksy bazodanowe:**
   - `service_entries.equipment_id` - indeks FK
   - `service_entries.service_timestamp` - dla sortowania
   - `profiles.id` - PRIMARY KEY dla JOINów

2. **Optymalizacja zapytania:**
   - Użycie `.select('*', { count: 'exact' })` dla jednoczesnego pobierania danych i count
   - Sortowanie po `service_timestamp DESC` (najnowsze pierwsze)

3. **Paginacja:**
   - Limit maksymalnie 100 rekordów na stronę
   - Offset-based pagination z wykorzystaniem `.range()`

4. **Sprawdzenie sprzętu:**
   - Proste zapytanie SELECT z id tylko
   - Szybkie dzięki PRIMARY KEY

## 9. Etapy wdrożenia

### Krok 1: Utworzenie schematu walidacji

**Plik:** `src/lib/schemas/service-entry.schema.ts` (nowy)

```typescript
import { z } from "zod";

/**
 * Service entry list query parameters schema
 */
export const serviceEntryListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type ServiceEntryListParams = z.infer<typeof serviceEntryListParamsSchema>;
```

### Krok 2: Utworzenie ServiceEntryService

**Plik:** `src/lib/services/service-entry.service.ts` (nowy)

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type {
  ServiceEntryListResponse,
  ServiceEntryListItemDTO,
  UserReference,
} from "../../types";
import type { ServiceEntryListParams } from "../schemas/service-entry.schema";

export function createServiceEntryService(
  supabase: SupabaseClient<Database>
) {
  return {
    /**
     * Lists service entries for specific equipment with pagination.
     * @throws Error if equipment not found
     */
    async listByEquipment(
      equipmentId: string,
      params: ServiceEntryListParams
    ): Promise<ServiceEntryListResponse> {
      const { page, limit } = params;
      const offset = (page - 1) * limit;

      // 1. Check if equipment exists
      const { data: equipment, error: equipmentError } = await supabase
        .from("equipment")
        .select("id")
        .eq("id", equipmentId)
        .single();

      if (equipmentError || !equipment) {
        throw new Error("Equipment not found");
      }

      // 2. Query service entries with profile joins
      const { data, error, count } = await supabase
        .from("service_entries")
        .select(
          `
          *,
          performer:profiles!service_entries_performer_id_fkey(id, name),
          creator:profiles!service_entries_created_by_fkey(id, name),
          updater:profiles!service_entries_updated_by_fkey(id, name)
        `,
          { count: "exact" }
        )
        .eq("equipment_id", equipmentId)
        .order("service_timestamp", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to fetch service entries: ${error.message}`);
      }

      // 3. Map to DTOs
      const items: ServiceEntryListItemDTO[] = (data ?? []).map((entry) => ({
        id: entry.id,
        equipment_id: entry.equipment_id,
        service_timestamp: entry.service_timestamp,
        service_type: entry.service_type,
        description: entry.description,
        performer: entry.performer as UserReference,
        created_at: entry.created_at,
        created_by: entry.creator as UserReference,
        updated_at: entry.updated_at,
        updated_by: entry.updater as UserReference,
      }));

      const total = count ?? 0;
      const totalPages = Math.ceil(total / limit);

      return {
        data: items,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    },
  };
}
```

### Krok 3: Utworzenie API Route

**Plik:** `src/pages/api/equipment/[id]/service-entries.ts` (nowy)

```typescript
import type { APIRoute } from "astro";
import type { ErrorResponse, ServiceEntryListResponse } from "../../../../types";
import { equipmentIdSchema } from "../../../../lib/schemas/equipment.schema";
import { serviceEntryListParamsSchema } from "../../../../lib/schemas/service-entry.schema";
import { createServiceEntryService } from "../../../../lib/services/service-entry.service";

export const prerender = false;

/**
 * GET /api/equipment/{equipmentId}/service-entries
 *
 * Lists service entries for specific equipment with pagination.
 * Accessible by all authenticated users.
 */
export const GET: APIRoute = async ({ params, locals, request }) => {
  const supabase = locals.supabase;

  // 1. Validate path parameter
  const idValidation = equipmentIdSchema.safeParse(params.id);
  if (!idValidation.success) {
    const errorResponse: ErrorResponse = { error: "Invalid equipment ID format" };
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

  // 3. Parse and validate query params
  const url = new URL(request.url);
  const queryParams = {
    page: url.searchParams.get("page"),
    limit: url.searchParams.get("limit"),
  };

  const paramsValidation = serviceEntryListParamsSchema.safeParse(queryParams);
  if (!paramsValidation.success) {
    const errorResponse: ErrorResponse = {
      error: "Validation failed",
      details: paramsValidation.error.flatten().fieldErrors,
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 4. Fetch service entries
  try {
    const serviceEntryService = createServiceEntryService(supabase);
    const result = await serviceEntryService.listByEquipment(
      idValidation.data,
      paramsValidation.data
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching service entries:", error);

    if (error instanceof Error && error.message === "Equipment not found") {
      const errorResponse: ErrorResponse = { error: "Equipment not found" };
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

### Krok 4: Testy manualne

1. **Test bez autentykacji:**
   ```bash
   curl -X GET "http://localhost:4321/api/equipment/550e8400-e29b-41d4-a716-446655440000/service-entries"
   # Oczekiwany: 401 Unauthorized
   ```

2. **Test z nieprawidłowym UUID:**
   ```bash
   curl -X GET "http://localhost:4321/api/equipment/invalid-uuid/service-entries" \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 400 Invalid equipment ID format
   ```

3. **Test z nieistniejącym sprzętem:**
   ```bash
   curl -X GET "http://localhost:4321/api/equipment/550e8400-e29b-41d4-a716-000000000000/service-entries" \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 404 Equipment not found
   ```

4. **Test z domyślnymi parametrami:**
   ```bash
   curl -X GET "http://localhost:4321/api/equipment/550e8400-e29b-41d4-a716-446655440000/service-entries" \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 200 OK z paginacją page=1, limit=50
   ```

5. **Test z parametrami paginacji:**
   ```bash
   curl -X GET "http://localhost:4321/api/equipment/550e8400-e29b-41d4-a716-446655440000/service-entries?page=2&limit=10" \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 200 OK z paginacją page=2, limit=10
   ```

6. **Test z nieprawidłowym limit:**
   ```bash
   curl -X GET "http://localhost:4321/api/equipment/550e8400-e29b-41d4-a716-446655440000/service-entries?limit=200" \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 400 Validation failed (limit max 100)
   ```

## 10. Checklist przed wdrożeniem

- [ ] Utworzono `src/lib/schemas/service-entry.schema.ts` z serviceEntryListParamsSchema
- [ ] Utworzono `src/lib/services/service-entry.service.ts` z metodą listByEquipment
- [ ] Utworzono `src/pages/api/equipment/[id]/service-entries.ts` z GET handlerem
- [ ] Przeprowadzono testy manualne wszystkich scenariuszy
- [ ] Sprawdzono czy linter nie zgłasza błędów
- [ ] Zweryfikowano poprawność JOINów z profiles
- [ ] Zweryfikowano sortowanie po service_timestamp DESC
- [ ] Zweryfikowano paginację i count
- [ ] Zweryfikowano obsługę nieistniejącego sprzętu (404)
