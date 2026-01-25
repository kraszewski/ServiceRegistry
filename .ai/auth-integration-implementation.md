# Integracja Autentykacji - Plan Implementacji i Testowania

## Status: ✅ ZAIMPLEMENTOWANE

Data implementacji: 2026-01-25

---

## 1. Przegląd implementacji

### Komponenty zaimplementowane

#### Backend (API Endpoints)
- ✅ `POST /api/auth/login` - Logowanie użytkownika z HttpOnly cookies
- ✅ `POST /api/auth/logout` - Wylogowanie i czyszczenie cookies
- ✅ `POST /api/auth/register` - Rejestracja nowego użytkownika (pierwszy = owner)
- ✅ `GET /api/auth/session` - Pobieranie informacji o aktualnej sesji

#### Frontend (React Components)
- ✅ `LoginForm.tsx` - Formularz logowania z integracją API
- ✅ `RegisterForm.tsx` - Formularz rejestracji z integracją API
- ✅ `useUser.ts` - Hook do zarządzania stanem użytkownika
- ✅ `useRequireAuth.ts` - Hook do protected routes

#### Middleware & Infrastructure
- ✅ Middleware z automatycznym odświeżaniem sesji z cookies
- ✅ Usunięcie DEMO_MODE z całej aplikacji
- ✅ HttpOnly cookies dla maksymalnego bezpieczeństwa

---

## 2. Architektura autentykacji

### Flow logowania

```
User → LoginForm.tsx → POST /api/auth/login → Supabase Auth
                                ↓
                        Set HttpOnly Cookies
                                ↓
                        Redirect to /equipment
```

### Flow rejestracji

```
User → RegisterForm.tsx → POST /api/auth/register → Supabase Auth
                                    ↓
                    Check if first user (count profiles)
                                    ↓
                    Create user + profile (trigger)
                                    ↓
                    If first: upgrade role to 'owner'
                                    ↓
                    Redirect to /login?registered=true
```

### Flow sesji

```
Page Load → Middleware → Read cookies → setSession()
                              ↓
                    Auto-refresh if needed
                              ↓
            Component → useUser() → GET /api/auth/session
                              ↓
                    Return user + role
```

### Zarządzanie cookies

- **sb-access-token** (HttpOnly, 1h)
  - Short-lived access token
  - Secure in production
  - SameSite: Lax

- **sb-refresh-token** (HttpOnly, 7 days)
  - Long-lived refresh token
  - Used to get new access tokens
  - Secure in production

---

## 3. Bezpieczeństwo

### ✅ Implementowane zabezpieczenia

1. **HttpOnly Cookies**
   - Tokeny niedostępne z JavaScript
   - Ochrona przed XSS

2. **Secure Flag (Production)**
   - Cookies tylko przez HTTPS w produkcji
   - `secure: import.meta.env.PROD`

3. **SameSite: Lax**
   - Ochrona przed CSRF
   - Cookies nie wysyłane w cross-site requests

4. **Generyczne komunikaty błędów**
   - "Nieprawidłowy email lub hasło"
   - Nie ujawnia czy email istnieje w bazie

5. **Walidacja Zod**
   - Server-side validation wszystkich inputów
   - Type-safe schemas

6. **RLS Policies**
   - Row Level Security w Supabase
   - Dostęp tylko do własnych danych

---

## 4. Plan testowania

### Test 1: Rejestracja pierwszego użytkownika (Owner)

**Cel:** Zweryfikować, że pierwszy użytkownik otrzymuje rolę `owner`

**Kroki:**
1. Otwórz `/register`
2. Wypełnij formularz:
   - Imię: "Test Owner"
   - Email: "owner@test.com"
   - Hasło: "testtest123"
   - Potwierdź hasło: "testtest123"
3. Kliknij "Zarejestruj się"

**Oczekiwany rezultat:**
- ✅ Przekierowanie do `/login?registered=true`
- ✅ Komunikat sukcesu: "Rejestracja przebiegła pomyślnie!"
- ✅ W bazie: użytkownik ma rolę `owner`

**Weryfikacja w bazie:**
```sql
SELECT id, email, name, role FROM profiles WHERE email = 'owner@test.com';
-- Powinno zwrócić role = 'owner'
```

---

### Test 2: Logowanie użytkownika

**Cel:** Zweryfikować poprawne logowanie i przekierowanie

**Kroki:**
1. Na stronie `/login` wprowadź:
   - Email: "owner@test.com"
   - Hasło: "testtest123"
2. Kliknij "Zaloguj się"

**Oczekiwany rezultat:**
- ✅ Przekierowanie do `/equipment`
- ✅ Cookies ustawione (sprawdź w DevTools → Application → Cookies):
  - `sb-access-token` (HttpOnly)
  - `sb-refresh-token` (HttpOnly)
- ✅ Brak błędów w konsoli

---

### Test 3: Sesja użytkownika

**Cel:** Zweryfikować, że sesja działa poprawnie

**Kroki:**
1. Będąc zalogowanym, otwórz DevTools → Console
2. Wykonaj:
   ```javascript
   fetch('/api/auth/session').then(r => r.json()).then(console.log)
   ```

**Oczekiwany rezultat:**
```json
{
  "user": {
    "id": "uuid",
    "email": "owner@test.com",
    "name": "Test Owner",
    "role": "owner"
  }
}
```

---

### Test 4: Wylogowanie

**Cel:** Zweryfikować poprawne czyszczenie sesji

**Kroki:**
1. Będąc zalogowanym, wykonaj w konsoli:
   ```javascript
   fetch('/api/auth/logout', { method: 'POST' })
     .then(r => r.json())
     .then(console.log)
   ```
2. Odśwież stronę
3. Sprawdź cookies w DevTools

**Oczekiwany rezultat:**
- ✅ Response: `{ "message": "Logged out successfully" }`
- ✅ Cookies `sb-access-token` i `sb-refresh-token` usunięte
- ✅ Kolejne wywołanie `/api/auth/session` zwraca 401

---

### Test 5: Rejestracja drugiego użytkownika (Worker)

**Cel:** Zweryfikować, że kolejni użytkownicy otrzymują rolę `worker`

**Kroki:**
1. Wyloguj się (jeśli zalogowany)
2. Otwórz `/register`
3. Wypełnij formularz:
   - Imię: "Test Worker"
   - Email: "worker@test.com"
   - Hasło: "testtest123"
4. Zarejestruj i zaloguj się

**Oczekiwany rezultat:**
- ✅ Użytkownik utworzony
- ✅ W bazie: `role = 'worker'`

**Weryfikacja w bazie:**
```sql
SELECT id, email, name, role FROM profiles WHERE email = 'worker@test.com';
-- Powinno zwrócić role = 'worker'
```

---

### Test 6: Duplikat email

**Cel:** Zweryfikować obsługę błędu dla istniejącego email

**Kroki:**
1. Spróbuj zarejestrować się z emailem "owner@test.com"

**Oczekiwany rezultat:**
- ✅ Status 409
- ✅ Komunikat: "Ten email jest już zarejestrowany"

---

### Test 7: Nieprawidłowe logowanie

**Cel:** Zweryfikować obsługę błędów logowania

**Kroki:**
1. Spróbuj się zalogować z:
   - Email: "owner@test.com"
   - Hasło: "wrongpassword"

**Oczekiwany rezultat:**
- ✅ Status 401
- ✅ Komunikat: "Nieprawidłowy email lub hasło"
- ✅ Brak cookies

---

### Test 8: Walidacja formularza (Frontend)

**Cel:** Zweryfikować client-side validation

**Scenariusze do przetestowania:**

**LoginForm:**
- Email pusty → "Email jest wymagany"
- Email nieprawidłowy → "Nieprawidłowy format email"
- Hasło puste → "Hasło jest wymagane"
- Hasło < 8 znaków → "Hasło musi mieć minimum 8 znaków"

**RegisterForm:**
- Wszystkie powyższe
- Hasła się nie zgadzają → "Hasła muszą być identyczne"
- Imię puste → "Imię i nazwisko jest wymagane"

---

### Test 9: Refresh token (automatyczny)

**Cel:** Zweryfikować automatyczne odświeżanie sesji przez middleware

**Kroki:**
1. Zaloguj się
2. Poczekaj 1-2 minuty (access token ma krótki lifetime)
3. Odśwież stronę `/equipment`
4. Sprawdź czy nadal jesteś zalogowany

**Oczekiwany rezultat:**
- ✅ Sesja automatycznie odnowiona
- ✅ Nowe cookies ustawione
- ✅ Brak przekierowania do `/login`

---

### Test 10: Protected route (useRequireAuth)

**Cel:** Zweryfikować redirect do /login dla niezalogowanych

**Kroki:**
1. Wyloguj się
2. Usuń cookies ręcznie (DevTools)
3. Spróbuj wejść na `/equipment`

**Oczekiwany rezultat:**
- ✅ Automatyczne przekierowanie do `/login`

**Uwaga:** Ten test wymaga użycia `useRequireAuth()` w komponencie. Obecnie `useUser()` tylko zwraca `null`, nie przekierowuje automatycznie.

---

## 5. Checklist integracji

### Backend
- [x] Endpoint `/api/auth/login` zaimplementowany
- [x] Endpoint `/api/auth/logout` zaimplementowany
- [x] Endpoint `/api/auth/register` zaimplementowany
- [x] Endpoint `/api/auth/session` zaktualizowany
- [x] HttpOnly cookies ustawiane prawidłowo
- [x] Walidacja Zod na wszystkich endpointach
- [x] Generyczne komunikaty błędów (security)
- [x] Pierwszy użytkownik = owner, reszta = worker

### Frontend
- [x] `LoginForm.tsx` zintegrowany z API
- [x] `RegisterForm.tsx` zintegrowany z API
- [x] Przekierowanie do `/equipment` po logowaniu
- [x] Przekierowanie do `/login` po rejestracji
- [x] Success message na `/login` po rejestracji
- [x] `useUser()` hook działa poprawnie
- [x] `useRequireAuth()` hook utworzony

### Middleware
- [x] Automatyczne odświeżanie sesji z cookies
- [x] Supabase client dostępny w `context.locals`
- [x] DEMO_MODE usunięty

### Dokumentacja
- [x] README w `/src/components/auth/` zaktualizowany
- [x] Komentarze w kodzie API endpoints
- [x] Ten dokument z planem testowania

---

## 6. Znane ograniczenia i TODO

### ⚠️ Email confirmation
- Supabase może wymagać potwierdzenia email
- W development można wyłączyć w Supabase Dashboard:
  - Settings → Authentication → Email Auth → Disable "Confirm email"

### ⚠️ Password reset
- Nie zaimplementowany w MVP
- TODO: Dodać endpoint `/api/auth/reset-password`

### ⚠️ Protected routes na poziomie Astro
- Obecnie tylko client-side protection (useRequireAuth)
- TODO: Rozważyć middleware check i server-side redirect

---

## 7. Weryfikacja zgodności z PRD

### US-001: Logowanie ✅

**Kryteria akceptacji:**
- ✅ Formularz email/hasło
- ✅ Walidacja
- ✅ Poprawne dane logują i prowadzą do strony ze sprzętem
- ✅ Niepoprawne pokazują błąd
- ✅ Wylogowanie dostępne (endpoint gotowy)

---

## 8. Następne kroki

1. **Uruchom dev server:**
   ```bash
   npm run dev
   ```

2. **Upewnij się, że Supabase jest uruchomiony:**
   ```bash
   supabase start
   ```

3. **Przetestuj manualnie wszystkie scenariusze** z sekcji 4

4. **Opcjonalnie: Napisz E2E test z Playwright**
   ```typescript
   test('US-001: User can register, login, and access equipment', async ({ page }) => {
     // Test registration
     await page.goto('/register');
     await page.fill('[name="name"]', 'Test Owner');
     await page.fill('[name="email"]', `test-${Date.now()}@example.com`);
     await page.fill('[name="password"]', 'testtest123');
     await page.fill('[name="confirmPassword"]', 'testtest123');
     await page.click('button[type="submit"]');
     
     // Should redirect to login
     await expect(page).toHaveURL(/\/login\?registered=true/);
     
     // Test login
     await page.fill('[name="email"]', email);
     await page.fill('[name="password"]', 'testtest123');
     await page.click('button[type="submit"]');
     
     // Should redirect to equipment
     await expect(page).toHaveURL(/\/equipment/);
   });
   ```

---

## 9. Kontakt i wsparcie

W przypadku problemów:
1. Sprawdź logi Supabase: `supabase logs`
2. Sprawdź logi dev servera (Astro)
3. Sprawdź DevTools → Console i Network
4. Sprawdź czy email confirmation nie jest włączone w Supabase

---

**Status:** ✅ Gotowe do testowania
**Priorytet:** Wysoki (blokuje dalszy rozwój funkcjonalności)
**Estymacja testów:** 30-45 minut
