# API Endpoint Implementation Plan: POST /api/equipment

## 1. Przegląd punktu końcowego

Endpoint `POST /api/equipment` służy do tworzenia nowego sprzętu w systemie. Pole `equipment_id` jest generowane automatycznie przez trigger bazodanowy w formacie `EQ-YYYY-NNNNN`. Dostępny dla wszystkich uwierzytelnionych użytkowników (owner i worker).

**Cel biznesowy:** Umożliwienie użytkownikom dodawania nowego sprzętu do inwentarza z automatycznym generowaniem unikalnego identyfikatora.

## 2. Szczegóły żądania

- **Metoda HTTP:** POST
- **Struktura URL:** `/api/equipment`
- **Lokalizacja pliku:** `src/pages/api/equipment/index.ts`

### Parametry

Brak parametrów URL - dane przekazywane w body.

### Request Body

| Pole | Typ | Wymagane | Opis | Walidacja |
|------|-----|----------|------|-----------|
| `name` | string | Tak | Nazwa sprzętu | min: 1, max: 100 |
| `category` | string | Tak | Kategoria | enum: equipment_category |
| `manufacturer` | string | Tak | Producent | min: 1, max: 100 |
| `model` | string | Tak | Model | min: 1, max: 100 |
| `serial_number` | string | Tak | Numer seryjny (unikalny) | min: 1, max: 100 |
| `description` | string | Nie | Opis | nullable |
| `location` | string | Nie | Lokalizacja | max: 200, nullable |
| `purchase_date` | string | Nie | Data zakupu | ISO date format, nullable |

```json
{
  "name": "Dell OptiPlex 7090",
  "category": "computer",
  "manufacturer": "Dell",
  "model": "OptiPlex 7090",
  "serial_number": "ABC123456",
  "description": "Komputer biurowy",
  "location": "Pokój 101",
  "purchase_date": "2024-01-15"
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
// Command model dla tworzenia sprzętu
interface CreateEquipmentCommand {
  name: string;
  category: EquipmentCategory;
  manufacturer: string;
  model: string;
  serial_number: string;
  description?: string | null;
  location?: string | null;
  purchase_date?: string | null;
}

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
// Zod schema dla walidacji request body (src/lib/schemas/equipment.schema.ts)
import { z } from "zod";

export const equipmentCategoryEnum = z.enum([
  "computer", "printer", "monitor", "network_device",
  "phone", "tablet", "peripheral", "other"
]);

export const createEquipmentSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  category: equipmentCategoryEnum,
  manufacturer: z
    .string()
    .min(1, "Manufacturer is required")
    .max(100, "Manufacturer must be at most 100 characters"),
  model: z
    .string()
    .min(1, "Model is required")
    .max(100, "Model must be at most 100 characters"),
  serial_number: z
    .string()
    .min(1, "Serial number is required")
    .max(100, "Serial number must be at most 100 characters"),
  description: z.string().nullable().optional(),
  location: z
    .string()
    .max(200, "Location must be at most 200 characters")
    .nullable()
    .optional(),
  purchase_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (expected YYYY-MM-DD)")
    .nullable()
    .optional()
});

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
```

## 4. Szczegóły odpowiedzi

### Sukces (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "equipment_id": "EQ-2024-00001",
  "name": "Dell OptiPlex 7090",
  "category": "computer",
  "manufacturer": "Dell",
  "model": "OptiPlex 7090",
  "serial_number": "ABC123456",
  "description": "Komputer biurowy",
  "location": "Pokój 101",
  "purchase_date": "2024-01-15",
  "created_at": "2024-01-15T10:30:00Z",
  "created_by": "550e8400-e29b-41d4-a716-446655440001",
  "updated_at": "2024-01-15T10:30:00Z",
  "updated_by": "550e8400-e29b-41d4-a716-446655440001"
}
```

### Błędy

| Status | Opis | Przykładowa odpowiedź |
|--------|------|----------------------|
| 400 | Nieprawidłowe body lub walidacja | `{"error": "Validation failed", "details": {"name": ["Name is required"]}}` |
| 400 | Nieprawidłowy JSON | `{"error": "Invalid JSON body"}` |
| 401 | Brak uwierzytelnienia | `{"error": "Unauthorized"}` |
| 409 | Duplikat serial_number | `{"error": "Serial number already exists"}` |
| 500 | Błąd serwera | `{"error": "Internal server error"}` |

## 5. Przepływ danych

```
┌─────────────────┐
│   Klient HTTP   │
└────────┬────────┘
         │ POST /api/equipment
         │ Body: { name, category, ... }
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Route Handler                         │
│  src/pages/api/equipment/index.ts                           │
├─────────────────────────────────────────────────────────────┤
│  1. Sprawdzenie autentykacji (supabase.auth.getUser())      │
│  2. Parsowanie i walidacja request body (Zod)               │
│  3. Wywołanie EquipmentService.createEquipment()            │
│  4. Formatowanie i zwrot odpowiedzi                         │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    EquipmentService                          │
│  src/lib/services/equipment.service.ts                      │
├─────────────────────────────────────────────────────────────┤
│  1. Wywołanie supabase.rpc('generate_equipment_id')         │
│  2. Insert do tabeli equipment z wygenerowanym ID           │
│  3. Ustawienie created_by, updated_by z user.id             │
│  4. Zwrot utworzonego rekordu jako EquipmentResponseDTO     │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                                │
├──────────────────────┬──────────────────────────────────────┤
│  equipment           │  equipment_counter                   │
│  - INSERT new row   │  - INCREMENT counter via function    │
│  - equipment_id     │    generate_equipment_id()           │
│    from function    │                                       │
└──────────────────────┴──────────────────────────────────────┘
```

### Szczegółowy przepływ

1. **Klient** wysyła żądanie POST z danymi sprzętu w body
2. **API Route** sprawdza sesję użytkownika przez `supabase.auth.getUser()`
3. **API Route** parsuje JSON body i waliduje przez Zod schema
4. **EquipmentService** generuje `equipment_id` przez funkcję bazodanową `generate_equipment_id()`
5. **EquipmentService** wykonuje INSERT z:
   - Wygenerowanym `equipment_id`
   - Danymi z request body
   - `created_by` i `updated_by` ustawionym na `user.id`
6. **EquipmentService** zwraca utworzony rekord jako `EquipmentResponseDTO`
7. **API Route** zwraca odpowiedź ze statusem 201 Created

## 6. Względy bezpieczeństwa

### Uwierzytelnienie

- Weryfikacja sesji przez `supabase.auth.getUser()` przed przetwarzaniem body
- Odrzucenie żądania z kodem 401 jeśli brak ważnej sesji

### Autoryzacja

- Endpoint dostępny dla wszystkich uwierzytelnionych użytkowników (owner i worker)
- RLS policies zapewniają dodatkową warstwę ochrony

### Walidacja danych wejściowych

- Walidacja JSON body przez Zod schema
- Walidacja enum dla category
- Walidacja formatu daty (YYYY-MM-DD)
- Ograniczenia długości dla wszystkich pól tekstowych
- Walidacja unikalności serial_number (na poziomie bazy - UNIQUE constraint)

### Automatyczne pola

- `equipment_id` - generowany automatycznie, nie może być ustawiony przez użytkownika
- `created_by`, `updated_by` - ustawiane automatycznie z sesji użytkownika
- `created_at`, `updated_at` - ustawiane automatycznie przez bazę

### Ochrona przed SQL Injection

- Użycie parametryzowanych zapytań Supabase
- Brak bezpośredniego wstawiania danych użytkownika do zapytań

## 7. Obsługa błędów

### Scenariusze błędów

| Scenariusz | Kod HTTP | Komunikat | Akcja |
|------------|----------|-----------|-------|
| Brak tokena sesji | 401 | "Unauthorized" | Przekierowanie do logowania |
| Nieważna sesja | 401 | "Unauthorized" | Przekierowanie do logowania |
| Nieprawidłowy JSON | 400 | "Invalid JSON body" | Poprawienie formatu |
| Brak wymaganego pola | 400 | "Validation failed" + details | Uzupełnienie pola |
| Nieprawidłowy enum | 400 | "Validation failed" + details | Poprawienie wartości |
| Nieprawidłowy format daty | 400 | "Validation failed" + details | Poprawienie formatu |
| Duplikat serial_number | 409 | "Serial number already exists" | Zmiana serial_number |
| Błąd generowania ID | 500 | "Internal server error" | Logowanie, retry |
| Błąd bazy danych | 500 | "Internal server error" | Logowanie, retry |

### Implementacja obsługi błędów

```typescript
export const POST: APIRoute = async ({ locals, request }) => {
  const supabase = locals.supabase;

  // 1. Sprawdzenie autentykacji
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // 2. Parsowanie JSON body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 3. Walidacja body
  const validationResult = createEquipmentSchema.safeParse(body);
  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        details: validationResult.error.flatten().fieldErrors
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 4. Tworzenie sprzętu (happy path)
  try {
    const equipmentService = createEquipmentService(supabase);
    const result = await equipmentService.createEquipment(validationResult.data, user.id);
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error creating equipment:", error);

    // Handle duplicate serial number
    if (error instanceof Error && error.message.includes("serial_number")) {
      return new Response(
        JSON.stringify({ error: "Serial number already exists" }),
        { status: 409, headers: { "Content-Type": "application/json" } }
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

1. **Generowanie equipment_id** - atomowa operacja na equipment_counter
2. **Sprawdzenie unikalności serial_number** - indeks UNIQUE

### Strategie optymalizacji

1. **Funkcja generate_equipment_id:**
   - Używa SECURITY DEFINER dla dostępu do ukrytej tabeli
   - Atomowa inkrementacja w jednej transakcji
   - Minimalne opóźnienie

2. **Indeksy bazodanowe:**
   - `equipment.serial_number` - UNIQUE constraint zapewnia indeks
   - Szybkie sprawdzenie duplikatu

3. **Transakcyjność:**
   - Insert jest atomowy
   - Rollback w przypadku błędu

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie schematu walidacji equipment

**Plik:** `src/lib/schemas/equipment.schema.ts` (rozszerzenie)

```typescript
/**
 * Schema for creating equipment (POST /api/equipment)
 */
export const createEquipmentSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  category: equipmentCategoryEnum,
  manufacturer: z
    .string()
    .min(1, "Manufacturer is required")
    .max(100, "Manufacturer must be at most 100 characters"),
  model: z
    .string()
    .min(1, "Model is required")
    .max(100, "Model must be at most 100 characters"),
  serial_number: z
    .string()
    .min(1, "Serial number is required")
    .max(100, "Serial number must be at most 100 characters"),
  description: z.string().nullable().optional(),
  location: z
    .string()
    .max(200, "Location must be at most 200 characters")
    .nullable()
    .optional(),
  purchase_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (expected YYYY-MM-DD)")
    .nullable()
    .optional(),
});

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
```

### Krok 2: Rozszerzenie EquipmentService

**Plik:** `src/lib/services/equipment.service.ts` (dodanie metody)

```typescript
/**
 * Creates new equipment with auto-generated equipment_id.
 */
async createEquipment(
  command: CreateEquipmentCommand,
  userId: string
): Promise<EquipmentResponseDTO> {
  // 1. Generate equipment_id using database function
  const { data: equipmentId, error: idError } = await this.supabase
    .rpc("generate_equipment_id");

  if (idError || !equipmentId) {
    throw new Error(`Failed to generate equipment ID: ${idError?.message}`);
  }

  // 2. Insert equipment
  const { data, error } = await this.supabase
    .from("equipment")
    .insert({
      equipment_id: equipmentId,
      name: command.name,
      category: command.category,
      manufacturer: command.manufacturer,
      model: command.model,
      serial_number: command.serial_number,
      description: command.description ?? null,
      location: command.location ?? null,
      purchase_date: command.purchase_date ?? null,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();

  if (error) {
    // Check for unique constraint violation on serial_number
    if (error.code === "23505" && error.message.includes("serial_number")) {
      throw new Error("serial_number already exists");
    }
    throw new Error(`Failed to create equipment: ${error.message}`);
  }

  return data as EquipmentResponseDTO;
}
```

### Krok 3: Dodanie POST handlera do API Route

**Plik:** `src/pages/api/equipment/index.ts` (rozszerzenie)

```typescript
/**
 * POST /api/equipment
 *
 * Creates new equipment with auto-generated equipment_id.
 * Accessible by all authenticated users.
 */
export const POST: APIRoute = async ({ locals, request }) => {
  const supabase = locals.supabase;

  // 1. Check authentication
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

  // 2. Parse request body
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

  // 3. Validate body
  const validationResult = createEquipmentSchema.safeParse(body);
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

  // 4. Create equipment
  try {
    const equipmentService = createEquipmentService(supabase);
    const result = await equipmentService.createEquipment(
      validationResult.data,
      user.id
    );

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating equipment:", error);

    // Handle duplicate serial number
    if (error instanceof Error && error.message.includes("serial_number")) {
      const errorResponse: ErrorResponse = {
        error: "Serial number already exists",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 409,
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
   curl -X POST http://localhost:4321/api/equipment \
     -H "Content-Type: application/json" \
     -d '{"name": "Test"}'
   # Oczekiwany: 401 Unauthorized
   ```

2. **Test z autentykacją - pełne dane:**
   ```bash
   curl -X POST http://localhost:4321/api/equipment \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=..." \
     -d '{
       "name": "Dell OptiPlex 7090",
       "category": "computer",
       "manufacturer": "Dell",
       "model": "OptiPlex 7090",
       "serial_number": "ABC123456",
       "description": "Komputer biurowy",
       "location": "Pokój 101",
       "purchase_date": "2024-01-15"
     }'
   # Oczekiwany: 201 Created z equipment_id w formacie EQ-YYYY-NNNNN
   ```

3. **Test z minimalnymi danymi:**
   ```bash
   curl -X POST http://localhost:4321/api/equipment \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=..." \
     -d '{
       "name": "Test Equipment",
       "category": "other",
       "manufacturer": "Test",
       "model": "Model 1",
       "serial_number": "SN-TEST-001"
     }'
   # Oczekiwany: 201 Created
   ```

4. **Test duplikatu serial_number:**
   ```bash
   # Wykonaj powyższe żądanie dwa razy z tym samym serial_number
   # Oczekiwany: 409 Conflict
   ```

5. **Test nieprawidłowych danych:**
   ```bash
   curl -X POST http://localhost:4321/api/equipment \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=..." \
     -d '{
       "name": "",
       "category": "invalid",
       "manufacturer": "Test"
     }'
   # Oczekiwany: 400 Bad Request z details
   ```

6. **Test nieprawidłowego JSON:**
   ```bash
   curl -X POST http://localhost:4321/api/equipment \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=..." \
     -d 'not valid json'
   # Oczekiwany: 400 Bad Request "Invalid JSON body"
   ```

## 10. Checklist przed wdrożeniem

- [ ] Rozszerzono `src/lib/schemas/equipment.schema.ts` o createEquipmentSchema
- [ ] Dodano metodę createEquipment do `src/lib/services/equipment.service.ts`
- [ ] Dodano POST handler do `src/pages/api/equipment/index.ts`
- [ ] Zweryfikowano działanie funkcji generate_equipment_id() w bazie
- [ ] Przeprowadzono testy manualne wszystkich scenariuszy
- [ ] Sprawdzono czy linter nie zgłasza błędów
- [ ] Zweryfikowano generowanie equipment_id w formacie EQ-YYYY-NNNNN
- [ ] Zweryfikowano obsługę duplikatu serial_number (409)
