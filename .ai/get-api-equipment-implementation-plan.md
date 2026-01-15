# API Endpoint Implementation Plan: GET /api/equipment

## 1. Przegląd punktu końcowego

Endpoint `GET /api/equipment` służy do pobierania paginowanej listy sprzętu z możliwością sortowania i filtrowania. Dostępny dla wszystkich uwierzytelnionych użytkowników (owner i worker).

**Cel biznesowy:** Umożliwienie użytkownikom przeglądania inwentarza sprzętu z opcjami wyszukiwania i filtrowania.

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/equipment`
- **Lokalizacja pliku:** `src/pages/api/equipment/index.ts`

### Parametry

#### Query Parameters (wszystkie opcjonalne)

| Parametr | Typ | Domyślna wartość | Opis | Walidacja |
|----------|-----|------------------|------|-----------|
| `page` | integer | 1 | Numer strony (1-indexed) | min: 1 |
| `limit` | integer | 50 | Liczba elementów na stronę | min: 1, max: 100 |
| `sort` | string | created_at | Pole sortowania | enum: created_at, name, equipment_id, category, manufacturer |
| `order` | string | desc | Kierunek sortowania | enum: asc, desc |
| `category` | string | - | Filtr kategorii | enum: equipment_category |
| `search` | string | - | Wyszukiwanie po equipment_id | exact match |

### Request Body

Brak - endpoint GET nie przyjmuje body.

### Nagłówki

| Nagłówek | Wymagany | Opis |
|----------|----------|------|
| `Cookie` | Tak | Sesja uwierzytelniania Supabase |

## 3. Wykorzystywane typy

### Istniejące typy z `src/types.ts`

```typescript
// DTO dla elementu listy sprzętu
interface EquipmentListItemDTO {
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
  created_by: UserReference;  // { id: string, name: string }
}

// Parametry zapytania
interface EquipmentListParams extends PaginationParams {
  sort?: "created_at" | "name" | "equipment_id" | "category" | "manufacturer";
  order?: "asc" | "desc";
  category?: EquipmentCategory;
  search?: string;
}

// Paginowana odpowiedź
type EquipmentListResponse = PaginatedResponse<EquipmentListItemDTO>;
```

### Nowe typy/schematy do utworzenia

```typescript
// Zod schema dla walidacji query parameters (src/lib/schemas/equipment.schema.ts)
import { z } from "zod";

const equipmentCategoryEnum = z.enum([
  "computer", "printer", "monitor", "network_device",
  "phone", "tablet", "peripheral", "other"
]);

export const equipmentListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  sort: z.enum(["created_at", "name", "equipment_id", "category", "manufacturer"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
  category: equipmentCategoryEnum.optional(),
  search: z.string().optional()
});

export type EquipmentListParamsInput = z.infer<typeof equipmentListParamsSchema>;
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
{
  "data": [
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
      "created_by": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Jan Kowalski"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

### Błędy

| Status | Opis | Przykładowa odpowiedź |
|--------|------|----------------------|
| 400 | Nieprawidłowe parametry zapytania | `{"error": "Validation failed", "details": {"category": ["Invalid enum value"]}}` |
| 401 | Brak uwierzytelnienia | `{"error": "Unauthorized"}` |
| 500 | Błąd serwera | `{"error": "Internal server error"}` |

## 5. Przepływ danych

```
┌─────────────────┐
│   Klient HTTP   │
└────────┬────────┘
         │ GET /api/equipment?page=1&limit=50&category=computer
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Route Handler                         │
│  src/pages/api/equipment/index.ts                           │
├─────────────────────────────────────────────────────────────┤
│  1. Parsowanie i walidacja query params (Zod)               │
│  2. Sprawdzenie autentykacji (supabase.auth.getUser())      │
│  3. Wywołanie EquipmentService.listEquipment()              │
│  4. Formatowanie i zwrot odpowiedzi                         │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    EquipmentService                          │
│  src/lib/services/equipment.service.ts                      │
├─────────────────────────────────────────────────────────────┤
│  1. Budowanie zapytania z paginacją i filtrami              │
│  2. Pobranie equipment z joined profiles (created_by)       │
│  3. Mapowanie na DTO z UserReference                        │
│  4. Zwrot paginowanej odpowiedzi                            │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                                │
├──────────────────────┬──────────────────────────────────────┤
│  equipment           │  profiles (via created_by join)      │
│  - id               │  - id                                 │
│  - equipment_id     │  - name                               │
│  - name, category...│                                       │
│  - created_by FK    │                                       │
└──────────────────────┴──────────────────────────────────────┘
```

### Szczegółowy przepływ

1. **Klient** wysyła żądanie GET z opcjonalnymi parametrami
2. **API Route** waliduje parametry za pomocą Zod schema
3. **API Route** sprawdza sesję użytkownika przez `supabase.auth.getUser()`
4. **EquipmentService** buduje zapytanie do Supabase z:
   - Paginacją (offset, limit)
   - Sortowaniem (pole, kierunek)
   - Filtrowaniem (category, search)
   - Join na profiles dla created_by
5. **EquipmentService** mapuje wyniki na `EquipmentListItemDTO[]`
6. **API Route** zwraca odpowiedź w formacie `EquipmentListResponse`

## 6. Względy bezpieczeństwa

### Uwierzytelnienie

- Weryfikacja sesji przez `supabase.auth.getUser()` na początku handlera
- Odrzucenie żądania z kodem 401 jeśli brak ważnej sesji

### Autoryzacja

- Endpoint dostępny dla wszystkich uwierzytelnionych użytkowników (owner i worker)
- RLS policies na tabeli `equipment` zapewniają, że użytkownik widzi tylko dozwolone rekordy

### Walidacja danych wejściowych

- Wszystkie query params walidowane przez Zod przed użyciem
- Użycie `z.coerce` dla konwersji stringów na liczby
- Walidacja enum dla category, sort, order
- Ograniczenie `limit` do maksymalnie 100

### Ochrona przed wyciekiem danych

- Zwracanie tylko niezbędnych pól
- created_by zwracany jako UserReference (id, name) - bez wrażliwych danych

## 7. Obsługa błędów

### Scenariusze błędów

| Scenariusz | Kod HTTP | Komunikat | Akcja |
|------------|----------|-----------|-------|
| Brak tokena sesji | 401 | "Unauthorized" | Przekierowanie do logowania |
| Nieważna sesja | 401 | "Unauthorized" | Przekierowanie do logowania |
| Nieprawidłowy `page` | 400 | "Validation failed" + details | Poprawienie parametru |
| Nieprawidłowy `limit` | 400 | "Validation failed" + details | Poprawienie parametru |
| Nieprawidłowy `category` | 400 | "Validation failed" + details | Poprawienie parametru |
| Nieprawidłowy `sort` | 400 | "Validation failed" + details | Poprawienie parametru |
| Błąd bazy danych | 500 | "Internal server error" | Logowanie błędu, retry |

### Implementacja obsługi błędów

```typescript
// Wzorzec early return dla czystego kodu
export const GET: APIRoute = async ({ locals, request }) => {
  const supabase = locals.supabase;

  // 1. Parsowanie i walidacja query params
  const url = new URL(request.url);
  const queryParams = Object.fromEntries(url.searchParams);
  
  const validationResult = equipmentListParamsSchema.safeParse(queryParams);
  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        details: validationResult.error.flatten().fieldErrors
      }),
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

  // 3. Pobranie listy sprzętu (happy path)
  try {
    const equipmentService = createEquipmentService(supabase);
    const result = await equipmentService.listEquipment(validationResult.data);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching equipment:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
```

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

1. **Join na profiles** - dodatkowy koszt przy każdym zapytaniu
2. **Duża liczba rekordów** - bez paginacji mogłoby przeciążyć system
3. **Brak indeksów** - wolne sortowanie i filtrowanie

### Strategie optymalizacji

1. **Wykorzystanie indeksów bazodanowych:**
   - `equipment.created_at` - dla domyślnego sortowania
   - `equipment.category` - dla filtrowania
   - `equipment.equipment_id` - dla wyszukiwania (już UNIQUE)
   - `equipment.name` - dla sortowania

2. **Paginacja po stronie bazy:**
   ```typescript
   const offset = (page - 1) * limit;
   const { data, count } = await supabase
     .from('equipment')
     .select(`
       *,
       created_by_profile:profiles!equipment_created_by_fkey(id, name)
     `, { count: 'exact' })
     .order(sort, { ascending: order === 'asc' })
     .range(offset, offset + limit - 1);
   ```

3. **Selektywne pobieranie kolumn:**
   - Nie pobieramy updated_at, updated_by dla listy
   - Zmniejsza transfer danych

### Limity

- Maksymalny `limit`: 100 rekordów na stronę
- Timeout zapytania: standardowy timeout Supabase

## 9. Etapy wdrożenia

### Krok 1: Utworzenie schematu walidacji equipment

**Plik:** `src/lib/schemas/equipment.schema.ts`

```typescript
/**
 * Equipment Schemas
 *
 * Zod schemas for validating equipment-related request data.
 */
import { z } from "zod";

/**
 * Equipment category enum matching database enum
 */
export const equipmentCategoryEnum = z.enum([
  "computer",
  "printer",
  "monitor",
  "network_device",
  "phone",
  "tablet",
  "peripheral",
  "other",
]);

/**
 * Schema for equipment list query parameters (GET /api/equipment)
 */
export const equipmentListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  sort: z
    .enum(["created_at", "name", "equipment_id", "category", "manufacturer"])
    .default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
  category: equipmentCategoryEnum.optional(),
  search: z.string().optional(),
});

export type EquipmentListParamsInput = z.infer<typeof equipmentListParamsSchema>;

/**
 * Schema for validating equipment UUID path parameter.
 */
export const equipmentIdSchema = z.object({
  id: z.string().uuid("Invalid equipment ID format"),
});

export type EquipmentIdInput = z.infer<typeof equipmentIdSchema>;
```

### Krok 2: Utworzenie EquipmentService

**Plik:** `src/lib/services/equipment.service.ts`

```typescript
/**
 * Equipment Service
 *
 * Service layer for equipment-related operations.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type {
  EquipmentListItemDTO,
  EquipmentListResponse,
  EquipmentListParams,
  UserReference,
} from "../../types";

export class EquipmentService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Fetches a paginated list of equipment with sorting and filtering.
   */
  async listEquipment(params: EquipmentListParams): Promise<EquipmentListResponse> {
    const {
      page = 1,
      limit = 50,
      sort = "created_at",
      order = "desc",
      category,
      search,
    } = params;

    const offset = (page - 1) * limit;

    // Build query
    let query = this.supabase
      .from("equipment")
      .select(
        `
        id,
        equipment_id,
        name,
        category,
        manufacturer,
        model,
        serial_number,
        description,
        location,
        purchase_date,
        created_at,
        created_by_profile:profiles!equipment_created_by_fkey(id, name)
      `,
        { count: "exact" }
      );

    // Apply filters
    if (category) {
      query = query.eq("category", category);
    }

    if (search) {
      query = query.eq("equipment_id", search);
    }

    // Apply sorting and pagination
    query = query
      .order(sort, { ascending: order === "asc" })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch equipment: ${error.message}`);
    }

    // Map to DTOs
    const equipmentList: EquipmentListItemDTO[] = (data || []).map((item) => ({
      id: item.id,
      equipment_id: item.equipment_id,
      name: item.name,
      category: item.category,
      manufacturer: item.manufacturer,
      model: item.model,
      serial_number: item.serial_number,
      description: item.description,
      location: item.location,
      purchase_date: item.purchase_date,
      created_at: item.created_at,
      created_by: item.created_by_profile as UserReference,
    }));

    const total = count || 0;

    return {
      data: equipmentList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export function createEquipmentService(
  supabase: SupabaseClient<Database>
): EquipmentService {
  return new EquipmentService(supabase);
}
```

### Krok 3: Implementacja API Route

**Plik:** `src/pages/api/equipment/index.ts`

```typescript
/**
 * API Endpoints: /api/equipment
 *
 * GET /api/equipment - Returns a paginated list of equipment
 */
import type { APIRoute } from "astro";

import { equipmentListParamsSchema } from "../../../lib/schemas/equipment.schema";
import { createEquipmentService } from "../../../lib/services/equipment.service";
import type { ErrorResponse } from "../../../types";

export const prerender = false;

/**
 * GET /api/equipment
 *
 * Returns a paginated list of equipment with sorting and filtering options.
 * Accessible by all authenticated users.
 */
export const GET: APIRoute = async ({ locals, request }) => {
  const supabase = locals.supabase;

  // 1. Parse query parameters
  const url = new URL(request.url);
  const queryParams = {
    page: url.searchParams.get("page"),
    limit: url.searchParams.get("limit"),
    sort: url.searchParams.get("sort"),
    order: url.searchParams.get("order"),
    category: url.searchParams.get("category"),
    search: url.searchParams.get("search"),
  };

  // 2. Validate parameters
  const validationResult = equipmentListParamsSchema.safeParse(queryParams);
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

  // 3. Check authentication
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

  // 4. Fetch equipment list
  try {
    const equipmentService = createEquipmentService(supabase);
    const result = await equipmentService.listEquipment(validationResult.data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching equipment:", error);
    const errorResponse: ErrorResponse = { error: "Internal server error" };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

### Krok 4: Utworzenie struktury katalogów

```
src/
├── lib/
│   ├── schemas/
│   │   ├── pagination.schema.ts    # Istniejący
│   │   └── equipment.schema.ts     # Nowy
│   └── services/
│       ├── user.service.ts         # Istniejący
│       └── equipment.service.ts    # Nowy
└── pages/
    └── api/
        └── equipment/
            └── index.ts            # Nowy
```

### Krok 5: Testy manualne

1. **Test bez autentykacji:**
   ```bash
   curl -X GET http://localhost:4321/api/equipment
   # Oczekiwany: 401 Unauthorized
   ```

2. **Test z autentykacją:**
   ```bash
   curl -X GET http://localhost:4321/api/equipment \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 200 OK z listą sprzętu
   ```

3. **Test paginacji:**
   ```bash
   curl -X GET "http://localhost:4321/api/equipment?page=1&limit=10" \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 200 OK z max 10 elementów
   ```

4. **Test sortowania:**
   ```bash
   curl -X GET "http://localhost:4321/api/equipment?sort=name&order=asc" \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 200 OK posortowane po nazwie rosnąco
   ```

5. **Test filtrowania:**
   ```bash
   curl -X GET "http://localhost:4321/api/equipment?category=computer" \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 200 OK tylko komputery
   ```

6. **Test wyszukiwania:**
   ```bash
   curl -X GET "http://localhost:4321/api/equipment?search=EQ-2024-00001" \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 200 OK z dopasowanym sprzętem
   ```

7. **Test nieprawidłowych parametrów:**
   ```bash
   curl -X GET "http://localhost:4321/api/equipment?category=invalid" \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 400 Bad Request
   ```

## 10. Checklist przed wdrożeniem

- [ ] Utworzono `src/lib/schemas/equipment.schema.ts`
- [ ] Utworzono `src/lib/services/equipment.service.ts`
- [ ] Utworzono `src/pages/api/equipment/index.ts`
- [ ] Zweryfikowano typy w `src/types.ts`
- [ ] Przeprowadzono testy manualne wszystkich scenariuszy
- [ ] Sprawdzono czy linter nie zgłasza błędów
- [ ] Zweryfikowano działanie z rzeczywistą bazą Supabase
- [ ] Sprawdzono poprawność join na profiles
