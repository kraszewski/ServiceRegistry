# API Endpoint Implementation Plan: GET /api/equipment/{id}

## 1. Przegląd punktu końcowego

Endpoint `GET /api/equipment/{id}` służy do pobierania szczegółowych informacji o konkretnym sprzęcie na podstawie jego UUID. Zwraca pełne dane sprzętu wraz z informacjami o twórcy i ostatnim modyfikującym jako zagnieżdżone obiekty UserReference. Dostępny dla wszystkich uwierzytelnionych użytkowników (owner i worker).

**Cel biznesowy:** Umożliwienie użytkownikom przeglądania pełnych szczegółów wybranego sprzętu z informacjami audytowymi.

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/equipment/{id}`
- **Lokalizacja pliku:** `src/pages/api/equipment/[id]/index.ts`

### Parametry

#### Path Parameters

| Parametr | Typ | Wymagany | Opis | Walidacja |
|----------|-----|----------|------|-----------|
| `id` | string | Tak | UUID sprzętu | UUID format |

### Request Body

Brak - endpoint GET nie przyjmuje body.

### Nagłówki

| Nagłówek | Wymagany | Opis |
|----------|----------|------|
| `Cookie` | Tak | Sesja uwierzytelniania Supabase |

## 3. Wykorzystywane typy

### Istniejące typy z `src/types.ts`

```typescript
// Helper type dla referencji użytkownika
interface UserReference {
  id: string;
  name: string;
}

// DTO dla szczegółów sprzętu
interface EquipmentDTO extends EquipmentListItemDTO {
  updated_at: string;
  updated_by: UserReference;  // { id: string, name: string }
}

// Gdzie EquipmentListItemDTO zawiera:
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
  created_by: UserReference;
}
```

### Wykorzystywane schematy z `src/lib/schemas/equipment.schema.ts`

```typescript
// Schema dla walidacji UUID path parameter
export const equipmentIdSchema = z.object({
  id: z.string().uuid("Invalid equipment ID format"),
});

export type EquipmentIdInput = z.infer<typeof equipmentIdSchema>;
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

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
  "created_by": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Jan Kowalski"
  },
  "updated_at": "2024-01-20T14:00:00Z",
  "updated_by": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "Anna Nowak"
  }
}
```

### Błędy

| Status | Opis | Przykładowa odpowiedź |
|--------|------|----------------------|
| 400 | Nieprawidłowy format UUID | `{"error": "Validation failed", "details": {"id": ["Invalid equipment ID format"]}}` |
| 401 | Brak uwierzytelnienia | `{"error": "Unauthorized"}` |
| 404 | Sprzęt nie znaleziony | `{"error": "Equipment not found"}` |
| 500 | Błąd serwera | `{"error": "Internal server error"}` |

## 5. Przepływ danych

```
┌─────────────────┐
│   Klient HTTP   │
└────────┬────────┘
         │ GET /api/equipment/550e8400-...
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Route Handler                         │
│  src/pages/api/equipment/[id]/index.ts                      │
├─────────────────────────────────────────────────────────────┤
│  1. Walidacja path parameter (UUID)                         │
│  2. Sprawdzenie autentykacji (supabase.auth.getUser())      │
│  3. Wywołanie EquipmentService.getEquipment()               │
│  4. Formatowanie i zwrot odpowiedzi                         │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    EquipmentService                          │
│  src/lib/services/equipment.service.ts                      │
├─────────────────────────────────────────────────────────────┤
│  1. Pobranie equipment z joined profiles (created_by,       │
│     updated_by)                                             │
│  2. Mapowanie na DTO z UserReference                        │
│  3. Zwrot EquipmentDTO lub rzucenie błędu "not found"       │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                                │
├──────────────────────┬──────────────────────────────────────┤
│  equipment           │  profiles (via joins)                │
│  - wszystkie kolumny │  - created_by_profile (id, name)     │
│                      │  - updated_by_profile (id, name)     │
└──────────────────────┴──────────────────────────────────────┘
```

### Szczegółowy przepływ

1. **Klient** wysyła żądanie GET z UUID sprzętu w ścieżce
2. **API Route** waliduje format UUID przez Zod schema
3. **API Route** sprawdza sesję użytkownika przez `supabase.auth.getUser()`
4. **EquipmentService** wykonuje zapytanie z podwójnym joinem na profiles:
   - created_by_profile dla informacji o twórcy
   - updated_by_profile dla informacji o ostatnim modyfikującym
5. **EquipmentService** mapuje wynik na `EquipmentDTO` lub rzuca błąd jeśli nie znaleziono
6. **API Route** zwraca odpowiedź ze statusem 200 OK lub odpowiedni błąd

## 6. Względy bezpieczeństwa

### Uwierzytelnienie

- Weryfikacja sesji przez `supabase.auth.getUser()` na początku handlera
- Odrzucenie żądania z kodem 401 jeśli brak ważnej sesji

### Autoryzacja

- Endpoint dostępny dla wszystkich uwierzytelnionych użytkowników (owner i worker)
- RLS policies zapewniają dodatkową warstwę ochrony na poziomie bazy

### Walidacja danych wejściowych

- Path parameter `id` musi być poprawnym UUID
- Zod schema waliduje format przed użyciem w zapytaniu

### Ochrona przed wyciekiem danych

- created_by i updated_by zwracane jako UserReference (tylko id i name)
- Brak zwracania wrażliwych danych użytkowników

## 7. Obsługa błędów

### Scenariusze błędów

| Scenariusz | Kod HTTP | Komunikat | Akcja |
|------------|----------|-----------|-------|
| Brak tokena sesji | 401 | "Unauthorized" | Przekierowanie do logowania |
| Nieważna sesja | 401 | "Unauthorized" | Przekierowanie do logowania |
| Nieprawidłowy format UUID | 400 | "Validation failed" + details | Poprawienie ID |
| Sprzęt nie istnieje | 404 | "Equipment not found" | Sprawdzenie ID |
| Błąd bazy danych | 500 | "Internal server error" | Logowanie błędu |

### Implementacja obsługi błędów

```typescript
export const GET: APIRoute = async ({ locals, params }) => {
  const supabase = locals.supabase;

  // 1. Walidacja path parameter
  const validationResult = equipmentIdSchema.safeParse({ id: params.id });
  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        details: validationResult.error.flatten().fieldErrors
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { id } = validationResult.data;

  // 2. Sprawdzenie autentykacji
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // 3. Pobranie szczegółów sprzętu (happy path)
  try {
    const equipmentService = createEquipmentService(supabase);
    const result = await equipmentService.getEquipment(id);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching equipment:", error);

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

1. **Podwójny join na profiles** - dwa joiny w jednym zapytaniu
2. **Zapytanie o pojedynczy rekord** - minimalny wpływ

### Strategie optymalizacji

1. **Wykorzystanie indeksów:**
   - `equipment.id` - PRIMARY KEY (automatyczny indeks)
   - `profiles.id` - PRIMARY KEY dla joinów

2. **Selektywne pobieranie kolumn z profiles:**
   - Tylko `id` i `name` z joined profiles
   - Minimalizacja transferu danych

3. **Jedno zapytanie z joinami:**
   ```typescript
   const { data, error } = await this.supabase
     .from("equipment")
     .select(`
       *,
       created_by_profile:profiles!equipment_created_by_fkey(id, name),
       updated_by_profile:profiles!equipment_updated_by_fkey(id, name)
     `)
     .eq("id", id)
     .single();
   ```

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie EquipmentService

**Plik:** `src/lib/services/equipment.service.ts` (dodanie metody)

```typescript
/**
 * Fetches equipment details by ID.
 *
 * @param id - Equipment UUID
 * @returns Equipment details with UserReference for created_by and updated_by
 * @throws Error with message "Equipment not found" if not exists
 */
async getEquipment(id: string): Promise<EquipmentDTO> {
  const { data, error } = await this.supabase
    .from("equipment")
    .select(`
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
      updated_at,
      created_by_profile:profiles!equipment_created_by_fkey(id, name),
      updated_by_profile:profiles!equipment_updated_by_fkey(id, name)
    `)
    .eq("id", id)
    .single();

  if (error) {
    // PGRST116 = "JSON object requested, multiple (or no) rows returned"
    if (error.code === "PGRST116") {
      throw new Error("Equipment not found");
    }
    throw new Error(`Failed to fetch equipment: ${error.message}`);
  }

  // Map to DTO
  return {
    id: data.id,
    equipment_id: data.equipment_id,
    name: data.name,
    category: data.category,
    manufacturer: data.manufacturer,
    model: data.model,
    serial_number: data.serial_number,
    description: data.description,
    location: data.location,
    purchase_date: data.purchase_date,
    created_at: data.created_at,
    created_by: data.created_by_profile as UserReference,
    updated_at: data.updated_at,
    updated_by: data.updated_by_profile as UserReference,
  };
}
```

### Krok 2: Implementacja API Route

**Plik:** `src/pages/api/equipment/[id]/index.ts`

```typescript
/**
 * API Endpoints: /api/equipment/{id}
 *
 * GET /api/equipment/{id} - Returns equipment details
 */
import type { APIRoute } from "astro";

import { equipmentIdSchema } from "../../../../lib/schemas/equipment.schema";
import { createEquipmentService } from "../../../../lib/services/equipment.service";
import type { ErrorResponse } from "../../../../types";

export const prerender = false;

/**
 * GET /api/equipment/{id}
 *
 * Returns detailed information about a specific equipment.
 * Accessible by all authenticated users.
 */
export const GET: APIRoute = async ({ locals, params }) => {
  const supabase = locals.supabase;

  // 1. Validate path parameter
  const validationResult = equipmentIdSchema.safeParse({ id: params.id });
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

  const { id } = validationResult.data;

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

  // 3. Fetch equipment details
  try {
    const equipmentService = createEquipmentService(supabase);
    const result = await equipmentService.getEquipment(id);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching equipment:", error);

    // Handle not found error
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

### Krok 3: Utworzenie struktury katalogów

```
src/pages/api/equipment/
├── index.ts              # GET (list), POST (create)
└── [id]/
    └── index.ts          # GET (detail) - Nowy
```

### Krok 4: Testy manualne

1. **Test bez autentykacji:**
   ```bash
   curl -X GET http://localhost:4321/api/equipment/550e8400-e29b-41d4-a716-446655440000
   # Oczekiwany: 401 Unauthorized
   ```

2. **Test z prawidłowym UUID:**
   ```bash
   curl -X GET http://localhost:4321/api/equipment/550e8400-e29b-41d4-a716-446655440000 \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 200 OK z pełnymi danymi sprzętu
   ```

3. **Test z nieprawidłowym UUID:**
   ```bash
   curl -X GET http://localhost:4321/api/equipment/not-a-uuid \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 400 Bad Request
   ```

4. **Test z nieistniejącym UUID:**
   ```bash
   curl -X GET http://localhost:4321/api/equipment/00000000-0000-0000-0000-000000000000 \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 404 Not Found
   ```

## 10. Checklist przed wdrożeniem

- [ ] Dodano metodę getEquipment do `src/lib/services/equipment.service.ts`
- [ ] Utworzono `src/pages/api/equipment/[id]/index.ts` z GET handlerem
- [ ] Zweryfikowano poprawność joinów na profiles
- [ ] Zweryfikowano mapowanie na UserReference (id, name)
- [ ] Przeprowadzono testy manualne wszystkich scenariuszy
- [ ] Sprawdzono czy linter nie zgłasza błędów
- [ ] Zweryfikowano działanie z rzeczywistą bazą Supabase
