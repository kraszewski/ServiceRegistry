# DEMO MODE - Dokumentacja implementacji

## Cel

DEMO MODE pozwala na przeglądanie aplikacji bez konieczności logowania, mockując zalogowanego użytkownika jako "owner". Jest to przydatne do testowania interfejsu i prezentacji aplikacji.

## Centralna konfiguracja

### `src/config.ts`

```typescript
export const DEMO_MODE = true;
```

**Aby wyłączyć DEMO MODE:**
```typescript
export const DEMO_MODE = false;
```

## Architektura

### 1. Middleware (`src/middleware/index.ts`)

Gdy `DEMO_MODE = true`:
- Mockuje `supabase.auth.getUser()` aby zwracał użytkownika demo
- Użytkownik demo ma rolę "owner" i email "demo@example.com"

### 2. Widoki chronione (wszystkie `/equipment/*`, `/users`)

Wspólny wzorzec dla wszystkich chronionych widoków:

```typescript
import { DEMO_MODE } from "@/config.ts";

// Check authentication
const supabase = Astro.locals.supabase;
const { data: { user }, error } = await supabase.auth.getUser();

// Redirect to login if not authenticated (skip in DEMO MODE)
if (!DEMO_MODE && (error || !user)) {
  return Astro.redirect("/login");
}
```

**Zasada działania:**
- W DEMO MODE: przekierowanie jest pomijane, użytkownik jest zmockowany w middleware
- Bez DEMO MODE: przekierowanie do `/login` działa normalnie

### 3. Widoki z dodatkowymi zabezpieczeniami

Widok `/users` dodatkowo sprawdza rolę użytkownika:

```typescript
// Get user profile to check role (only if user exists)
let userRole = "worker";

if (user) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // In DEMO MODE, profile might not exist, so check user_metadata as fallback
  userRole = profile?.role || user.user_metadata?.role || "worker";
}

// Redirect to equipment page if not owner
if (userRole !== "owner") {
  return Astro.redirect("/equipment");
}
```

## Lista chronionych widoków

Wszystkie poniższe widoki używają jednolitego mechanizmu DEMO_MODE:

1. ✅ `/equipment` - Lista sprzętu
2. ✅ `/equipment/[id]` - Szczegóły sprzętu
3. ✅ `/equipment/test` - Strona testowa
4. ✅ `/users` - Zarządzanie użytkownikami (+ sprawdzanie roli owner)

## Komponenty UI

### Navigation (`src/components/shared/Navigation.tsx`)

- Pokazuje badge "🎭 DEMO MODE" tylko gdy `DEMO_MODE = true`
- Zawsze widoczna nawigacja między widokami

### Welcome (`src/components/Welcome.astro`)

- Banner DEMO MODE widoczny tylko gdy `demoMode = true`
- Warunkowo renderowana treść

## API Endpoints

API endpoints wspierają DEMO_MODE:

### 1. `/api/auth/session` (GET)

Zwraca informacje o aktualnie zalogowanym użytkowniku.

**W DEMO MODE:**
```typescript
if (DEMO_MODE) {
  return {
    user: {
      id: "00000000-0000-0000-0000-000000000001",
      email: "demo@example.com",
      name: "Demo User",
      role: "owner",
    },
  };
}
```

**Bez DEMO MODE:**
- Sprawdza cookies sesji Supabase
- Pobiera profil użytkownika z bazy danych
- Zwraca 401 jeśli brak sesji

### 2. Pozostałe API endpoints (`/api/equipment/*`, `/api/users/*`, `/api/service-entries/*`)

Działają bez zmian, ponieważ:
- Używają `supabase.auth.getUser()` który jest zmockowany w middleware
- Automatycznie otrzymują zmockowanego użytkownika w DEMO MODE
- Nie wymagają cookies sesji

## Testowanie

### Sprawdzenie czy DEMO MODE działa:

1. Upewnij się że `DEMO_MODE = true` w `src/config.ts`
2. Otwórz aplikację bez logowania
3. Powinieneś zobaczyć:
   - Badge "🎭 DEMO MODE" w nawigacji
   - Banner na stronie głównej
   - Dostęp do wszystkich widoków (/equipment, /users)
   - Możliwość dodawania/edycji danych

### Sprawdzenie czy tryb produkcyjny działa:

1. Ustaw `DEMO_MODE = false` w `src/config.ts`
2. Otwórz aplikację bez logowania
3. Powinieneś być przekierowany do `/login` przy próbie dostępu do chronionych widoków
4. Badge DEMO MODE i banner nie powinny być widoczne

## Bezpieczeństwo

⚠️ **WAŻNE:** Przed wdrożeniem do produkcji:
1. Ustaw `DEMO_MODE = false`
2. Upewnij się, że strona `/login` istnieje
3. Skonfiguruj prawdziwą autentykację Supabase

## Przyszłe rozszerzenia

Gdy dodajesz nowy chroniony widok:

1. Importuj `DEMO_MODE` z `@/config.ts`
2. Dodaj standardowe sprawdzenie autentykacji:
   ```typescript
   const { data: { user }, error } = await supabase.auth.getUser();
   if (!DEMO_MODE && (error || !user)) {
     return Astro.redirect("/login");
   }
   ```
3. Przekaż `currentPage` do Layout dla nawigacji
4. Jeśli widok wymaga specjalnej roli, dodaj sprawdzanie roli jak w `/users`
