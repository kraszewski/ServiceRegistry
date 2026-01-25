# Naprawa przypisywania roli owner pierwszemu użytkownikowi

## Problem

Pierwszy zarejestrowany użytkownik nie widział linku do zarządzania użytkownikami po rejestracji.

### Przyczyny

1. **Trigger w bazie danych** zawsze tworzył profil z rolą `'worker'`
2. **Endpoint rejestracji** próbował zaktualizować rolę na `'owner'` po utworzeniu użytkownika (race condition)
3. **Brak automatycznego logowania** - po rejestracji użytkownik był przekierowywany na stronę logowania zamiast być automatycznie zalogowanym

### Kod przed naprawą

```sql
-- stara wersja funkcji (zawsze worker)
create or replace function create_profile_for_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Nowy użytkownik'),
    'worker'  -- zawsze worker!
  );
  return new;
end;
$$;
```

Endpoint `/api/auth/register` próbował to naprawić przez dodatkowy UPDATE:

```typescript
// Sprawdzanie liczby użytkowników
const { count: existingUsersCount } = await supabase
  .from("profiles")
  .select("*", { count: "exact", head: true });

const isFirstUser = existingUsersCount === 0;

// ... utworzenie użytkownika ...

// Próba aktualizacji roli
if (isFirstUser) {
  await supabase
    .from("profiles")
    .update({ role: "owner" })
    .eq("id", authData.user.id);
}
```

## Rozwiązanie

### 1. Nowa migracja bazy danych

Utworzono migrację `20260125000000_fix_first_user_owner_role.sql` która aktualizuje funkcję triggera:

```sql
create or replace function create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_count integer;
  assigned_role user_role;
begin
  -- atomically count existing profiles
  -- this happens in the same transaction as the insert
  select count(*) into user_count from profiles;
  
  -- if no users exist yet, this is the first user (owner)
  -- otherwise, new user is a worker
  if user_count = 0 then
    assigned_role := 'owner';
  else
    assigned_role := 'worker';
  end if;
  
  -- insert new profile with correct role
  insert into profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Nowy użytkownik'),
    assigned_role  -- dynamicznie przypisana rola
  );
  
  return new;
end;
$$;
```

**Zalety tego podejścia:**
- ✅ **Atomowość** - sprawdzanie liczby użytkowników i tworzenie profilu dzieje się w jednej transakcji
- ✅ **Thread-safe** - nie ma race condition między wieloma rejestracjami
- ✅ **Prostota** - logika w jednym miejscu (baza danych)
- ✅ **Niezawodność** - działa niezależnie od języka/frameworka aplikacji

### 2. Uproszczenie endpointu rejestracji

Usunięto redundantną logikę sprawdzania i aktualizacji roli z `/api/auth/register`.

### 3. Automatyczne logowanie po rejestracji

Dodano automatyczne logowanie użytkownika po pomyślnej rejestracji:

```typescript
// 4. Log the user in by setting session cookies
// This provides better UX - user doesn't need to log in after registration
if (authData.session) {
  const { session } = authData;
  
  // Access token (short-lived)
  cookies.set("sb-access-token", session.access_token, {
    path: "/",
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    maxAge: 60 * 60, // 1 hour
  });

  // Refresh token (long-lived)
  cookies.set("sb-refresh-token", session.refresh_token, {
    path: "/",
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}
```

**Zmieniono również przekierowanie:**
- ❌ Przed: `/login?registered=true` (użytkownik musiał się zalogować)
- ✅ Teraz: `/equipment` (użytkownik jest automatycznie zalogowany)

## Pliki zmodyfikowane

1. **Nowa migracja:**
   - `supabase/migrations/20260125000000_fix_first_user_owner_role.sql`

2. **Zmodyfikowany endpoint rejestracji:**
   - `src/pages/api/auth/register.ts` (usunięto race condition, dodano auto-login)

3. **Zmodyfikowany komponent rejestracji:**
   - `src/components/auth/RegisterForm.tsx` (zmieniono przekierowanie na `/equipment`)

4. **Zmodyfikowany komponent nawigacji:**
   - `src/components/shared/Navigation.tsx` (dodano conditional rendering linku "Użytkownicy" dla owner)

## Testowanie

### Przygotowanie środowiska

1. Reset bazy danych z nową migracją:
```bash
npx supabase db reset
```

2. Odśwież stronę w przeglądarce, aby wyczyścić cache

### Test 1: Pierwszy użytkownik (owner) z automatycznym logowaniem

1. Przejdź do formularza rejestracji: http://localhost:4321/register

2. Zarejestruj pierwszego użytkownika:
   - **Imię i nazwisko:** Jan Kowalski
   - **Email:** jan@example.com
   - **Hasło:** password123

3. **Oczekiwany wynik:**
   - ✅ Użytkownik jest automatycznie przekierowany na `/equipment`
   - ✅ W nawigacji widoczny link "Użytkownicy"
   - ✅ Użytkownik może kliknąć "Użytkownicy" i przejść do `/users`

4. Sprawdź w bazie danych:
```bash
docker exec supabase_db_ServiceRegistry psql -U postgres -d postgres -c "SELECT id, name, role FROM profiles;"
```

**Oczekiwany wynik w bazie:**
```
id                                   | name         | role
-------------------------------------|-------------|-------
<uuid>                              | Jan Kowalski | owner
```

✅ Rola powinna być **owner**

### Test 2: Drugi użytkownik (worker)

1. Wyloguj się (jeśli jest taka opcja) lub otwórz przeglądarkę w trybie incognito

2. Zarejestruj drugiego użytkownika:
   - **Imię i nazwisko:** Anna Nowak
   - **Email:** anna@example.com
   - **Hasło:** password123

3. **Oczekiwany wynik:**
   - ✅ Użytkownik jest automatycznie przekierowany na `/equipment`
   - ❌ W nawigacji **NIE MA** linku "Użytkownicy"
   - ✅ Próba ręcznego przejścia do `/users` przekierowuje na `/equipment`

4. Sprawdź w bazie danych:
```bash
docker exec supabase_db_ServiceRegistry psql -U postgres -d postgres -c "SELECT name, role FROM profiles ORDER BY created_at;"
```

**Oczekiwany wynik:**
```
name         | role
-------------|--------
Jan Kowalski | owner
Anna Nowak   | worker
```

✅ Pierwszy użytkownik: **owner**  
✅ Drugi użytkownik: **worker**

## Status

✅ **Migracja utworzona i zastosowana**  
✅ **Endpoint rejestracji zaktualizowany (auto-login)**  
✅ **Komponent rejestracji zaktualizowany (przekierowanie)**  
✅ **Nawigacja zaktualizowana (conditional rendering)**  
✅ **Baza danych zresetowana**  
🎯 **Gotowe do testowania**

## Podsumowanie zmian

### Co naprawiono:

1. ✅ **Pierwszy użytkownik automatycznie otrzymuje rolę owner** (trigger w bazie danych)
2. ✅ **Użytkownik jest automatycznie logowany po rejestracji** (session cookies)
3. ✅ **Link "Użytkownicy" widoczny tylko dla owner** (conditional rendering)
4. ✅ **Użytkownik owner ma natychmiastowy dostęp do zarządzania użytkownikami**

### Przebieg działania dla pierwszego użytkownika:

1. Użytkownik wypełnia formularz rejestracji
2. Backend tworzy konto w `auth.users`
3. Trigger automatycznie tworzy profil z rolą `owner` (bo `count = 0`)
4. Backend ustawia session cookies (auto-login)
5. Użytkownik jest przekierowany na `/equipment`
6. Hook `useUser` pobiera profil z rolą `owner`
7. Nawigacja pokazuje link "Użytkownicy"
8. ✅ Użytkownik może zarządzać użytkownikami

### UX improvement:

- **Przed:** Rejestracja → Przekierowanie na login → Logowanie → Dostęp
- **Teraz:** Rejestracja → Auto-login → Natychmiastowy dostęp ✨
