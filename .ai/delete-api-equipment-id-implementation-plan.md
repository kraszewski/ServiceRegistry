# API Endpoint Implementation Plan: DELETE /api/equipment/{id}

## 1. Przegląd punktu końcowego

Endpoint `DELETE /api/equipment/{id}` służy do usuwania sprzętu wraz ze wszystkimi powiązanymi wpisami serwisowymi (cascade delete). **Dostępny tylko dla użytkowników z rolą owner.**

**Cel biznesowy:** Umożliwienie właścicielom systemu trwałego usunięcia sprzętu, który nie jest już potrzebny w inwentarzu, wraz z całą historią serwisową.

## 2. Szczegóły żądania

- **Metoda HTTP:** DELETE
- **Struktura URL:** `/api/equipment/{id}`
- **Lokalizacja pliku:** `src/pages/api/equipment/[id]/index.ts`

### Parametry ścieżki

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `id` | uuid | Tak | UUID sprzętu do usunięcia |

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

### Istniejące schematy z `src/lib/schemas/equipment.schema.ts`

```typescript
// Zod schema dla walidacji path parameter
export const equipmentIdSchema = z.string().uuid("Invalid equipment ID format");
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
{
  "message": "Equipment deleted successfully"
}
```

### Błędy

| Status | Opis | Przykładowa odpowiedź |
|--------|------|----------------------|
| 400 | Nieprawidłowe ID w ścieżce | `{"error": "Invalid equipment ID format"}` |
| 401 | Brak uwierzytelnienia | `{"error": "Unauthorized"}` |
| 403 | Użytkownik nie jest owner | `{"error": "Only owner can delete equipment"}` |
| 404 | Sprzęt nie znaleziony | `{"error": "Equipment not found"}` |
| 500 | Błąd serwera | `{"error": "Internal server error"}` |

## 5. Przepływ danych

```
┌─────────────────┐
│   Klient HTTP   │
└────────┬────────┘
         │ DELETE /api/equipment/{id}
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Route Handler                         │
│  src/pages/api/equipment/[id]/index.ts                      │
├─────────────────────────────────────────────────────────────┤
│  1. Walidacja path parameter (UUID)                         │
│  2. Sprawdzenie autentykacji (supabase.auth.getUser())      │
│  3. Sprawdzenie autoryzacji (supabase.rpc('is_owner'))      │
│  4. Wywołanie EquipmentService.deleteEquipment()            │
│  5. Zwrot odpowiedzi sukcesu                                │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    EquipmentService                          │
│  src/lib/services/equipment.service.ts                      │
├─────────────────────────────────────────────────────────────┤
│  1. Sprawdzenie czy sprzęt istnieje                         │
│  2. DELETE z tabeli equipment                               │
│  3. Cascade delete usuwa powiązane service_entries          │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                                │
├─────────────────────────────────────────────────────────────┤
│  equipment                  │  service_entries              │
│  - DELETE WHERE id = {id}   │  - CASCADE DELETE             │
│                             │    (automatic)                │
└─────────────────────────────┴───────────────────────────────┘
```

### Szczegółowy przepływ

1. **Klient** wysyła żądanie DELETE z ID w URL
2. **API Route** waliduje UUID z parametru ścieżki
3. **API Route** sprawdza sesję użytkownika przez `supabase.auth.getUser()`
4. **API Route** sprawdza czy użytkownik ma rolę owner przez `supabase.rpc('is_owner')`
5. **EquipmentService** sprawdza czy sprzęt istnieje
6. **EquipmentService** wykonuje DELETE
7. **Baza danych** automatycznie usuwa powiązane wpisy serwisowe (ON DELETE CASCADE)
8. **API Route** zwraca odpowiedź ze statusem 200 OK

## 6. Względy bezpieczeństwa

### Uwierzytelnienie

- Weryfikacja sesji przez `supabase.auth.getUser()` przed jakąkolwiek operacją
- Odrzucenie żądania z kodem 401 jeśli brak ważnej sesji

### Autoryzacja

- **Tylko właściciele (owner)** mogą usuwać sprzęt
- Sprawdzenie roli przez funkcję bazodanową `is_owner()`
- Odrzucenie żądania z kodem 403 jeśli użytkownik nie jest owner
- RLS policies zapewniają dodatkową warstwę ochrony

### Walidacja danych wejściowych

- Walidacja UUID parametru ścieżki przed dalszym przetwarzaniem

### Cascade Delete

- Usunięcie sprzętu automatycznie usuwa wszystkie powiązane wpisy serwisowe
- Jest to zamierzone zachowanie zdefiniowane w schemacie bazy (ON DELETE CASCADE)
- Operacja jest atomowa - albo usuwa wszystko, albo nic

### Ochrona przed przypadkowym usunięciem

- Autoryzacja tylko dla owner zapobiega przypadkowemu usunięciu przez pracowników
- Brak możliwości przywrócenia usuniętych danych

## 7. Obsługa błędów

### Scenariusze błędów

| Scenariusz | Kod HTTP | Komunikat | Akcja |
|------------|----------|-----------|-------|
| Nieprawidłowy UUID | 400 | "Invalid equipment ID format" | Poprawienie ID w URL |
| Brak tokena sesji | 401 | "Unauthorized" | Przekierowanie do logowania |
| Nieważna sesja | 401 | "Unauthorized" | Przekierowanie do logowania |
| Użytkownik nie jest owner | 403 | "Only owner can delete equipment" | Brak dostępu |
| Sprzęt nie istnieje | 404 | "Equipment not found" | Sprawdzenie ID |
| Błąd bazy danych | 500 | "Internal server error" | Logowanie, retry |

### Implementacja obsługi błędów

```typescript
export const DELETE: APIRoute = async ({ params, locals }) => {
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

  // 3. Sprawdzenie autoryzacji (tylko owner)
  const { data: isOwner } = await supabase.rpc("is_owner");
  if (!isOwner) {
    return new Response(
      JSON.stringify({ error: "Only owner can delete equipment" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // 4. Usunięcie sprzętu
  try {
    const equipmentService = createEquipmentService(supabase);
    await equipmentService.deleteEquipment(idValidation.data);
    
    return new Response(
      JSON.stringify({ message: "Equipment deleted successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error deleting equipment:", error);

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

1. **Sprawdzenie roli owner** - dodatkowe wywołanie RPC
2. **Cascade delete** - może być kosztowne przy dużej liczbie wpisów serwisowych

### Strategie optymalizacji

1. **Sprawdzenie owner przez RPC:**
   - Funkcja `is_owner()` jest zoptymalizowana (SECURITY DEFINER)
   - Wykonuje proste zapytanie do tabeli profiles

2. **Indeksy bazodanowe:**
   - `equipment.id` - PRIMARY KEY (indeks automatyczny)
   - `service_entries.equipment_id` - indeks FK dla szybkiego cascade delete

3. **Transakcyjność:**
   - DELETE z cascade jest atomowy
   - Wszystkie powiązane rekordy usuwane w jednej transakcji

4. **Kolejność operacji:**
   - Sprawdzenie autoryzacji przed operacją delete
   - Fail-fast pattern dla nieautoryzowanych żądań

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie EquipmentService

**Plik:** `src/lib/services/equipment.service.ts` (dodanie metody)

```typescript
/**
 * Deletes equipment and all associated service entries.
 * Service entries are deleted automatically via CASCADE.
 * @throws Error if equipment not found
 */
async deleteEquipment(id: string): Promise<void> {
  // First check if equipment exists
  const { data: existing, error: checkError } = await this.supabase
    .from("equipment")
    .select("id")
    .eq("id", id)
    .single();

  if (checkError || !existing) {
    throw new Error("Equipment not found");
  }

  // Delete equipment (service_entries will be cascade deleted)
  const { error } = await this.supabase
    .from("equipment")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete equipment: ${error.message}`);
  }
}
```

### Krok 2: Dodanie DELETE handlera do API Route

**Plik:** `src/pages/api/equipment/[id]/index.ts` (rozszerzenie)

```typescript
import type { APIRoute } from "astro";
import type { ErrorResponse, DeleteResponse } from "../../../../types";
import { equipmentIdSchema } from "../../../../lib/schemas/equipment.schema";
import { createEquipmentService } from "../../../../lib/services/equipment.service";

export const prerender = false;

/**
 * DELETE /api/equipment/{id}
 *
 * Deletes equipment and all associated service entries (cascade).
 * Owner only.
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
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

  // 3. Check authorization (owner only)
  const { data: isOwner } = await supabase.rpc("is_owner");
  if (!isOwner) {
    const errorResponse: ErrorResponse = { error: "Only owner can delete equipment" };
    return new Response(JSON.stringify(errorResponse), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 4. Delete equipment
  try {
    const equipmentService = createEquipmentService(supabase);
    await equipmentService.deleteEquipment(idValidation.data);

    const successResponse: DeleteResponse = { message: "Equipment deleted successfully" };
    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting equipment:", error);

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

### Krok 3: Testy manualne

1. **Test bez autentykacji:**
   ```bash
   curl -X DELETE http://localhost:4321/api/equipment/550e8400-e29b-41d4-a716-446655440000
   # Oczekiwany: 401 Unauthorized
   ```

2. **Test z nieprawidłowym UUID:**
   ```bash
   curl -X DELETE http://localhost:4321/api/equipment/invalid-uuid \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 400 Invalid equipment ID format
   ```

3. **Test jako worker (nie-owner):**
   ```bash
   # Zaloguj się jako worker
   curl -X DELETE http://localhost:4321/api/equipment/550e8400-e29b-41d4-a716-446655440000 \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 403 Only owner can delete equipment
   ```

4. **Test z nieistniejącym sprzętem (jako owner):**
   ```bash
   curl -X DELETE http://localhost:4321/api/equipment/550e8400-e29b-41d4-a716-000000000000 \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 404 Equipment not found
   ```

5. **Test poprawnego usunięcia (jako owner):**
   ```bash
   curl -X DELETE http://localhost:4321/api/equipment/550e8400-e29b-41d4-a716-446655440000 \
     -H "Cookie: sb-access-token=..."
   # Oczekiwany: 200 { "message": "Equipment deleted successfully" }
   ```

6. **Test cascade delete:**
   ```bash
   # 1. Utwórz sprzęt i wpis serwisowy
   # 2. Usuń sprzęt
   # 3. Sprawdź że wpis serwisowy też został usunięty
   ```

## 10. Checklist przed wdrożeniem

- [ ] Dodano metodę deleteEquipment do `src/lib/services/equipment.service.ts`
- [ ] Dodano DELETE handler do `src/pages/api/equipment/[id]/index.ts`
- [ ] Zweryfikowano działanie funkcji is_owner() w bazie
- [ ] Przeprowadzono testy manualne wszystkich scenariuszy
- [ ] Sprawdzono czy linter nie zgłasza błędów
- [ ] Zweryfikowano autoryzację tylko dla owner (403)
- [ ] Zweryfikowano cascade delete wpisów serwisowych
- [ ] Zweryfikowano obsługę nieistniejącego sprzętu (404)
- [ ] Zweryfikowano atomowość operacji (transakcja)
