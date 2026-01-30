# Zmiana domyślnego limitu paginacji dla Equipment

## Podsumowanie zmian

Zmieniono domyślny limit paginacji dla endpointu equipment z **50 na 10** elementów na stronę.

## Uzasadnienie

- Lepsza widoczność paginacji przy 30 elementach testowych (3 strony zamiast 1)
- Szybsze ładowanie strony przy dużej liczbie sprzętu
- Lepsza wydajność UI - mniej elementów do renderowania
- Bardziej czytelny widok na mniejszych ekranach

## Zakres zmian

### 1. Backend (API & Services)

**Pliki:**
- `src/lib/schemas/equipment.schema.ts` - Zod schema z `default(10)`
- `src/lib/services/equipment.service.ts` - Domyślna wartość w parametrach `limit = 10`
- `src/pages/api/equipment/index.ts` - Dokumentacja API z limitem 10
- `src/types.ts` - Dokumentacja interfejsu `PaginationParams`

**Przed:**
```typescript
limit: z.coerce.number().int().min(1).max(100).default(50)
```

**Po:**
```typescript
limit: z.coerce.number().int().min(1).max(100).default(10)
```

### 2. Frontend (Hooks & Components)

**Pliki:**
- `src/components/hooks/useEquipmentListParams.ts` - DEFAULT_PARAMS z limitem 10
- `src/lib/api/equipment.ts` - Zawsze wysyła limit w query params
- `src/components/equipment/EquipmentListPage.tsx` - Fallback wartość dla pagination

**Przed:**
```typescript
const DEFAULT_PARAMS = {
  page: 1,
  limit: 50,
  ...
}
```

**Po:**
```typescript
const DEFAULT_PARAMS = {
  page: 1,
  limit: 10,
  ...
}
```

### 3. Testy jednostkowe

**Pliki:**
- `src/lib/schemas/equipment.schema.test.ts` - Zaktualizowana asercja

**Przed:**
```typescript
expect(result.data.limit).toBe(50);
```

**Po:**
```typescript
expect(result.data.limit).toBe(10);
```

### 4. Dokumentacja

**Zaktualizowane pliki w `.ai/`:**
- `get-api-equipment-implementation-plan.md`
- `equipment-view-implementation-plan.md`
- `api-plan.md`
- `ui-plan.md`
- `equipment-details-view-implementation-plan.md`
- `post-api-equipment-id-service-entries-implementation-plan.md`
- `get-api-equipment-id-service-entries-implementation-plan.md`

**Utworzony plik:**
- `pagination-limit-change.md` (ten dokument)

## Niezaktualizowane elementy (świadomie)

### Users endpoint
**Pozostaje limit 50** - nie zmieniono, ponieważ:
- Zazwyczaj znacznie mniej użytkowników niż sprzętu
- Inny use case - rzadziej przeglądany
- Osobny schemat paginacji (`pagination.schema.ts`)

**Pliki bez zmian:**
- `src/lib/schemas/pagination.schema.ts` - używany przez users (limit 50)
- `src/components/hooks/useUsersListParams.ts` - używa limitu 50
- `.ai/get-api-users-implementation-plan.md` - dokumentacja users z limitem 50
- `src/components/users/README.md` - dokumentacja users z limitem 50

## Weryfikacja

### Backend
✅ Zod schema validuje domyślnie limit=10
✅ Service używa limit=10 gdy nie podano
✅ API dokumentacja zaktualizowana

### Frontend
✅ Hook zarządza limitem 10
✅ API client zawsze wysyła limit
✅ Komponent obsługuje paginację poprawnie

### Testy
✅ Wszystkie 24 testy jednostkowe przechodzą
✅ Brak błędów lintowania

### Baza danych
✅ Seed data zawiera 30 elementów
✅ Paginacja widoczna (3 strony po 10 elementów)

## Data zmiany
2026-01-30

## Powiązane zadania
- Implementacja filtra wyszukiwania po equipment_id
- Naprawienie widoczności paginacji
- Aktualizacja dokumentacji projektu
