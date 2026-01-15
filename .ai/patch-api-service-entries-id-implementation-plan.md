# API Endpoint Implementation Plan: PATCH /api/service-entries/{id}

## 1. Przegląd punktu końcowego

Endpoint `PATCH /api/service-entries/{id}` służy do aktualizacji istniejącego wpisu serwisowego. Pole `performer_id` nie może być modyfikowane. Dostępny dla wszystkich uwierzytelnionych użytkowników (owner i worker).

**Cel biznesowy:** Umożliwienie użytkownikom korekty lub uzupełnienia informacji w istniejących wpisach serwisowych bez zmiany osoby wykonującej serwis.

## 2. Szczegóły żądania

- **Metoda HTTP:** PATCH
- **Struktura URL:** `/api/service-entries/{id}`
- **Lokalizacja pliku:** `src/pages/api/service-entries/[id].ts`

### Parametry ścieżki

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `id` | uuid | Tak | UUID wpisu serwisowego |

### Request Body (wszystkie pola opcjonalne)

| Pole | Typ | Wymagane | Opis | Walidacja |
|------|-----|----------|------|-----------|
| `service_timestamp` | string | Nie | Data i czas serwisu | ISO 8601 datetime |
| `service_type` | string | Nie | Typ operacji | enum: inspection, repair, maintenance |
| `description` | string | Nie | Opis wykonanych prac | min: 5 znaków |

```json
{
  "service_type": "repair",
  "description": "Naprawa uszkodzonego wentylatora i wymiana zasilacza"
}
```

### Nagłówki

| Nagłówek | Wymagany | Opis |
|----------|----------|------|
| `Cookie` | Tak | Sesja uwierzytelniania Supabase |
| `Content-Type` | Tak | application/json |

## 3. Wykorzystywane typy

### Istniejące typy z `src/types.ts`

```typescript
// Command model dla aktualizacji wpisu serwisowego
type UpdateServiceEntryCommand = Partial<CreateServiceEntryCommand>;

// DTO odpowiedzi (z UUID zamiast UserReference)
interface ServiceEntryResponseDTO {
  id: string;
  equipment_id: string;
  service_timestamp: string;
  service_type: ServiceType;
  description: string;
  performer_id: string;      // UUID
  created_at: string;
  created_by: string;        // UUID
  updated_at: string;
  updated_by: string;        // UUID
}
```

### Schematy walidacji

```typescript
// src/lib/schemas/service-entry.schema.ts (rozszerzenie)
export const serviceEntryIdSchema = z.string().uuid("Invalid service entry ID format");

export const updateServiceEntrySchema = createServiceEntrySchema.partial();

export type UpdateServiceEntryInput = z.infer<typeof updateServiceEntrySchema>;
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440010",
  "equipment_id": "550e8400-e29b-41d4-a716-446655440000",
  "service_timestamp": "2024-01-15T14:30:00Z",
  "service_type": "repair",
  "description": "Naprawa uszkodzonego wentylatora i wymiana zasilacza",
  "performer_id": "550e8400-e29b-41d4-a716-446655440001",
  "created_at": "2024-01-15T14:35:00Z",
  "created_by": "550e8400-e29b-41d4-a716-446655440001",
  "updated_at": "2024-01-16T10:20:00Z",
  "updated_by": "550e8400-e29b-41d4-a716-446655440002"
}
```

### Błędy

| Status | Opis | Przykładowa odpowiedź |
|--------|------|----------------------|
| 400 | Nieprawidłowe ID wpisu | `{"error": "Invalid service entry ID format"}` |
| 400 | Nieprawidłowe body lub walidacja | `{"error": "Validation failed", "details": {"description": ["Description must be at least 5 characters"]}}` |
| 400 | Nieprawidłowy JSON | `{"error": "Invalid JSON body"}` |
| 400 | Puste body | `{"error": "Request body cannot be empty"}` |
| 401 | Brak uwierzytelnienia | `{"error": "Unauthorized"}` |
| 404 | Wpis nie znaleziony | `{"error": "Service entry not found"}` |
| 500 | Błąd serwera | `{"error": "Internal server error"}` |

## 5. Przepływ danych

```
┌─────────────────┐
│   Klient HTTP   │
└────────┬────────┘
         │ PATCH /api/service-entries/{id}
         │ Body: { service_type?, description?, ... }
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Route Handler                         │
│  src/pages/api/service-entries/[id].ts                      │
├─────────────────────────────────────────────────────────────┤
│  1. Walidacja path parameter (UUID)                         │
│  2. Sprawdzenie autentykacji (supabase.auth.getUser())      │
│  3. Parsowanie i walidacja request body (Zod partial)       │
│  4. Sprawdzenie czy body nie jest puste                     │
│  5. Wywołanie ServiceEntryService.updateServiceEntry()      │
│  6. Formatowanie i zwrot odpowiedzi                         │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                  ServiceEntryService                         │
│  src/lib/services/service-entry.service.ts                  │
├─────────────────────────────────────────────────────────────┤
│  1. UPDATE tabeli service_entries z przekazanymi polami     │
│  2. Ustawienie updated_by z user.id                         │
│  3. Zwrot zaktualizowanego rekordu jako ServiceEntryResponseDTO│
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                                │
├─────────────────────────────────────────────────────────────┤
│  service_entries                                             │
│  - UPDATE row WHERE id = {id}                               │
│  - updated_at auto-updated by trigger                       │
│  - performer_id NOT modified                                │
└─────────────────────────────────────────────────────────────┘
```

### Szczegółowy przepływ

1. **Klient** wysyła żądanie PATCH z ID w URL i opcjonalnymi danymi w body
2. **API Route** waliduje UUID z parametru ścieżki
3. **API Route** sprawdza sesję użytkownika przez `supabase.auth.getUser()`
4. **API Route** parsuje JSON body i waliduje przez Zod schema (partial)
5. **API Route** sprawdza czy body zawiera przynajmniej jedno pole
6. **ServiceEntryService** wykonuje UPDATE z:
   - Danymi z request body (bez performer_id)
   - `updated_by` ustawionym na `user.id`
7. **Baza danych** automatycznie aktualizuje `updated_at` przez trigger
8. **ServiceEntryService** zwraca zaktualizowany rekord jako `ServiceEntryResponseDTO`
9. **API Route** zwraca odpowiedź ze statusem 200 OK

## 6. Względy bezpieczeństwa

### Uwierzytelnienie

- Weryfikacja sesji przez `supabase.auth.getUser()` przed przetwarzaniem
- Odrzucenie żądania z kodem 401 jeśli brak ważnej sesji

### Autoryzacja

- Endpoint dostępny dla wszystkich uwierzytelnionych użytkowników (owner i worker)
- RLS policies zapewniają dodatkową warstwę ochrony na poziomie bazy

### Walidacja danych wejściowych

- Walidacja UUID parametru ścieżki
- Walidacja JSON body przez Zod schema (partial)
- Walidacja enum dla service_type (jeśli podane)
- Walidacja formatu datetime dla service_timestamp (jeśli podane)
- Minimum 5 znaków dla description (jeśli podane)
- Sprawdzenie że body nie jest puste

### Niemodyfikowalne pola

- `performer_id` - nie może być zmienione przez użytkownika
- `id` - nie może być zmienione
- `equipment_id` - nie może być zmienione (wpis przypisany do sprzętu)
- `created_at`, `created_by` - dane audytowe z momentu tworzenia
- `updated_at` - zarządzane automatycznie przez trigger

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
| Nieprawidłowy JSON | 400 | "Invalid JSON body" | Poprawienie formatu |
| Puste body | 400 | "Request body cannot be empty" | Dodanie pól do aktualizacji |
| Nieprawidłowy enum | 400 | "Validation failed" + details | Poprawienie wartości |
| Krótki opis | 400 | "Validation failed" + details | Rozszerzenie opisu |
| Wpis nie istnieje | 404 | "Service entry not found" | Sprawdzenie ID |
| Błąd bazy danych | 500 | "Internal server error" | Logowanie, retry |

### Implementacja obsługi błędów

```typescript
export const PATCH: APIRoute = async ({ params, locals, request }) => {
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

  // 3. Parsowanie JSON body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 4. Walidacja body
  const validationResult = updateServiceEntrySchema.safeParse(body);
  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        details: validationResult.error.flatten().fieldErrors
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 5. Sprawdzenie czy body nie jest puste
  if (Object.keys(validationResult.data).length === 0) {
    return new Response(
      JSON.stringify({ error: "Request body cannot be empty" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 6. Aktualizacja wpisu serwisowego
  try {
    const serviceEntryService = createServiceEntryService(supabase);
    const result = await serviceEntryService.updateServiceEntry(
      idValidation.data,
      validationResult.data,
      user.id
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error updating service entry:", error);

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

1. **UPDATE z single()** - wymaga dokładnie jednego rekordu

### Strategie optymalizacji

1. **Indeksy bazodanowe:**
   - `service_entries.id` - PRIMARY KEY (indeks automatyczny)

2. **Minimalne aktualizacje:**
   - Tylko przekazane pola są aktualizowane
   - Trigger `updated_at` działa automatycznie

3. **Połączenie operacji:**
   - UPDATE zwraca zaktualizowany rekord (`.select().single()`)
   - Brak potrzeby dodatkowego SELECT

4. **Transakcyjność:**
   - Update jest atomowy
   - Rollback w przypadku błędu

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie schematu walidacji

**Plik:** `src/lib/schemas/service-entry.schema.ts` (rozszerzenie)

```typescript
/**
 * Update schema - partial version of create schema
 */
export const updateServiceEntrySchema = createServiceEntrySchema.partial();

export type UpdateServiceEntryInput = z.infer<typeof updateServiceEntrySchema>;
```

### Krok 2: Rozszerzenie ServiceEntryService

**Plik:** `src/lib/services/service-entry.service.ts` (dodanie metody)

```typescript
/**
 * Updates existing service entry.
 * performer_id cannot be modified.
 * @throws Error if service entry not found
 */
async updateServiceEntry(
  id: string,
  command: UpdateServiceEntryCommand,
  userId: string
): Promise<ServiceEntryResponseDTO> {
  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {
    ...command,
    updated_by: userId,
  };

  // Remove undefined values
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });

  const { data, error } = await this.supabase
    .from("service_entries")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    // Check if no rows were updated (service entry not found)
    if (error.code === "PGRST116") {
      throw new Error("Service entry not found");
    }
    throw new Error(`Failed to update service entry: ${error.message}`);
  }

  if (!data) {
    throw new Error("Service entry not found");
  }

  return data as ServiceEntryResponseDTO;
}
```

### Krok 3: Dodanie PATCH handlera do API Route

**Plik:** `src/pages/api/service-entries/[id].ts` (rozszerzenie)

```typescript
import type { APIRoute } from "astro";
import type { ErrorResponse, ServiceEntryResponseDTO } from "../../../types";
import { 
  serviceEntryIdSchema, 
  updateServiceEntrySchema 
} from "../../../lib/schemas/service-entry.schema";
import { createServiceEntryService } from "../../../lib/services/service-entry.service";

export const prerender = false;

// ... existing GET handler ...

/**
 * PATCH /api/service-entries/{id}
 *
 * Updates existing service entry. Cannot modify performer_id.
 * Accessible by all authenticated users.
 */
export const PATCH: APIRoute = async ({ params, locals, request }) => {
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

  // 3. Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    const errorResponse: ErrorResponse = { error: "Invalid JSON body" };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 4. Validate body
  const validationResult = updateServiceEntrySchema.safeParse(body);
  if (!validationResult.success) {
    const errorResponse: ErrorResponse = {
      error: "Validation failed",
      details: validationResult.error.flatten().fieldErrors,
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 5. Check if body is not empty
  if (Object.keys(validationResult.data).length === 0) {
    const errorResponse: ErrorResponse = { error: "Request body cannot be empty" };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 6. Update service entry
  try {
    const serviceEntryService = createServiceEntryService(supabase);
    const result = await serviceEntryService.updateServiceEntry(
      idValidation.data,
      validationResult.data,
      user.id
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating service entry:", error);

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
   curl -X PATCH "http://localhost:4321/api/service-entries/550e8400-e29b-41d4-a716-446655440010" \
     -H "Content-Type: application/json" \
     -d '{"description": "Updated description"}'
   # Oczekiwany: 401 Unauthorized
   ```

2. **Test z nieprawidłowym UUID:**
   ```bash
   curl -X PATCH "http://localhost:4321/api/service-entries/invalid-uuid" \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=..." \
     -d '{"description": "Updated description"}'
   # Oczekiwany: 400 Invalid service entry ID format
   ```

3. **Test z nieistniejącym wpisem:**
   ```bash
   curl -X PATCH "http://localhost:4321/api/service-entries/550e8400-e29b-41d4-a716-000000000000" \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=..." \
     -d '{"description": "Updated description"}'
   # Oczekiwany: 404 Service entry not found
   ```

4. **Test z pustym body:**
   ```bash
   curl -X PATCH "http://localhost:4321/api/service-entries/550e8400-e29b-41d4-a716-446655440010" \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=..." \
     -d '{}'
   # Oczekiwany: 400 Request body cannot be empty
   ```

5. **Test aktualizacji jednego pola:**
   ```bash
   curl -X PATCH "http://localhost:4321/api/service-entries/550e8400-e29b-41d4-a716-446655440010" \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=..." \
     -d '{"service_type": "repair"}'
   # Oczekiwany: 200 OK z zaktualizowanym rekordem
   ```

6. **Test aktualizacji wielu pól:**
   ```bash
   curl -X PATCH "http://localhost:4321/api/service-entries/550e8400-e29b-41d4-a716-446655440010" \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=..." \
     -d '{
       "service_type": "repair",
       "description": "Naprawa i wymiana wadliwych komponentów"
     }'
   # Oczekiwany: 200 OK z zaktualizowanym rekordem
   ```

7. **Test z krótkim opisem:**
   ```bash
   curl -X PATCH "http://localhost:4321/api/service-entries/550e8400-e29b-41d4-a716-446655440010" \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=..." \
     -d '{"description": "Fix"}'
   # Oczekiwany: 400 Validation failed (description min 5 chars)
   ```

## 10. Checklist przed wdrożeniem

- [ ] Dodano updateServiceEntrySchema do `src/lib/schemas/service-entry.schema.ts`
- [ ] Dodano metodę updateServiceEntry do `src/lib/services/service-entry.service.ts`
- [ ] Dodano PATCH handler do `src/pages/api/service-entries/[id].ts`
- [ ] Przeprowadzono testy manualne wszystkich scenariuszy
- [ ] Sprawdzono czy linter nie zgłasza błędów
- [ ] Zweryfikowano że performer_id nie może być modyfikowany
- [ ] Zweryfikowano automatyczną aktualizację updated_at i updated_by
- [ ] Zweryfikowano walidację minimum 5 znaków dla description
- [ ] Zweryfikowano obsługę nieistniejącego wpisu (404)
