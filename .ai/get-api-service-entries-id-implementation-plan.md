# API Endpoint Implementation Plan: GET /api/service-entries/{id}

## 1. Przegląd punktu końcowego

Endpoint `GET /api/service-entries/{id}` służy do pobierania szczegółów pojedynczego wpisu serwisowego. Zwraca pełne informacje o wpisie wraz z zagnieżdżonymi danymi o wykonawcy (performer), twórcy (created_by) i ostatnio modyfikującym (updated_by). Dostępny dla wszystkich uwierzytelnionych użytkowników (owner i worker).

**Cel biznesowy:** Umożliwienie użytkownikom przeglądania szczegółowych informacji o konkretnym wpisie serwisowym.

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/service-entries/{id}`
- **Lokalizacja pliku:** `src/pages/api/service-entries/[id].ts`

### Parametry ścieżki

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `id` | uuid | Tak | UUID wpisu serwisowego |

### Request Body

Brak - metoda GET nie przyjmuje body.

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

// Referencja użytkownika
interface UserReference {
  id: string;
  name: string;
}
```

### Schematy walidacji

```typescript
// src/lib/schemas/service-entry.schema.ts
import { z } from "zod";

export const serviceEntryIdSchema = z.string().uuid("Invalid service entry ID format");
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
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
  "created_at": "2024-01-15T14:35:00Z",
  "created_by": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Jan Kowalski"
  },
  "updated_at": "2024-01-15T14:35:00Z",
  "updated_by": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Jan Kowalski"
  }
}
```

### Błędy

| Status | Opis | Przykładowa odpowiedź |
|--------|------|----------------------|
| 400 | Nieprawidłowe ID wpisu | `{"error": "Invalid service entry ID format"}` |
| 401 | Brak uwierzytelnienia | `{"error": "Unauthorized"}` |
| 404 | Wpis nie znaleziony | `{"error": "Service entry not found"}` |
| 500 | Błąd serwera | `{"error": "Internal server error"}` |

## 5. Przepływ danych

```
┌─────────────────┐
│   Klient HTTP   │
└────────┬────────┘
         │ GET /api/service-entries/{id}
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Route Handler                         │
│  src/pages/api/service-entries/[id].ts                      │
├─────────────────────────────────────────────────────────────┤
│  1. Walidacja path parameter (UUID)                         │
│  2. Sprawdzenie autentykacji (supabase.auth.getUser())      │
│  3. Wywołanie ServiceEntryService.getServiceEntry()         │
│  4. Formatowanie i zwrot odpowiedzi                         │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                  ServiceEntryService                         │
│  src/lib/services/service-entry.service.ts                  │
├─────────────────────────────────────────────────────────────┤
│  1. SELECT z service_entries WHERE id                       │
│  2. JOIN z profiles dla performer, created_by, updated_by   │
│  3. Mapowanie na ServiceEntryDTO                            │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                                │
├───────────────────────────────────┬─────────────────────────┤
│  service_entries                  │  profiles               │
│  - SELECT by id                   │  - JOIN for performer   │
│  - single()                       │  - JOIN for created_by  │
│                                   │  - JOIN for updated_by  │
└───────────────────────────────────┴─────────────────────────┘
```

### Szczegółowy przepływ

1. **Klient** wysyła żądanie GET z id w URL
2. **API Route** waliduje UUID z parametru ścieżki
3. **API Route** sprawdza sesję użytkownika przez `supabase.auth.getUser()`
4. **ServiceEntryService** wykonuje SELECT z:
   - JOIN do `profiles` dla performer
   - JOIN do `profiles` dla created_by
   - JOIN do `profiles` dla updated_by
5. **ServiceEntryService** mapuje wynik na `ServiceEntryDTO`
6. **API Route** zwraca odpowiedź ze statusem 200 OK

## 6. Względy bezpieczeństwa

### Uwierzytelnienie

- Weryfikacja sesji przez `supabase.auth.getUser()` przed przetwarzaniem
- Odrzucenie żądania z kodem 401 jeśli brak ważnej sesji

### Autoryzacja

- Endpoint dostępny dla wszystkich uwierzytelnionych użytkowników (owner i worker)
- RLS policies zapewniają że użytkownik widzi tylko dozwolone dane

### Walidacja danych wejściowych

- Walidacja UUID parametru ścieżki

### Ochrona przed SQL Injection

- Użycie parametryzowanych zapytań Supabase
- Brak bezpośredniego wstawiania danych użytkownika do zapytań

## 7. Obsługa błędów

### Scenariusze błędów

| Scenariusz | Kod HTTP | Komunikat | Akcja |
|------------|----------|-----------|-------|
| Nieprawidłowy UUID | 400 | "Invalid service entry ID format" | Poprawienie ID w URL |
| Brak tokena sesji | 401 | "Unauthorized" | Przekierowanie do logowania |
| Nieważna sesja | 401 | "Unauthorized" | Przekierowanie do logowania |
| Wpis nie istnieje | 404 | "Service entry not found" | Sprawdzenie ID |
| Błąd bazy danych | 500 | "Internal server error" | Logowanie, retry |

### Implementacja obsługi błędów

```typescript
export const GET: APIRoute = async ({ params, locals }) => {
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

  // 3. Pobranie wpisu serwisowego
  try {
    const serviceEntryService = createServiceEntryService(supabase);
    const result = await serviceEntryService.getServiceEntry(idValidation.data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching service entry:", error);

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

1. **Potrójny JOIN** - performer, created_by, updated_by
2. **SELECT z single()** - wymaga dokładnie jednego wyniku

### Strategie optymalizacji

1. **Indeksy bazodanowe:**
   - `service_entries.id` - PRIMARY KEY (indeks automatyczny)
   - `profiles.id` - PRIMARY KEY dla JOINów

2. **Optymalizacja zapytania:**
   - Użycie `.single()` wymusza zwrot jednego rekordu
   - Jedno zapytanie z JOINami zamiast wielu zapytań

3. **Selektywne pobieranie:**
   - Pobieranie tylko potrzebnych kolumn z profiles (id, name)

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie schematu walidacji

**Plik:** `src/lib/schemas/service-entry.schema.ts` (rozszerzenie)

```typescript
/**
 * Service entry ID validation schema
 */
export const serviceEntryIdSchema = z.string().uuid("Invalid service entry ID format");
```

### Krok 2: Rozszerzenie ServiceEntryService

**Plik:** `src/lib/services/service-entry.service.ts` (dodanie metody)

```typescript
/**
 * Gets a specific service entry by ID with user references.
 * @throws Error if service entry not found
 */
async getServiceEntry(id: string): Promise<ServiceEntryDTO> {
  const { data, error } = await this.supabase
    .from("service_entries")
    .select(
      `
      *,
      performer:profiles!service_entries_performer_id_fkey(id, name),
      creator:profiles!service_entries_created_by_fkey(id, name),
      updater:profiles!service_entries_updated_by_fkey(id, name)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new Error("Service entry not found");
    }
    throw new Error(`Failed to fetch service entry: ${error.message}`);
  }

  if (!data) {
    throw new Error("Service entry not found");
  }

  // Map to DTO with UserReference objects
  return {
    id: data.id,
    equipment_id: data.equipment_id,
    service_timestamp: data.service_timestamp,
    service_type: data.service_type,
    description: data.description,
    performer: data.performer as UserReference,
    created_at: data.created_at,
    created_by: data.creator as UserReference,
    updated_at: data.updated_at,
    updated_by: data.updater as UserReference,
  };
}
```

### Krok 3: Utworzenie API Route

**Plik:** `src/pages/api/service-entries/[id].ts` (nowy)

```typescript
import type { APIRoute } from "astro";
import type { ErrorResponse, ServiceEntryDTO } from "../../../types";
import { serviceEntryIdSchema } from "../../../lib/schemas/service-entry.schema";
import { createServiceEntryService } from "../../../lib/services/service-entry.service";

export const prerender = false;

/**
 * GET /api/service-entries/{id}
 *
 * Gets a specific service entry with user references.
 * Accessible by all authenticated users.
 */
export const GET: APIRoute = async ({ params, locals }) => {
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

  // 3. Fetch service entry
  try {
    const serviceEntryService = createServiceEntryService(supabase);
    const result = await serviceEntryService.getServiceEntry(idValidation.data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching service entry:", error);

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

### Krok 4: Testy manualne

1. **Test bez autentykacji:**
   ```bash
   curl -X GET "http://localhost:4321/api/service-entries/550e8400-e29b-41d4-a716-446655440010"
   # Oczekiwany: 401 Unauthorized
   ```

2. **Test z nieprawidłowym UUID:**
   ```bash
   curl -X GET "http://localhost:4321/api/service-entries/invalid-uuid" \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 400 Invalid service entry ID format
   ```

3. **Test z nieistniejącym wpisem:**
   ```bash
   curl -X GET "http://localhost:4321/api/service-entries/550e8400-e29b-41d4-a716-000000000000" \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 404 Service entry not found
   ```

4. **Test poprawnego pobrania:**
   ```bash
   curl -X GET "http://localhost:4321/api/service-entries/550e8400-e29b-41d4-a716-446655440010" \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 200 OK z pełnym ServiceEntryDTO
   ```

## 10. Checklist przed wdrożeniem

- [ ] Dodano serviceEntryIdSchema do `src/lib/schemas/service-entry.schema.ts`
- [ ] Dodano metodę getServiceEntry do `src/lib/services/service-entry.service.ts`
- [ ] Utworzono plik `src/pages/api/service-entries/[id].ts` z GET handlerem
- [ ] Przeprowadzono testy manualne wszystkich scenariuszy
- [ ] Sprawdzono czy linter nie zgłasza błędów
- [ ] Zweryfikowano poprawność JOINów z profiles
- [ ] Zweryfikowano mapowanie na UserReference dla performer, created_by, updated_by
- [ ] Zweryfikowano obsługę nieistniejącego wpisu (404)
