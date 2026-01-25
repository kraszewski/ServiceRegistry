# Schematy walidacji Zod

Ten katalog zawiera schematy walidacji Zod używane do weryfikacji danych wejściowych w aplikacji ServiceRegistry.

## Struktura

Każdy schemat walidacji ma odpowiadający mu plik testowy:

```
schemas/
├── equipment.schema.ts          # ✅ Schemat walidacji sprzętu
├── equipment.schema.test.ts     # ✅ 24 testy jednostkowe
├── equipment-form.schema.ts     # Schemat dla formularza sprzętu
├── service-entry.schema.ts      # 🔜 Schemat walidacji wpisów serwisowych
├── user.schema.ts               # 🔜 Schemat walidacji użytkowników
├── user-form.schema.ts          # Schemat dla formularza użytkownika
├── register-form.schema.ts      # Schemat dla formularza rejestracji
├── login-form.schema.ts         # Schemat dla formularza logowania
└── pagination.schema.ts         # 🔜 Schemat walidacji paginacji
```

## Uruchamianie testów

### Wszystkie testy jednostkowe

```bash
# Tryb watch (automatyczne ponowne uruchamianie przy zmianach)
npm run test

# Jednorazowe uruchomienie (przydatne w CI/CD)
npm run test:run

# Interfejs UI z podglądem wyników
npm run test:ui
```

### Tylko testy dla schematów

```bash
# Uruchom tylko testy w katalogu schemas
npm run test src/lib/schemas

# Uruchom tylko testy dla equipment.schema
npm run test equipment.schema.test.ts
```

## Pokrycie testami

| Schemat | Testy | Status | Liczba testów |
|---------|-------|--------|---------------|
| `equipment.schema.ts` | ✅ | Zaimplementowane | 24 |
| `service-entry.schema.ts` | 🔜 | Do zaimplementowania | - |
| `user.schema.ts` | 🔜 | Do zaimplementowania | - |
| `pagination.schema.ts` | 🔜 | Do zaimplementowania | - |

## Konwencje testów

1. **Lokalizacja**: Testy umieszczone obok testowanego kodu z rozszerzeniem `.test.ts`
2. **Naming**: `[nazwa-schematu].test.ts`
3. **Struktura**: Używamy `describe` / `it` z Vitest
4. **Kategorie testów**:
   - Testy pozytywne (happy path) - poprawne dane
   - Testy negatywne (edge cases) - niepoprawne dane, walidacja błędów
   - Testy graniczne (boundary tests) - limity długości, zakresów wartości

## Przykład struktury testu

```typescript
import { describe, it, expect } from 'vitest';
import { mySchema } from './my.schema';

describe('My Schema Validation', () => {
  describe('mySchema', () => {
    it('should validate correct data', () => {
      const validData = { /* ... */ };
      const result = mySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid data', () => {
      const invalidData = { /* ... */ };
      const result = mySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
```

## Więcej informacji

- [Test Plan](../../../.ai/test-plan.md) - Kompleksowy plan testów projektu
- [Vitest Documentation](https://vitest.dev/) - Oficjalna dokumentacja Vitest
- [Zod Documentation](https://zod.dev/) - Oficjalna dokumentacja Zod
