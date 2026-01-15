# API Endpoint Implementation Plan: PATCH /api/equipment/{id}

## 1. Przegląd punktu końcowego

Endpoint `PATCH /api/equipment/{id}` służy do aktualizacji istniejącego sprzętu. Pole `equipment_id` nie może być modyfikowane. Dostępny dla wszystkich uwierzytelnionych użytkowników (owner i worker).

**Cel biznesowy:** Umożliwienie użytkownikom modyfikacji danych sprzętu bez zmiany jego unikalnego identyfikatora systemowego.

## 2. Szczegóły żądania

- **Metoda HTTP:** PATCH
- **Struktura URL:** `/api/equipment/{id}`
- **Lokalizacja pliku:** `src/pages/api/equipment/[id]/index.ts`

### Parametry ścieżki

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `id` | uuid | Tak | UUID sprzętu |

### Request Body (wszystkie pola opcjonalne)

| Pole | Typ | Wymagane | Opis | Walidacja |
|------|-----|----------|------|-----------|
| `name` | string | Nie | Nazwa sprzętu | min: 1, max: 100 |
| `category` | string | Nie | Kategoria | enum: equipment_category |
| `manufacturer` | string | Nie | Producent | min: 1, max: 100 |
| `model` | string | Nie | Model | min: 1, max: 100 |
| `serial_number` | string | Nie | Numer seryjny (unikalny) | min: 1, max: 100 |
| `description` | string | Nie | Opis | nullable |
| `location` | string | Nie | Lokalizacja | max: 200, nullable |
| `purchase_date` | string | Nie | Data zakupu | ISO date format, nullable |

```json
{
  "name": "Dell OptiPlex 7090 Updated",
  "location": "Pokój 201"
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
// Command model dla aktualizacji sprzętu
type UpdateEquipmentCommand = Partial<CreateEquipmentCommand>;

// DTO odpowiedzi (z UUID zamiast UserReference)
interface EquipmentResponseDTO {
  id: string;
  equipment_id: string;
  name: string;
  category: EquipmentCategory;
  manufacturer: string;
  model: string;
  serial_number: string;
  description: string | null;
  location: string | null;
  purchase_date: string | null;
  created_at: string;
  created_by: string;   // UUID
  updated_at: string;
  updated_by: string;   // UUID
}
```

### Nowe typy/schematy do utworzenia

```typescript
// Zod schema dla walidacji path parameter (src/lib/schemas/equipment.schema.ts)
import { z } from "zod";

export const equipmentIdSchema = z.string().uuid("Invalid equipment ID format");

// Zod schema dla walidacji request body (partial)
export const updateEquipmentSchema = createEquipmentSchema.partial();

export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "equipment_id": "EQ-2024-00001",
  "name": "Dell OptiPlex 7090 Updated",
  "category": "computer",
  "manufacturer": "Dell",
  "model": "OptiPlex 7090",
  "serial_number": "ABC123456",
  "description": "Komputer biurowy",
  "location": "Pokój 201",
  "purchase_date": "2024-01-15",
  "created_at": "2024-01-15T10:30:00Z",
  "created_by": "550e8400-e29b-41d4-a716-446655440001",
  "updated_at": "2024-01-16T14:20:00Z",
  "updated_by": "550e8400-e29b-41d4-a716-446655440002"
}
```

### Błędy

| Status | Opis | Przykładowa odpowiedź |
|--------|------|----------------------|
| 400 | Nieprawidłowe ID w ścieżce | `{"error": "Invalid equipment ID format"}` |
| 400 | Nieprawidłowe body lub walidacja | `{"error": "Validation failed", "details": {"name": ["Name must be at most 100 characters"]}}` |
| 400 | Nieprawidłowy JSON | `{"error": "Invalid JSON body"}` |
| 400 | Puste body | `{"error": "Request body cannot be empty"}` |
| 401 | Brak uwierzytelnienia | `{"error": "Unauthorized"}` |
| 404 | Sprzęt nie znaleziony | `{"error": "Equipment not found"}` |
| 409 | Duplikat serial_number | `{"error": "Serial number already exists"}` |
| 500 | Błąd serwera | `{"error": "Internal server error"}` |

## 5. Przepływ danych

```
┌─────────────────┐
│   Klient HTTP   │
└────────┬────────┘
         │ PATCH /api/equipment/{id}
         │ Body: { name?, category?, ... }
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Route Handler                         │
│  src/pages/api/equipment/[id]/index.ts                      │
├─────────────────────────────────────────────────────────────┤
│  1. Walidacja path parameter (UUID)                         │
│  2. Sprawdzenie autentykacji (supabase.auth.getUser())      │
│  3. Parsowanie i walidacja request body (Zod partial)       │
│  4. Sprawdzenie czy body nie jest puste                     │
│  5. Wywołanie EquipmentService.updateEquipment()            │
│  6. Formatowanie i zwrot odpowiedzi                         │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    EquipmentService                          │
│  src/lib/services/equipment.service.ts                      │
├─────────────────────────────────────────────────────────────┤
│  1. Sprawdzenie czy sprzęt istnieje                         │
│  2. UPDATE tabeli equipment z przekazanymi polami           │
│  3. Ustawienie updated_by z user.id                         │
│  4. Zwrot zaktualizowanego rekordu jako EquipmentResponseDTO│
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                                │
├─────────────────────────────────────────────────────────────┤
│  equipment                                                   │
│  - UPDATE row WHERE id = {id}                               │
│  - updated_at auto-updated by trigger                       │
│  - Unique constraint check on serial_number                 │
└─────────────────────────────────────────────────────────────┘
```

### Szczegółowy przepływ

1. **Klient** wysyła żądanie PATCH z ID w URL i opcjonalnymi danymi w body
2. **API Route** waliduje UUID z parametru ścieżki
3. **API Route** sprawdza sesję użytkownika przez `supabase.auth.getUser()`
4. **API Route** parsuje JSON body i waliduje przez Zod schema (partial)
5. **API Route** sprawdza czy body zawiera przynajmniej jedno pole
6. **EquipmentService** sprawdza czy sprzęt istnieje
7. **EquipmentService** wykonuje UPDATE z:
   - Danymi z request body
   - `updated_by` ustawionym na `user.id`
8. **Baza danych** automatycznie aktualizuje `updated_at` przez trigger
9. **EquipmentService** zwraca zaktualizowany rekord jako `EquipmentResponseDTO`
10. **API Route** zwraca odpowiedź ze statusem 200 OK

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
- Walidacja enum dla category (jeśli podane)
- Walidacja formatu daty (YYYY-MM-DD) (jeśli podane)
- Ograniczenia długości dla pól tekstowych
- Walidacja unikalności serial_number (na poziomie bazy - UNIQUE constraint)
- Sprawdzenie że body nie jest puste

### Niemodyfikowalne pola

- `equipment_id` - nie może być zmienione przez użytkownika
- `id` - nie może być zmienione
- `created_at`, `created_by` - dane audytowe z momentu tworzenia
- `updated_at` - zarządzane automatycznie przez trigger

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
| Puste body | 400 | "Request body cannot be empty" | Dodanie pól do aktualizacji |
| Nieprawidłowy enum | 400 | "Validation failed" + details | Poprawienie wartości |
| Nieprawidłowy format daty | 400 | "Validation failed" + details | Poprawienie formatu |
| Sprzęt nie istnieje | 404 | "Equipment not found" | Sprawdzenie ID |
| Duplikat serial_number | 409 | "Serial number already exists" | Zmiana serial_number |
| Błąd bazy danych | 500 | "Internal server error" | Logowanie, retry |

### Implementacja obsługi błędów

```typescript
export const PATCH: APIRoute = async ({ params, locals, request }) => {
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
  const validationResult = updateEquipmentSchema.safeParse(body);
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

  // 6. Aktualizacja sprzętu
  try {
    const equipmentService = createEquipmentService(supabase);
    const result = await equipmentService.updateEquipment(
      idValidation.data,
      validationResult.data,
      user.id
    );
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error updating equipment:", error);

    if (error instanceof Error) {
      if (error.message === "Equipment not found") {
        return new Response(
          JSON.stringify({ error: "Equipment not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      if (error.message.includes("serial_number")) {
        return new Response(
          JSON.stringify({ error: "Serial number already exists" }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }
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
2. **Sprawdzenie unikalności serial_number** - indeks UNIQUE

### Strategie optymalizacji

1. **Połączenie operacji:**
   - Można połączyć sprawdzenie istnienia z UPDATE (UPDATE zwróci 0 wierszy jeśli nie istnieje)
   - Użycie `.single()` wymusza zwrot jednego rekordu lub błąd

2. **Indeksy bazodanowe:**
   - `equipment.id` - PRIMARY KEY (indeks automatyczny)
   - `equipment.serial_number` - UNIQUE constraint zapewnia indeks

3. **Minimalne aktualizacje:**
   - Tylko przekazane pola są aktualizowane
   - Trigger `updated_at` działa automatycznie

4. **Transakcyjność:**
   - Update jest atomowy
   - Rollback w przypadku błędu

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie schematu walidacji equipment

**Plik:** `src/lib/schemas/equipment.schema.ts` (rozszerzenie)

```typescript
import { z } from "zod";

export const equipmentIdSchema = z.string().uuid("Invalid equipment ID format");

// Update schema - partial version of create schema
export const updateEquipmentSchema = createEquipmentSchema.partial();

export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
```

### Krok 2: Rozszerzenie EquipmentService

**Plik:** `src/lib/services/equipment.service.ts` (dodanie metody)

```typescript
/**
 * Updates existing equipment.
 * @throws Error if equipment not found or serial_number conflict
 */
async updateEquipment(
  id: string,
  command: UpdateEquipmentCommand,
  userId: string
): Promise<EquipmentResponseDTO> {
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
    .from("equipment")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    // Check for unique constraint violation on serial_number
    if (error.code === "23505" && error.message.includes("serial_number")) {
      throw new Error("serial_number already exists");
    }
    // Check if no rows were updated (equipment not found)
    if (error.code === "PGRST116") {
      throw new Error("Equipment not found");
    }
    throw new Error(`Failed to update equipment: ${error.message}`);
  }

  if (!data) {
    throw new Error("Equipment not found");
  }

  return data as EquipmentResponseDTO;
}
```

### Krok 3: Utworzenie API Route

**Plik:** `src/pages/api/equipment/[id]/index.ts` (nowy plik)

```typescript
import type { APIRoute } from "astro";
import type { ErrorResponse, EquipmentResponseDTO } from "../../../../types";
import { equipmentIdSchema, updateEquipmentSchema } from "../../../../lib/schemas/equipment.schema";
import { createEquipmentService } from "../../../../lib/services/equipment.service";

export const prerender = false;

/**
 * PATCH /api/equipment/{id}
 *
 * Updates existing equipment. Cannot modify equipment_id.
 * Accessible by all authenticated users.
 */
export const PATCH: APIRoute = async ({ params, locals, request }) => {
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
  const validationResult = updateEquipmentSchema.safeParse(body);
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

  // 6. Update equipment
  try {
    const equipmentService = createEquipmentService(supabase);
    const result = await equipmentService.updateEquipment(
      idValidation.data,
      validationResult.data,
      user.id
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating equipment:", error);

    if (error instanceof Error) {
      if (error.message === "Equipment not found") {
        const errorResponse: ErrorResponse = { error: "Equipment not found" };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (error.message.includes("serial_number")) {
        const errorResponse: ErrorResponse = { error: "Serial number already exists" };
        return new Response(JSON.stringify(errorResponse), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        });
      }
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
   curl -X PATCH http://localhost:4321/api/equipment/550e8400-e29b-41d4-a716-446655440000 \
     -H "Content-Type: application/json" \
     -d '{"name": "Test"}'
   # Oczekiwany: 401 Unauthorized
   ```

2. **Test z nieprawidłowym UUID:**
   ```bash
   curl -X PATCH http://localhost:4321/api/equipment/invalid-uuid \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=..." \
     -d '{"name": "Test"}'
   # Oczekiwany: 400 Invalid equipment ID format
   ```

3. **Test z nieistniejącym sprzętem:**
   ```bash
   curl -X PATCH http://localhost:4321/api/equipment/550e8400-e29b-41d4-a716-000000000000 \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=..." \
     -d '{"name": "Test"}'
   # Oczekiwany: 404 Equipment not found
   ```

4. **Test z pustym body:**
   ```bash
   curl -X PATCH http://localhost:4321/api/equipment/550e8400-e29b-41d4-a716-446655440000 \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=..." \
     -d '{}'
   # Oczekiwany: 400 Request body cannot be empty
   ```

5. **Test aktualizacji jednego pola:**
   ```bash
   curl -X PATCH http://localhost:4321/api/equipment/550e8400-e29b-41d4-a716-446655440000 \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=..." \
     -d '{"name": "Updated Name"}'
   # Oczekiwany: 200 OK z zaktualizowanym rekordem
   ```

6. **Test aktualizacji wielu pól:**
   ```bash
   curl -X PATCH http://localhost:4321/api/equipment/550e8400-e29b-41d4-a716-446655440000 \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=..." \
     -d '{
       "name": "Updated Name",
       "location": "New Location",
       "description": "New description"
     }'
   # Oczekiwany: 200 OK z zaktualizowanym rekordem
   ```

7. **Test duplikatu serial_number:**
   ```bash
   # Zakładając że istnieje inny sprzęt z serial_number "EXISTING-SN"
   curl -X PATCH http://localhost:4321/api/equipment/550e8400-e29b-41d4-a716-446655440000 \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=..." \
     -d '{"serial_number": "EXISTING-SN"}'
   # Oczekiwany: 409 Serial number already exists
   ```

## 10. Checklist przed wdrożeniem

- [ ] Dodano equipmentIdSchema do `src/lib/schemas/equipment.schema.ts`
- [ ] Dodano updateEquipmentSchema do `src/lib/schemas/equipment.schema.ts`
- [ ] Dodano metodę updateEquipment do `src/lib/services/equipment.service.ts`
- [ ] Utworzono plik `src/pages/api/equipment/[id]/index.ts` z PATCH handlerem
- [ ] Przeprowadzono testy manualne wszystkich scenariuszy
- [ ] Sprawdzono czy linter nie zgłasza błędów
- [ ] Zweryfikowano że equipment_id nie może być modyfikowany
- [ ] Zweryfikowano automatyczną aktualizację updated_at i updated_by
- [ ] Zweryfikowano obsługę duplikatu serial_number (409)
- [ ] Zweryfikowano obsługę nieistniejącego sprzętu (404)
