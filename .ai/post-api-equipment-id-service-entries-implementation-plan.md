# API Endpoint Implementation Plan: POST /api/equipment/{equipmentId}/service-entries

## 1. Przegląd punktu końcowego

Endpoint `POST /api/equipment/{equipmentId}/service-entries` służy do tworzenia nowego wpisu serwisowego dla określonego sprzętu. Pole `performer_id` jest automatycznie ustawiane na aktualnie zalogowanego użytkownika. Dostępny dla wszystkich uwierzytelnionych użytkowników (owner i worker).

**Cel biznesowy:** Umożliwienie użytkownikom dokumentowania wykonanych czynności serwisowych (przeglądy, naprawy, konserwacje) dla sprzętu w systemie.

## 2. Szczegóły żądania

- **Metoda HTTP:** POST
- **Struktura URL:** `/api/equipment/{equipmentId}/service-entries`
- **Lokalizacja pliku:** `src/pages/api/equipment/[id]/service-entries.ts`

### Parametry ścieżki

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `equipmentId` | uuid | Tak | UUID sprzętu |

### Request Body

| Pole | Typ | Wymagane | Opis | Walidacja |
|------|-----|----------|------|-----------|
| `service_timestamp` | string | Nie | Data i czas serwisu | ISO 8601 datetime, domyślnie NOW() |
| `service_type` | string | Tak | Typ operacji | enum: inspection, repair, maintenance |
| `description` | string | Tak | Opis wykonanych prac | min: 5 znaków |

```json
{
  "service_timestamp": "2024-01-15T14:30:00Z",
  "service_type": "maintenance",
  "description": "Czyszczenie wentylatorów i wymiana pasty termoprzewodzącej"
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
// Command model dla tworzenia wpisu serwisowego
interface CreateServiceEntryCommand {
  /** ISO 8601 datetime string. Defaults to current time if not provided. */
  service_timestamp?: string;
  service_type: ServiceType;
  /** Minimum 5 characters */
  description: string;
}

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

### Schematy walidacji do rozszerzenia

```typescript
// src/lib/schemas/service-entry.schema.ts (rozszerzenie)
import { z } from "zod";

export const serviceTypeEnum = z.enum(["inspection", "repair", "maintenance"]);

export const createServiceEntrySchema = z.object({
  service_timestamp: z
    .string()
    .datetime({ message: "Invalid datetime format (expected ISO 8601)" })
    .optional(),
  service_type: serviceTypeEnum,
  description: z
    .string()
    .min(5, "Description must be at least 5 characters"),
});

export type CreateServiceEntryInput = z.infer<typeof createServiceEntrySchema>;
```

## 4. Szczegóły odpowiedzi

### Sukces (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440010",
  "equipment_id": "550e8400-e29b-41d4-a716-446655440000",
  "service_timestamp": "2024-01-15T14:30:00Z",
  "service_type": "maintenance",
  "description": "Czyszczenie wentylatorów i wymiana pasty termoprzewodzącej",
  "performer_id": "550e8400-e29b-41d4-a716-446655440001",
  "created_at": "2024-01-15T14:35:00Z",
  "created_by": "550e8400-e29b-41d4-a716-446655440001",
  "updated_at": "2024-01-15T14:35:00Z",
  "updated_by": "550e8400-e29b-41d4-a716-446655440001"
}
```

### Błędy

| Status | Opis | Przykładowa odpowiedź |
|--------|------|----------------------|
| 400 | Nieprawidłowe ID sprzętu | `{"error": "Invalid equipment ID format"}` |
| 400 | Nieprawidłowe body lub walidacja | `{"error": "Validation failed", "details": {"description": ["Description must be at least 5 characters"]}}` |
| 400 | Nieprawidłowy JSON | `{"error": "Invalid JSON body"}` |
| 401 | Brak uwierzytelnienia | `{"error": "Unauthorized"}` |
| 404 | Sprzęt nie znaleziony | `{"error": "Equipment not found"}` |
| 500 | Błąd serwera | `{"error": "Internal server error"}` |

## 5. Przepływ danych

```
┌─────────────────┐
│   Klient HTTP   │
└────────┬────────┘
         │ POST /api/equipment/{equipmentId}/service-entries
         │ Body: { service_type, description, ... }
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Route Handler                         │
│  src/pages/api/equipment/[id]/service-entries.ts            │
├─────────────────────────────────────────────────────────────┤
│  1. Walidacja path parameter (UUID)                         │
│  2. Sprawdzenie autentykacji (supabase.auth.getUser())      │
│  3. Parsowanie i walidacja request body (Zod)               │
│  4. Wywołanie ServiceEntryService.createServiceEntry()      │
│  5. Formatowanie i zwrot odpowiedzi                         │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                  ServiceEntryService                         │
│  src/lib/services/service-entry.service.ts                  │
├─────────────────────────────────────────────────────────────┤
│  1. Sprawdzenie czy sprzęt istnieje                         │
│  2. INSERT do tabeli service_entries                        │
│  3. Ustawienie performer_id, created_by, updated_by z user.id│
│  4. Zwrot utworzonego rekordu jako ServiceEntryResponseDTO  │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                                │
├─────────────────────────────────────────────────────────────┤
│  service_entries                                             │
│  - INSERT new row                                            │
│  - equipment_id from path parameter                         │
│  - performer_id = user.id (automatic)                       │
│  - service_timestamp defaults to NOW() if not provided      │
└─────────────────────────────────────────────────────────────┘
```

### Szczegółowy przepływ

1. **Klient** wysyła żądanie POST z equipmentId w URL i danymi wpisu w body
2. **API Route** waliduje UUID z parametru ścieżki
3. **API Route** sprawdza sesję użytkownika przez `supabase.auth.getUser()`
4. **API Route** parsuje JSON body i waliduje przez Zod schema
5. **ServiceEntryService** sprawdza czy sprzęt istnieje
6. **ServiceEntryService** wykonuje INSERT z:
   - `equipment_id` z URL
   - `performer_id`, `created_by`, `updated_by` ustawionym na `user.id`
   - `service_timestamp` z body lub domyślnie NOW()
7. **ServiceEntryService** zwraca utworzony rekord jako `ServiceEntryResponseDTO`
8. **API Route** zwraca odpowiedź ze statusem 201 Created

## 6. Względy bezpieczeństwa

### Uwierzytelnienie

- Weryfikacja sesji przez `supabase.auth.getUser()` przed przetwarzaniem
- Odrzucenie żądania z kodem 401 jeśli brak ważnej sesji

### Autoryzacja

- Endpoint dostępny dla wszystkich uwierzytelnionych użytkowników (owner i worker)
- RLS policies zapewniają dodatkową warstwę ochrony

### Walidacja danych wejściowych

- Walidacja UUID parametru ścieżki (equipmentId)
- Walidacja JSON body przez Zod schema
- Walidacja enum dla service_type
- Walidacja formatu datetime dla service_timestamp (ISO 8601)
- Minimum 5 znaków dla description (zgodnie z CHECK constraint w bazie)

### Automatyczne pola

- `performer_id` - automatycznie ustawiane na zalogowanego użytkownika
- `created_by`, `updated_by` - ustawiane automatycznie z sesji użytkownika
- `created_at`, `updated_at` - ustawiane automatycznie przez bazę
- `service_timestamp` - domyślnie NOW() jeśli nie podane

### Sprawdzenie istnienia sprzętu

- Weryfikacja że equipment_id istnieje przed utworzeniem wpisu
- Zwrot 404 jeśli sprzęt nie istnieje

### Ochrona przed SQL Injection

- Użycie parametryzowanych zapytań Supabase
- Brak bezpośredniego wstawiania danych użytkownika do zapytań

## 7. Obsługa błędów

### Scenariusze błędów

| Scenariusz | Kod HTTP | Komunikat | Akcja |
|------------|----------|-----------|-------|
| Nieprawidłowy UUID | 400 | "Invalid equipment ID format" | Poprawienie ID w URL |
| Brak tokena sesji | 401 | "Unauthorized" | Przekierowanie do logowania |
| Nieważna sesja | 401 | "Unauthorized" | Przekierowanie do logowania |
| Nieprawidłowy JSON | 400 | "Invalid JSON body" | Poprawienie formatu |
| Brak wymaganego pola | 400 | "Validation failed" + details | Uzupełnienie pola |
| Nieprawidłowy enum | 400 | "Validation failed" + details | Poprawienie wartości |
| Krótki opis | 400 | "Validation failed" + details | Rozszerzenie opisu |
| Sprzęt nie istnieje | 404 | "Equipment not found" | Sprawdzenie ID |
| Błąd bazy danych | 500 | "Internal server error" | Logowanie, retry |

### Implementacja obsługi błędów

```typescript
export const POST: APIRoute = async ({ params, locals, request }) => {
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
  const validationResult = createServiceEntrySchema.safeParse(body);
  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        details: validationResult.error.flatten().fieldErrors
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 5. Tworzenie wpisu serwisowego
  try {
    const serviceEntryService = createServiceEntryService(supabase);
    const result = await serviceEntryService.createServiceEntry(
      idValidation.data,
      validationResult.data,
      user.id
    );

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error creating service entry:", error);

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
2. **INSERT do service_entries** - główna operacja

### Strategie optymalizacji

1. **Sprawdzenie sprzętu:**
   - Proste zapytanie SELECT z id tylko
   - Szybkie dzięki PRIMARY KEY

2. **Indeksy bazodanowe:**
   - `service_entries.equipment_id` - indeks FK
   - `equipment.id` - PRIMARY KEY

3. **Transakcyjność:**
   - Insert jest atomowy
   - Rollback w przypadku błędu

4. **Domyślne wartości:**
   - `service_timestamp` domyślnie NOW() (baza danych)
   - Minimalizacja przetwarzania po stronie aplikacji

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie schematu walidacji service-entry

**Plik:** `src/lib/schemas/service-entry.schema.ts` (rozszerzenie)

```typescript
import { z } from "zod";

/**
 * Service type enum for validation
 */
export const serviceTypeEnum = z.enum(["inspection", "repair", "maintenance"]);

/**
 * Service entry list query parameters schema
 */
export const serviceEntryListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type ServiceEntryListParams = z.infer<typeof serviceEntryListParamsSchema>;

/**
 * Schema for creating service entry (POST /api/equipment/{id}/service-entries)
 */
export const createServiceEntrySchema = z.object({
  service_timestamp: z
    .string()
    .datetime({ message: "Invalid datetime format (expected ISO 8601)" })
    .optional(),
  service_type: serviceTypeEnum,
  description: z
    .string()
    .min(5, "Description must be at least 5 characters"),
});

export type CreateServiceEntryInput = z.infer<typeof createServiceEntrySchema>;
```

### Krok 2: Rozszerzenie ServiceEntryService

**Plik:** `src/lib/services/service-entry.service.ts` (dodanie metody)

```typescript
/**
 * Creates a new service entry for equipment.
 * performer_id is automatically set to the current user.
 * @throws Error if equipment not found
 */
async createServiceEntry(
  equipmentId: string,
  command: CreateServiceEntryCommand,
  userId: string
): Promise<ServiceEntryResponseDTO> {
  // 1. Check if equipment exists
  const { data: equipment, error: equipmentError } = await this.supabase
    .from("equipment")
    .select("id")
    .eq("id", equipmentId)
    .single();

  if (equipmentError || !equipment) {
    throw new Error("Equipment not found");
  }

  // 2. Insert service entry
  const { data, error } = await this.supabase
    .from("service_entries")
    .insert({
      equipment_id: equipmentId,
      service_timestamp: command.service_timestamp ?? new Date().toISOString(),
      service_type: command.service_type,
      description: command.description,
      performer_id: userId,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create service entry: ${error.message}`);
  }

  return data as ServiceEntryResponseDTO;
}
```

### Krok 3: Dodanie POST handlera do API Route

**Plik:** `src/pages/api/equipment/[id]/service-entries.ts` (rozszerzenie)

```typescript
import type { APIRoute } from "astro";
import type { ErrorResponse, ServiceEntryResponseDTO } from "../../../../types";
import { equipmentIdSchema } from "../../../../lib/schemas/equipment.schema";
import { 
  serviceEntryListParamsSchema,
  createServiceEntrySchema 
} from "../../../../lib/schemas/service-entry.schema";
import { createServiceEntryService } from "../../../../lib/services/service-entry.service";

export const prerender = false;

// ... existing GET handler ...

/**
 * POST /api/equipment/{equipmentId}/service-entries
 *
 * Creates a new service entry for equipment.
 * performer_id is automatically set to the current user.
 * Accessible by all authenticated users.
 */
export const POST: APIRoute = async ({ params, locals, request }) => {
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
  const validationResult = createServiceEntrySchema.safeParse(body);
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

  // 5. Create service entry
  try {
    const serviceEntryService = createServiceEntryService(supabase);
    const result = await serviceEntryService.createServiceEntry(
      idValidation.data,
      validationResult.data,
      user.id
    );

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating service entry:", error);

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
   curl -X POST "http://localhost:4321/api/equipment/550e8400-e29b-41d4-a716-446655440000/service-entries" \
     -H "Content-Type: application/json" \
     -d '{"service_type": "maintenance", "description": "Test"}'
   # Oczekiwany: 401 Unauthorized
   ```

2. **Test z nieprawidłowym UUID:**
   ```bash
   curl -X POST "http://localhost:4321/api/equipment/invalid-uuid/service-entries" \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=..." \
     -d '{"service_type": "maintenance", "description": "Test description"}'
   # Oczekiwany: 400 Invalid equipment ID format
   ```

3. **Test z nieistniejącym sprzętem:**
   ```bash
   curl -X POST "http://localhost:4321/api/equipment/550e8400-e29b-41d4-a716-000000000000/service-entries" \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=..." \
     -d '{"service_type": "maintenance", "description": "Test description"}'
   # Oczekiwany: 404 Equipment not found
   ```

4. **Test z pełnymi danymi:**
   ```bash
   curl -X POST "http://localhost:4321/api/equipment/550e8400-e29b-41d4-a716-446655440000/service-entries" \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=..." \
     -d '{
       "service_timestamp": "2024-01-15T14:30:00Z",
       "service_type": "maintenance",
       "description": "Czyszczenie wentylatorów i wymiana pasty"
     }'
   # Oczekiwany: 201 Created z performer_id = user.id
   ```

5. **Test bez service_timestamp (domyślnie NOW()):**
   ```bash
   curl -X POST "http://localhost:4321/api/equipment/550e8400-e29b-41d4-a716-446655440000/service-entries" \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=..." \
     -d '{
       "service_type": "inspection",
       "description": "Przegląd okresowy sprzętu"
     }'
   # Oczekiwany: 201 Created z service_timestamp = NOW()
   ```

6. **Test z krótkim opisem:**
   ```bash
   curl -X POST "http://localhost:4321/api/equipment/550e8400-e29b-41d4-a716-446655440000/service-entries" \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=..." \
     -d '{"service_type": "repair", "description": "Fix"}'
   # Oczekiwany: 400 Validation failed (description min 5 chars)
   ```

7. **Test z nieprawidłowym service_type:**
   ```bash
   curl -X POST "http://localhost:4321/api/equipment/550e8400-e29b-41d4-a716-446655440000/service-entries" \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=..." \
     -d '{"service_type": "invalid", "description": "Test description"}'
   # Oczekiwany: 400 Validation failed (invalid enum)
   ```

## 10. Checklist przed wdrożeniem

- [ ] Rozszerzono `src/lib/schemas/service-entry.schema.ts` o createServiceEntrySchema i serviceTypeEnum
- [ ] Dodano metodę createServiceEntry do `src/lib/services/service-entry.service.ts`
- [ ] Dodano POST handler do `src/pages/api/equipment/[id]/service-entries.ts`
- [ ] Przeprowadzono testy manualne wszystkich scenariuszy
- [ ] Sprawdzono czy linter nie zgłasza błędów
- [ ] Zweryfikowano automatyczne ustawianie performer_id na user.id
- [ ] Zweryfikowano domyślne ustawianie service_timestamp na NOW()
- [ ] Zweryfikowano walidację minimum 5 znaków dla description
- [ ] Zweryfikowano obsługę nieistniejącego sprzętu (404)
