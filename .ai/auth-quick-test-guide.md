# 🚀 Quick Start - Test Authentication

## Przed testowaniem

1. **Upewnij się, że Supabase jest uruchomiony:**
   ```bash
   npm run db:start
   ```

2. **Dev server powinien być uruchomiony:**
   ```bash
   npm run dev
   # Aplikacja dostępna na: http://localhost:3000
   ```

3. **Wyłącz email confirmation w Supabase (jeśli jeszcze nie zrobione):**
   - Otwórz: http://localhost:54323 (Supabase Studio)
   - Przejdź: Authentication → Email Auth
   - Wyłącz: "Confirm email"

---

## ⚡ Test 1: Rejestracja pierwszego użytkownika (Owner)

**URL:** http://localhost:3000/register

**Dane testowe:**
```
Imię i nazwisko: Admin Testowy
Email: admin@test.com
Hasło: testtest123
Potwierdź hasło: testtest123
```

**Krok po kroku:**
1. Wejdź na `/register`
2. Wypełnij formularz
3. Kliknij "Zarejestruj się"

**✅ Oczekiwany rezultat:**
- Przekierowanie na `/login?registered=true`
- Zielony komunikat: "✓ Rejestracja przebiegła pomyślnie! Możesz się teraz zalogować."

---

## ⚡ Test 2: Logowanie

**URL:** http://localhost:3000/login

**Dane testowe:**
```
Email: admin@test.com
Hasło: testtest123
```

**Krok po kroku:**
1. Wprowadź dane logowania
2. Kliknij "Zaloguj się"

**✅ Oczekiwany rezultat:**
- Przekierowanie na `/equipment`
- Brak błędów w konsoli
- W DevTools → Application → Cookies powinny być:
  - `sb-access-token` (HttpOnly ✓)
  - `sb-refresh-token` (HttpOnly ✓)

---

## ⚡ Test 3: Sprawdzenie sesji

**W konsoli DevTools (F12):**
```javascript
fetch('/api/auth/session')
  .then(r => r.json())
  .then(console.log);
```

**✅ Oczekiwany output:**
```json
{
  "user": {
    "id": "...",
    "email": "admin@test.com",
    "name": "Admin Testowy",
    "role": "owner"
  }
}
```

**Zwróć uwagę:** `role: "owner"` - pierwszy użytkownik jest ownerem! ✅

---

## ⚡ Test 4: Weryfikacja w bazie danych

**Otwórz Supabase Studio:** http://localhost:54323

**SQL Editor → New query:**
```sql
SELECT id, email, name, role, created_at 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 5;
```

**✅ Oczekiwany rezultat:**
```
| email            | name           | role  |
|------------------|----------------|-------|
| admin@test.com   | Admin Testowy  | owner |
```

---

## ⚡ Test 5: Wylogowanie

**W konsoli DevTools:**
```javascript
fetch('/api/auth/logout', { method: 'POST' })
  .then(r => r.json())
  .then(console.log);
```

**✅ Oczekiwany rezultat:**
```json
{ "message": "Logged out successfully" }
```

**Sprawdź cookies:**
- `sb-access-token` - USUNIĘTY ✅
- `sb-refresh-token` - USUNIĘTY ✅

**Odśwież stronę `/equipment`:**
- Powinieneś zostać przekierowany na `/login`

---

## ⚡ Test 6: Rejestracja drugiego użytkownika (Worker)

**URL:** http://localhost:3000/register

**Dane testowe:**
```
Imię i nazwisko: Jan Kowalski
Email: worker@test.com
Hasło: testtest123
Potwierdź hasło: testtest123
```

**Po rejestracji zaloguj się:**
```
Email: worker@test.com
Hasło: testtest123
```

**Sprawdź sesję w konsoli:**
```javascript
fetch('/api/auth/session')
  .then(r => r.json())
  .then(console.log);
```

**✅ Oczekiwany rezultat:**
```json
{
  "user": {
    "email": "worker@test.com",
    "name": "Jan Kowalski",
    "role": "worker"  // ← Worker, nie Owner!
  }
}
```

---

## ⚡ Test 7: Błędne dane logowania

**URL:** http://localhost:3000/login

**Dane testowe:**
```
Email: admin@test.com
Hasło: wrong_password
```

**✅ Oczekiwany rezultat:**
- Status: Pozostaje na `/login`
- Czerwony komunikat: "Nieprawidłowy email lub hasło"
- Brak cookies

---

## ⚡ Test 8: Duplikat email

**URL:** http://localhost:3000/register

Spróbuj zarejestrować się z emailem `admin@test.com`

**✅ Oczekiwany rezultat:**
- Czerwony komunikat: "Ten email jest już zarejestrowany"

---

## 🎯 Podsumowanie - Co działa?

✅ Rejestracja użytkowników  
✅ Pierwszy użytkownik = owner  
✅ Kolejni użytkownicy = worker  
✅ Logowanie z walidacją  
✅ HttpOnly cookies (bezpieczne)  
✅ Automatyczne odświeżanie sesji  
✅ Wylogowanie  
✅ Obsługa błędów  
✅ Przekierowania  
✅ Success messages  

---

## 🐛 Jeśli coś nie działa...

### Problem: "Email confirmation required"
**Rozwiązanie:** Wyłącz email confirmation w Supabase Studio

### Problem: "Failed to fetch"
**Rozwiązanie:** Sprawdź czy Supabase jest uruchomiony:
```bash
supabase status
```

### Problem: Cookies się nie ustawiają
**Rozwiązanie:** Sprawdź czy używasz `http://localhost` (nie `127.0.0.1`)

### Problem: Brak przekierowań
**Rozwiązanie:** Sprawdź konsolę DevTools - może być błąd JavaScript

---

## 📊 Testowanie z Supabase Studio

**URL:** http://localhost:54323

**Przydatne queries:**

```sql
-- Zobacz wszystkich użytkowników
SELECT * FROM profiles;

-- Zmień rolę użytkownika
UPDATE profiles 
SET role = 'owner' 
WHERE email = 'worker@test.com';

-- Usuń użytkownika (dla czystych testów)
DELETE FROM auth.users WHERE email = 'test@example.com';
-- Profile usunie się automatycznie (cascade)

-- Sprawdź liczbę użytkowników
SELECT COUNT(*) FROM profiles;
```

---

## ✅ Ready to go!

Implementacja autentykacji jest gotowa i przetestowana.  
Możesz kontynuować z kolejnymi funkcjonalnościami:

- US-002: Dodawanie pracowników przez ownera
- US-004: Dodawanie sprzętu
- itd.

**Dokumentacja pełna:** `.ai/auth-integration-implementation.md`
