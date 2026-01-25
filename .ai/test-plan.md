# Plan Testów - ServiceRegistry

## 1. Wprowadzenie i cele testowania

### 1.1 Cel dokumentu
Niniejszy dokument określa kompleksową strategię testowania aplikacji ServiceRegistry - systemu do zarządzania inwentarzem sprzętu i historią serwisową. Plan testów został opracowany z uwzględnieniem specyfiki projektu edukacyjnego rozwijanego w trybie AI-driven development oraz wykorzystywanego stosu technologicznego.

### 1.2 Cele testowania
- **Funkcjonalne**: Weryfikacja poprawności implementacji wszystkich wymagań funkcjonalnych określonych w PRD
- **Bezpieczeństwo**: Sprawdzenie skuteczności mechanizmów autentykacji, autoryzacji i Row Level Security (RLS)
- **Integralność danych**: Weryfikacja poprawności walidacji, integralności referencyjnej i automatycznych mechanizmów (triggery, funkcje bazodanowe)
- **Użyteczność**: Zapewnienie wysokiej jakości UX, dostępności (accessibility) i responsywności interfejsu
- **Wydajność**: Weryfikacja działania aplikacji przy zakładanym obciążeniu
- **Edukacyjne**: Praktyczne wykorzystanie testów jako narzędzia uczenia się i dokumentacji projektu

### 1.3 Zakres projektu
ServiceRegistry to aplikacja webowa single-tenant do zarządzania sprzętem i historią serwisową, zbudowana w oparciu o:
- **Frontend**: Astro 5 + React 19 + TypeScript 5 + Tailwind CSS 4 + Shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Deployment**: DigitalOcean (basic)
- **CI/CD**: GitHub Actions

---

## 2. Zakres testów

### 2.1 Funkcjonalności objęte testami

#### A. Autentykacja i Autoryzacja
- Logowanie użytkownika (email/hasło)
- Wylogowanie
- Zarządzanie sesją użytkownika
- System ról (owner/worker)
- Kontrola dostępu do funkcji administracyjnych
- Row Level Security (RLS) na poziomie bazy danych

#### B. Zarządzanie użytkownikami (Owner only)
- Lista użytkowników z paginacją
- Dodawanie nowych pracowników (worker)
- Usuwanie kont pracowników
- Weryfikacja niemożności usunięcia użytkownika z aktywnymi wpisami serwisowymi
- Weryfikacja niemożności usunięcia własnego konta

#### C. Zarządzanie sprzętem (CRUD)
- Lista sprzętu z sortowaniem i paginacją
- Filtry po kategorii
- Wyszukiwanie po unikalnym ID sprzętu (equipment_id)
- Dodawanie nowego sprzętu
- Automatyczne generowanie ID w formacie EQ-YYYY-NNNNN
- Edycja danych sprzętu
- Usuwanie sprzętu (tylko Owner, z kaskadowym usunięciem wpisów)
- Walidacja pól wymaganych i opcjonalnych
- Weryfikacja unikalności numeru seryjnego

#### D. Zarządzanie wpisami serwisowymi
- Lista wpisów serwisowych dla sprzętu
- Dodawanie nowego wpisu serwisowego
- Automatyczne przypisanie wykonawcy (zalogowany użytkownik)
- Edycja wpisu (z niemożnością zmiany wykonawcy)
- Usuwanie wpisu (tylko Owner)
- Chronologiczne sortowanie wpisów (najnowsze na górze)
- Wizualne rozróżnienie typów operacji

#### E. Audit Trail
- Automatyczne ustawianie created_at i updated_at
- Automatyczne ustawianie created_by i updated_by
- Weryfikacja niemożności manualnej zmiany pól audytowych

### 2.2 Funkcjonalności wyłączone z testów MVP
Następujące funkcjonalności nie wchodzą w zakres MVP zgodnie z PRD:
- Kody QR i wydruk etykiet
- Powiadomienia
- Załączniki i pliki
- Multi-tenancy
- Aplikacje mobilne
- Full Text Search (wyszukiwanie tylko po equipment_id)

### 2.3 Środowiska testowe
- **Local Development**: Testy na lokalnym Supabase (Docker)
- **CI/CD**: Testy automatyczne w GitHub Actions
- **Staging**: (opcjonalnie) Testy przed wdrożeniem produkcyjnym

---

## 3. Typy testów do przeprowadzenia

### 3.1 Testy jednostkowe (Unit Tests)
**Status**: ✅ **Częściowo zaimplementowane** (od 2026-01-25)  
**Framework**: Vitest 4.0.18

**Zaimplementowane testy**:

#### ✅ Schematy walidacji Zod - Equipment (`src/lib/schemas/equipment.schema.test.ts`)
**Status**: 24/24 testy przechodzą  
**Pokrycie**: Walidacja schematów dla zarządzania sprzętem

**Testowane obszary**:
1. **createEquipmentSchema** (10 testów):
   - ✅ Walidacja poprawnych danych z polami wymaganymi
   - ✅ Walidacja z polami opcjonalnymi
   - ✅ Odrzucenie danych z brakującym polem `name`
   - ✅ Odrzucenie pustego `name`
   - ✅ Odrzucenie `name` > 100 znaków
   - ✅ Odrzucenie nieprawidłowej kategorii
   - ✅ Akceptacja wszystkich 8 kategorii sprzętu
   - ✅ Odrzucenie nieprawidłowego formatu daty (wymaga YYYY-MM-DD)
   - ✅ Akceptacja wartości `null` dla pól opcjonalnych
   - ✅ Odrzucenie `location` > 200 znaków

2. **equipmentListParamsSchema** (8 testów):
   - ✅ Domyślne wartości dla parametrów paginacji
   - ✅ Konwersja string → number dla `page` i `limit`
   - ✅ Odrzucenie `page < 1`
   - ✅ Odrzucenie `limit > 100`
   - ✅ Akceptacja prawidłowych pól sortowania
   - ✅ Akceptacja prawidłowych kierunków sortowania (asc/desc)
   - ✅ Akceptacja opcjonalnego filtru kategorii
   - ✅ Akceptacja opcjonalnego parametru wyszukiwania

3. **updateEquipmentSchema** (4 testy):
   - ✅ Częściowa aktualizacja z tylko zmienionymi polami
   - ✅ Aktualizacja wielu pól jednocześnie
   - ✅ Walidacja według tych samych zasad co create
   - ✅ Akceptacja pustego obiektu (brak zmian)

4. **equipmentCategoryEnum** (2 testy):
   - ✅ Walidacja wszystkich prawidłowych kategorii
   - ✅ Odrzucenie nieprawidłowej kategorii

**Uruchomienie testów**:
```bash
# Tryb watch
npm run test

# Jednorazowe uruchomienie (CI)
npm run test:run

# Interfejs UI
npm run test:ui
```

**Potencjalne obszary do testów jednostkowych w przyszłości**:
- Funkcje pomocnicze w `src/lib/utils.ts`
- Pozostałe schematy walidacji Zod:
  - `src/lib/schemas/service-entry.schema.ts`
  - `src/lib/schemas/user.schema.ts`
  - `src/lib/schemas/pagination.schema.ts`
- Logika biznesowa w serwisach (`src/lib/services/`)
- Funkcje formatujące daty, kategorie, typy

### 3.2 Testy integracyjne API
**Zakres**: Weryfikacja poprawności działania endpointów API

#### Endpointy autentykacji
- `POST /api/auth/login`
  - Poprawne logowanie z istniejącymi danymi
  - Błąd przy niepoprawnym haśle
  - Błąd przy nieistniejącym emailu
  - Walidacja formatu email
- `POST /api/auth/logout`
  - Poprawne wylogowanie
- `GET /api/auth/session`
  - Zwrócenie danych zalogowanego użytkownika
  - Błąd 401 dla niezalogowanego

#### Endpointy użytkowników (Owner only)
- `GET /api/users`
  - Lista użytkowników z paginacją
  - Weryfikacja dostępu tylko dla owner
  - Błąd 403 dla worker
- `POST /api/users`
  - Utworzenie nowego pracownika
  - Walidacja email (format, unikalność)
  - Walidacja hasła (min. długość)
  - Automatyczne nadanie roli worker
- `GET /api/users/{id}`
  - Pobranie szczegółów użytkownika
  - Błąd 404 dla nieistniejącego ID
- `DELETE /api/users/{id}`
  - Usunięcie pracownika
  - Weryfikacja niemożności usunięcia własnego konta
  - Weryfikacja niemożności usunięcia użytkownika z wpisami serwisowymi (409 Conflict)

#### Endpointy sprzętu
- `GET /api/equipment`
  - Lista sprzętu z paginacją
  - Sortowanie po różnych kolumnach (created_at, name, equipment_id, category, manufacturer)
  - Filtrowanie po kategorii
  - Wyszukiwanie po equipment_id
- `POST /api/equipment`
  - Utworzenie sprzętu z automatycznym ID
  - Walidacja pól wymaganych
  - Weryfikacja unikalności serial_number (409 Conflict)
  - Automatyczne ustawienie created_by i updated_by
- `GET /api/equipment/{id}`
  - Pobranie szczegółów sprzętu
  - Błąd 404 dla nieistniejącego ID
- `PATCH /api/equipment/{id}`
  - Aktualizacja sprzętu
  - Weryfikacja niemożności zmiany equipment_id
  - Automatyczne ustawienie updated_by i updated_at
- `DELETE /api/equipment/{id}`
  - Usunięcie sprzętu (tylko Owner)
  - Błąd 403 dla worker
  - Kaskadowe usunięcie wpisów serwisowych

#### Endpointy wpisów serwisowych
- `GET /api/equipment/{equipmentId}/service-entries`
  - Lista wpisów dla sprzętu
  - Chronologiczne sortowanie (DESC)
  - Paginacja
- `POST /api/equipment/{equipmentId}/service-entries`
  - Utworzenie wpisu
  - Automatyczne ustawienie performer_id (zalogowany użytkownik)
  - Walidacja description (min. 5 znaków)
  - Domyślna wartość service_timestamp (NOW)
- `GET /api/service-entries/{id}`
  - Pobranie szczegółów wpisu
  - Błąd 404 dla nieistniejącego ID
- `PATCH /api/service-entries/{id}`
  - Aktualizacja wpisu
  - Weryfikacja niemożności zmiany performer_id
  - Automatyczne ustawienie updated_by i updated_at
- `DELETE /api/service-entries/{id}`
  - Usunięcie wpisu (tylko Owner)
  - Błąd 403 dla worker

### 3.3 Testy bazy danych

#### Funkcje PostgreSQL
- `generate_equipment_id()`
  - Generowanie ID w formacie EQ-YYYY-NNNNN
  - Sekwencyjne numerowanie w ramach roku
  - Thread-safety (równoczesne wywołania)
  - Reset licznika w nowym roku
- `is_owner()`
  - Zwrócenie true dla owner
  - Zwrócenie false dla worker
- `get_current_user_role()`
  - Zwrócenie prawidłowej roli zalogowanego użytkownika
- `create_profile_for_new_user()`
  - Automatyczne tworzenie profilu po rejestracji
  - Domyślna rola worker

#### Triggery
- `trigger_equipment_updated_at`
  - Automatyczna aktualizacja updated_at przy UPDATE
- `trigger_set_equipment_id`
  - Automatyczne ustawienie equipment_id przed INSERT
- `trigger_service_entries_updated_at`
  - Automatyczna aktualizacja updated_at przy UPDATE
- `trigger_profiles_updated_at`
  - Automatyczna aktualizacja updated_at przy UPDATE
- `trigger_create_profile_after_signup`
  - Automatyczne utworzenie profilu po INSERT w auth.users

#### Row Level Security (RLS)
**Tabela profiles:**
- Owner ma pełny dostęp do wszystkich profili
- Worker może czytać własny profil
- Worker może aktualizować własne dane (bez zmiany roli)
- Worker nie może usuwać profili

**Tabela equipment:**
- Zalogowani użytkownicy mogą czytać sprzęt
- Zalogowani użytkownicy mogą dodawać sprzęt
- Zalogowani użytkownicy mogą aktualizować sprzęt
- Tylko owner może usuwać sprzęt

**Tabela service_entries:**
- Zalogowani użytkownicy mogą czytać wpisy
- Zalogowani użytkownicy mogą dodawać wpisy
- Zalogowani użytkownicy mogą aktualizować wpisy
- Tylko owner może usuwać wpisy

**Tabela equipment_counter:**
- Całkowicie ukryta przed użytkownikami (false)
- Dostęp tylko przez funkcje SECURITY DEFINER

#### Integralność referencyjna
- Kaskadowe usuwanie:
  - auth.users → profiles (CASCADE)
  - equipment → service_entries (CASCADE)
- Ograniczenia RESTRICT:
  - profiles → service_entries.performer_id (nie można usunąć użytkownika z wpisami)
- Unikalność:
  - equipment.equipment_id (UNIQUE)
  - equipment.serial_number (UNIQUE)

### 3.4 Testy E2E (End-to-End) - Playwright

**Status**: ✅ **Częściowo zaimplementowane** (od 2026-01-25)  
**Framework**: Playwright 1.49.0  
**Konfiguracja**: `playwright.config.ts`  
**Katalog testów**: `e2e/`

**Zaimplementowane**:
- ✅ Konfiguracja Playwright dla trzech przeglądarek (Chromium, Firefox, WebKit)
- ✅ Automatyczne uruchamianie w CI/CD (GitHub Actions)
- ✅ Przykładowy test homepage (`e2e/homepage.spec.ts`)
- ✅ Środowisko integration w CI z sekretami Supabase
- ✅ Zbieranie coverage i raportów testowych

Zgodnie z PRD, wymagany jest minimum 1 test E2E sprawdzający krytyczną ścieżkę użytkownika.

#### Test E2E krytycznej ścieżki (US-014)
**Status**: 🔜 Do zaimplementowania  
**Scenariusz**: Logowanie → Dodanie sprzętu → Dodanie wpisu serwisowego

```
Krok 1: Przejdź na /login
Krok 2: Zaloguj się jako owner (email/hasło)
Krok 3: Weryfikuj przekierowanie na /equipment
Krok 4: Kliknij "Dodaj sprzęt"
Krok 5: Wypełnij formularz dodawania sprzętu
Krok 6: Zapisz sprzęt
Krok 7: Weryfikuj pojawienie się sprzętu na liście
Krok 8: Kliknij na dodany sprzęt (przejście do szczegółów)
Krok 9: Kliknij "Dodaj wpis serwisowy"
Krok 10: Wypełnij formularz wpisu serwisowego
Krok 11: Zapisz wpis
Krok 12: Weryfikuj pojawienie się wpisu w historii serwisowej
```

#### Dodatkowe testy E2E (rozszerzenie MVP)
- **Autoryzacja ról**:
  - Worker nie widzi opcji usuwania sprzętu
  - Worker nie widzi opcji usuwania wpisów serwisowych
  - Worker nie ma dostępu do zarządzania użytkownikami
- **Wyszukiwanie**:
  - Wyszukiwanie sprzętu po equipment_id
  - Wyświetlenie komunikatu przy braku wyników
- **Filtry i sortowanie**:
  - Filtrowanie po kategorii sprzętu
  - Sortowanie sprzętu po nazwie, dacie, producencie
- **Paginacja**:
  - Przechodzenie między stronami listy sprzętu
  - Poprawne liczby stron i elementów
- **Walidacja formularzy**:
  - Komunikaty błędów przy pustych polach wymaganych
  - Walidacja formatu email
  - Walidacja minimalnej długości pól

### 3.5 Testy wydajnościowe

#### Testy obciążeniowe
**Cel**: Weryfikacja działania aplikacji przy zakładanym obciążeniu MVP (<1000 rekordów, kilku użytkowników)

**Scenariusze**:
- Czas ładowania listy sprzętu (50 elementów)
- Czas ładowania szczegółów sprzętu
- Czas generowania equipment_id przy równoczesnych requestach
- Czas wykonania zapytań z JOIN (equipment + profiles)

**Kryteria akceptacji**:
- Lista sprzętu: < 500ms
- Szczegóły sprzętu: < 300ms
- Generowanie ID: < 200ms
- API endpoints: < 1s dla 95% requestów

#### Testy wydajności bazy danych
- Wydajność indeksów:
  - `idx_equipment_created_at`
  - `idx_service_entries_equipment_timestamp`
  - `idx_service_entries_performer`
- Czas wykonania funkcji `generate_equipment_id()` przy równoczesnych wywołaniach

### 3.6 Testy UI/UX

#### Responsywność
- **Mobile** (<768px):
  - Layout karty zamiast tabeli
  - Hamburger menu
  - Touch-friendly przyciski
- **Tablet** (768px-1024px):
  - Adaptacja layoutu
  - Optymalne wykorzystanie przestrzeni
- **Desktop** (>1024px):
  - Tabele z pełnymi kolumnami
  - Sidebar nawigacji
  - Multi-column layout

#### Dostępność (Accessibility)
- **Keyboard Navigation**:
  - Tab przez wszystkie interaktywne elementy
  - Enter/Space do aktywacji przycisków
  - Escape do zamykania dialogów
- **Screen Reader Support**:
  - Poprawne labele dla inputs (for/id)
  - ARIA attributes dla komponentów (role, aria-label, aria-describedby)
  - ARIA live regions dla dynamicznych komunikatów
- **Kontrasty**:
  - Minimum WCAG AA (4.5:1 dla tekstu)
- **Focus indicators**:
  - Widoczny focus ring dla wszystkich interaktywnych elementów

#### Obsługa błędów
- Komunikaty walidacji inline
- Toasty dla sukcesu/błędów operacji
- Loading states dla asynchronicznych operacji
- Empty states dla pustych list
- Error boundaries dla nieoczekiwanych błędów

### 3.7 Testy bezpieczeństwa

#### Autentykacja
- Brak dostępu do chronionych stron bez sesji
- Przekierowanie na /login przy braku autoryzacji
- Automatyczne odświeżanie tokenu (Supabase refresh token)
- Bezpieczne wylogowanie (usunięcie cookies)

#### Autoryzacja
- Weryfikacja uprawnień owner/worker na poziomie API
- Weryfikacja uprawnień owner/worker na poziomie UI (ukrycie przycisków)
- Weryfikacja RLS na poziomie bazy danych

#### Ochrona przed atakami
- SQL Injection: Supabase chroni automatycznie (parametryzowane zapytania)
- XSS: React chroni automatycznie (escape HTML)
- CSRF: Supabase Auth używa cookies HttpOnly + SameSite

#### Walidacja danych
- Walidacja na poziomie frontend (Zod schemas)
- Walidacja na poziomie API (Zod schemas)
- Ograniczenia na poziomie bazy danych (CHECK constraints)

---

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1 US-001: Logowanie użytkownika

#### Scenariusz 1: Poprawne logowanie
**Warunki początkowe**: Użytkownik nie jest zalogowany, istnieje konto owner@example.com / haslo123
```
Krok 1: Przejdź na /login
Krok 2: Wpisz email: owner@example.com
Krok 3: Wpisz hasło: haslo123
Krok 4: Kliknij "Zaloguj się"
Oczekiwany rezultat:
  - Przekierowanie na /equipment
  - Widoczna nawigacja z opcją wylogowania
  - Brak błędów
```

#### Scenariusz 2: Logowanie z niepoprawnym hasłem
```
Krok 1: Przejdź na /login
Krok 2: Wpisz email: owner@example.com
Krok 3: Wpisz hasło: niepoprawne
Krok 4: Kliknij "Zaloguj się"
Oczekiwany rezultat:
  - Komunikat błędu "Niepoprawne dane logowania"
  - Pozostanie na stronie /login
  - Formularz aktywny do ponownej próby
```

#### Scenariusz 3: Walidacja formatu email
```
Krok 1: Przejdź na /login
Krok 2: Wpisz email: niepoprawny-email
Krok 3: Wpisz hasło: haslo123
Krok 4: Kliknij "Zaloguj się"
Oczekiwany rezultat:
  - Komunikat walidacji "Niepoprawny format email"
  - Formularz nie zostaje wysłany
  - Focus na polu email
```

### 4.2 US-002: Dodanie pracownika (Owner only)

#### Scenariusz 1: Owner dodaje nowego pracownika
**Warunki początkowe**: Zalogowany jako owner
```
Krok 1: Przejdź na /users
Krok 2: Kliknij "Dodaj użytkownika"
Krok 3: Wypełnij formularz:
  - Email: worker@example.com
  - Hasło: haslo123456
  - Imię: Jan Kowalski
Krok 4: Kliknij "Zapisz"
Oczekiwany rezultat:
  - Toast sukcesu "Użytkownik został dodany"
  - Nowy użytkownik pojawia się na liście
  - Rola: worker
  - Dialog zamyka się
```

#### Scenariusz 2: Worker próbuje dostać się do zarządzania użytkownikami
**Warunki początkowe**: Zalogowany jako worker
```
Krok 1: Próba przejścia na /users przez URL
Oczekiwany rezultat:
  - Przekierowanie na /equipment lub komunikat błędu 403
  - W nawigacji brak opcji "Użytkownicy"
```

#### Scenariusz 3: Próba dodania użytkownika z istniejącym emailem
```
Krok 1: Przejdź na /users (jako owner)
Krok 2: Kliknij "Dodaj użytkownika"
Krok 3: Wypełnij formularz z emailem już istniejącym
Krok 4: Kliknij "Zapisz"
Oczekiwany rezultat:
  - Komunikat błędu "Email już istnieje" (409 Conflict)
  - Formularz pozostaje otwarty
  - Focus na polu email
```

### 4.3 US-004: Dodanie sprzętu

#### Scenariusz 1: Dodanie sprzętu z wszystkimi polami
**Warunki początkowe**: Zalogowany jako owner lub worker
```
Krok 1: Przejdź na /equipment
Krok 2: Kliknij "Dodaj sprzęt"
Krok 3: Wypełnij formularz:
  - Nazwa: Laptop Dell
  - Kategoria: Computer
  - Producent: Dell
  - Model: Latitude 5520
  - Numer seryjny: SN123456789
  - Opis: Laptop służbowy
  - Lokalizacja: Biuro 1
  - Data zakupu: 2024-01-15
Krok 4: Kliknij "Zapisz"
Oczekiwany rezultat:
  - Toast sukcesu "Sprzęt został dodany"
  - Automatycznie wygenerowane ID (np. EQ-2024-00001)
  - Przekierowanie do szczegółów sprzętu
  - Wszystkie dane widoczne poprawnie
```

#### Scenariusz 2: Dodanie sprzętu tylko z polami wymaganymi
```
Krok 1: Przejdź na /equipment
Krok 2: Kliknij "Dodaj sprzęt"
Krok 3: Wypełnij tylko pola wymagane:
  - Nazwa: Drukarka HP
  - Kategoria: Printer
  - Producent: HP
  - Model: LaserJet Pro
  - Numer seryjny: SN987654321
Krok 4: Kliknij "Zapisz"
Oczekiwany rezultat:
  - Sprzęt zostaje dodany pomyślnie
  - Pola opcjonalne mają wartość null
  - Automatyczne ID wygenerowane
```

#### Scenariusz 3: Walidacja pól wymaganych
```
Krok 1: Przejdź na /equipment
Krok 2: Kliknij "Dodaj sprzęt"
Krok 3: Pozostaw pola wymagane puste
Krok 4: Kliknij "Zapisz"
Oczekiwany rezultat:
  - Komunikaty walidacji dla wszystkich wymaganych pól
  - Formularz nie zostaje wysłany
  - Focus na pierwszym błędnym polu
```

#### Scenariusz 4: Unikalność numeru seryjnego
```
Krok 1: Dodaj sprzęt z numerem seryjnym SN111
Krok 2: Próba dodania kolejnego sprzętu z SN111
Oczekiwany rezultat:
  - Komunikat błędu "Numer seryjny już istnieje" (409 Conflict)
  - Formularz pozostaje otwarty
  - Focus na polu "Numer seryjny"
```

### 4.4 US-009: Dodanie wpisu serwisowego

#### Scenariusz 1: Dodanie wpisu z domyślną datą/godziną
**Warunki początkowe**: Zalogowany jako owner lub worker, otwarta karta sprzętu
```
Krok 1: W szczegółach sprzętu kliknij "Dodaj wpis"
Krok 2: Wypełnij formularz:
  - Typ operacji: Przegląd
  - Opis: Standardowy przegląd roczny
  (data i godzina domyślnie ustawione na NOW)
Krok 3: Kliknij "Zapisz"
Oczekiwany rezultat:
  - Toast sukcesu "Wpis został dodany"
  - Wpis pojawia się na górze listy historii
  - Data/godzina to aktualna (NOW)
  - Wykonawca to zalogowany użytkownik
```

#### Scenariusz 2: Dodanie wpisu z edytowaną datą/godziną
```
Krok 1: W szczegółach sprzętu kliknij "Dodaj wpis"
Krok 2: Wypełnij formularz:
  - Data: 2024-01-10
  - Godzina: 14:30
  - Typ operacji: Naprawa
  - Opis: Wymiana dysku twardego
Krok 3: Kliknij "Zapisz"
Oczekiwany rezultat:
  - Wpis zapisany z podaną datą i godziną
  - Wpis widoczny w chronologicznej kolejności
```

#### Scenariusz 3: Walidacja minimalnej długości opisu
```
Krok 1: W szczegółach sprzętu kliknij "Dodaj wpis"
Krok 2: Wypełnij formularz:
  - Typ operacji: Konserwacja
  - Opis: "abc" (< 5 znaków)
Krok 3: Kliknij "Zapisz"
Oczekiwany rezultat:
  - Komunikat walidacji "Opis musi mieć minimum 5 znaków"
  - Formularz nie zostaje wysłany
```

### 4.5 US-008: Usunięcie sprzętu (Owner only)

#### Scenariusz 1: Owner usuwa sprzęt
**Warunki początkowe**: Zalogowany jako owner, sprzęt z ID EQ-2024-00001 istnieje
```
Krok 1: Przejdź do szczegółów sprzętu EQ-2024-00001
Krok 2: Kliknij opcję "Usuń sprzęt"
Krok 3: Potwierdź usunięcie w dialogu
Oczekiwany rezultat:
  - Toast sukcesu "Sprzęt został usunięty"
  - Przekierowanie na /equipment
  - Sprzęt znika z listy
  - Powiązane wpisy serwisowe również usunięte (CASCADE)
```

#### Scenariusz 2: Worker nie widzi opcji usuwania
**Warunki początkowe**: Zalogowany jako worker
```
Krok 1: Przejdź do szczegółów dowolnego sprzętu
Oczekiwany rezultat:
  - Brak przycisku/opcji "Usuń sprzęt"
  - Próba bezpośredniego wywołania DELETE /api/equipment/{id} zwraca 403
```

### 4.6 US-013: Autoryzacja ról

#### Scenariusz 1: Weryfikacja uprawnień Owner
**Warunki początkowe**: Zalogowany jako owner
```
Krok 1: Sprawdź dostępne opcje w nawigacji
Oczekiwany rezultat:
  - Widoczne: Sprzęt, Użytkownicy, Wyloguj
Krok 2: Sprawdź opcje w szczegółach sprzętu
Oczekiwany rezultat:
  - Widoczne: Edytuj, Usuń
Krok 3: Sprawdź opcje w wpisie serwisowym
Oczekiwany rezultat:
  - Widoczne: Edytuj, Usuń
```

#### Scenariusz 2: Weryfikacja uprawnień Worker
**Warunki początkowe**: Zalogowany jako worker
```
Krok 1: Sprawdź dostępne opcje w nawigacji
Oczekiwany rezultat:
  - Widoczne: Sprzęt, Wyloguj
  - Niewidoczne: Użytkownicy
Krok 2: Sprawdź opcje w szczegółach sprzętu
Oczekiwany rezultat:
  - Widoczne: Edytuj
  - Niewidoczne: Usuń
Krok 3: Sprawdź opcje w wpisie serwisowym
Oczekiwany rezultat:
  - Widoczne: Edytuj
  - Niewidoczne: Usuń
```

#### Scenariusz 3: Próba wykonania akcji Owner przez Worker (API)
```
Krok 1: Zaloguj się jako worker
Krok 2: Wyślij DELETE /api/equipment/{id}
Oczekiwany rezultat: 403 Forbidden
Krok 3: Wyślij DELETE /api/service-entries/{id}
Oczekiwany rezultat: 403 Forbidden
Krok 4: Wyślij GET /api/users
Oczekiwany rezultat: 403 Forbidden
Krok 5: Wyślij POST /api/users
Oczekiwany rezultat: 403 Forbidden
```

---

## 5. Środowisko testowe

### 5.1 Local Development

#### Konfiguracja
```bash
# 1. Uruchom lokalny Supabase
npm run db:start

# 2. Zastosuj migracje
npm run db:reset

# 3. Załaduj dane testowe (opcjonalnie)
# Plik: supabase/quick-test-data.sql

# 4. Uruchom aplikację
npm run dev
```

#### Dane testowe
**Owner Account:**
- Email: owner@test.com
- Hasło: ownerpass123
- Role: owner

**Worker Account:**
- Email: worker@test.com
- Hasło: workerpass123
- Role: worker

**Sprzęt testowy (3-5 pozycji):**
- EQ-2024-00001: Laptop Dell Latitude 5520
- EQ-2024-00002: Drukarka HP LaserJet Pro
- EQ-2024-00003: Monitor Samsung 27"

**Wpisy serwisowe (5-10 pozycji):**
- Różne typy: inspection, repair, maintenance
- Różni wykonawcy: owner i worker
- Różne daty

### 5.2 CI/CD (GitHub Actions)

**Status**: ✅ **Zaimplementowane** (od 2026-01-25)

#### Workflow Pull Request CI

Workflow `.github/workflows/pull-request.yml` działa na każdy pull request do brancha `master`.

**Pipeline wykonuje następujące kroki**:

1. **Lint** - Sprawdzanie jakości kodu za pomocą ESLint
2. **Unit Tests** (równolegle po lincie) - Testy jednostkowe z coverage
3. **E2E Tests** (równolegle po lincie) - Testy Playwright w środowisku integration
4. **Status Comment** - Komentarz do PR z podsumowaniem wyników

**Konfiguracja**:

```yaml
name: Pull Request CI

on:
  pull_request:
    branches:
      - master

jobs:
  lint:
    name: Lint Code
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  unit-test:
    name: Unit Tests
    needs: lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:run -- --coverage
      - uses: actions/upload-artifact@v6
        with:
          name: unit-coverage
          path: coverage/

  e2e-test:
    name: E2E Tests
    needs: lint
    runs-on: ubuntu-latest
    environment: integration
    env:
      PUBLIC_SUPABASE_URL: ${{ secrets.PUBLIC_SUPABASE_URL }}
      PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.PUBLIC_SUPABASE_ANON_KEY }}
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e -- --coverage
      - uses: actions/upload-artifact@v6
        if: always()
        with:
          name: e2e-coverage
          path: coverage-e2e/
      - uses: actions/upload-artifact@v6
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  status-comment:
    name: Status Comment
    needs: [lint, unit-test, e2e-test]
    if: always()
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    steps:
      - uses: actions/download-artifact@v7
        continue-on-error: true
        with:
          name: unit-coverage
      - uses: actions/download-artifact@v7
        continue-on-error: true
        with:
          name: e2e-coverage
      - uses: actions/github-script@v8
        with:
          script: |
            # Tworzy lub aktualizuje komentarz w PR z wynikami wszystkich jobów
```

**Wymagane sekrety GitHub**:
- `PUBLIC_SUPABASE_URL` - URL projektu Supabase dla testów integracyjnych
- `PUBLIC_SUPABASE_ANON_KEY` - Klucz anon dla Supabase

**Artefakty** (przechowywane przez 7 dni):
- Coverage z testów jednostkowych
- Coverage z testów E2E
- Raporty Playwright

**Dokumentacja**: `.github/workflows/README.md`

### 5.3 Staging (opcjonalnie)

#### Konfiguracja
- Osobna instancja Supabase (staging project)
- Deployment na DigitalOcean (osobny droplet lub app)
- Dane testowe oddzielone od produkcji
- Automatyczny deployment po merge do branch `develop`

---

## 6. Narzędzia do testowania

### 6.1 Testy jednostkowe
**Vitest** ✅ **Zaimplementowane**
- Wersja: 4.0.18
- Konfiguracja: `vitest.config.ts`
- Uruchomienie: `npm run test` (watch mode)
- Uruchomienie jednorazowe: `npm run test:run` (CI)
- Tryb UI: `npm run test:ui`

**Lokalizacja testów**: Testy umieszczone obok testowanego kodu z rozszerzeniem `.test.ts`

**Przykładowa struktura plików testów**:
```
src/
└── lib/
    └── schemas/
        ├── equipment.schema.ts         # Schemat walidacji
        ├── equipment.schema.test.ts    # ✅ Testy jednostkowe (24 testy)
        ├── service-entry.schema.ts     # Schemat walidacji
        ├── service-entry.schema.test.ts # 🔜 Do zaimplementowania
        ├── user.schema.ts              # Schemat walidacji
        └── user.schema.test.ts         # 🔜 Do zaimplementowania
```

### 6.2 Testy E2E
**Playwright** ✅ **Częściowo zaimplementowane** (od 2026-01-25)
- Wersja: 1.49.0
- Przeglądarki: Chromium, Firefox, WebKit
- Konfiguracja: `playwright.config.ts` ✅
- Coverage provider: @vitest/coverage-v8 4.0.18 ✅
- Uruchomienie: `npm run test:e2e`
- Uruchomienie headed: `npx playwright test --headed`
- Tryb UI: `npx playwright test --ui`
- Debug: `npx playwright test --debug`
- Raport: `npx playwright show-report`

**Lokalizacja testów**: `e2e/` ✅

**Struktura plików testów**:
```
e2e/
├── README.md                    # ✅ Dokumentacja testów E2E
├── homepage.spec.ts             # ✅ Przykładowy test
├── auth/                        # 🔜 Do zaimplementowania
│   ├── login.spec.ts
│   └── logout.spec.ts
├── equipment/                   # 🔜 Do zaimplementowania
│   ├── list.spec.ts
│   ├── create.spec.ts
│   ├── edit.spec.ts
│   └── delete.spec.ts
├── service-entries/             # 🔜 Do zaimplementowania
│   ├── create.spec.ts
│   ├── edit.spec.ts
│   └── delete.spec.ts
├── users/                       # 🔜 Do zaimplementowania
│   ├── list.spec.ts
│   └── manage.spec.ts
└── critical-path.spec.ts        # 🔜 Test krytycznej ścieżki (US-014)
```

**Fixtures i helpers**:
```
e2e/
├── fixtures/                    # 🔜 Do zaimplementowania
│   ├── test-data.ts
│   └── auth-helpers.ts
```

### 6.3 Code Coverage
**@vitest/coverage-v8** ✅ **Zaimplementowane** (od 2026-01-25)
- Wersja: 4.0.18
- Provider: v8 (wbudowany w Node.js)
- Konfiguracja: `vitest.config.ts` ✅
- Reporters: text, json, html, lcov

**Uruchomienie**:
```bash
# Coverage z testów jednostkowych
npm run test:run -- --coverage

# W CI/CD coverage zbierany automatycznie
```

**Wykluczenia z coverage**:
- `node_modules/`
- `dist/`
- `.astro/`
- `**/*.config.{js,ts,mjs}`
- `**/*.d.ts`
- `**/types.ts`

**Artefakty CI/CD**:
- Coverage z testów jednostkowych: `coverage/`
- Coverage z testów E2E: `coverage-e2e/`
- Przechowywane przez 7 dni w GitHub Actions

### 6.4 Testy API
**Narzędzia**:
- **Postman/Insomnia**: Manualne testowanie API
- **Playwright API testing**: Automatyczne testy API w ramach E2E
- **curl/HTTPie**: Quick checks z CLI

**Kolekcje Postman/Insomnia**:
- Folder: `.ai/api-collection.json` (do utworzenia)
- Zmienne środowiskowe: local, staging, production

### 6.5 Testy bazy danych
**pgTAP** (opcjonalnie dla zaawansowanych testów)
- Testy funkcji PostgreSQL
- Testy RLS policies
- Testy integralności

**Supabase Studio**
- Manualne testowanie SQL
- Podgląd danych
- Debugowanie RLS

### 6.6 Testy wydajnościowe
**Lighthouse** (wbudowany w Chrome DevTools)
- Performance score
- Accessibility score
- Best practices
- SEO

**Supabase Dashboard**
- Query performance
- Indeksy
- Database size

### 6.5 Linting i code quality
**ESLint**
- Konfiguracja: `eslint.config.js`
- Uruchomienie: `npm run lint`
- Auto-fix: `npm run lint:fix`

**Prettier**
- Formatowanie kodu
- Uruchomienie: `npm run format`

**TypeScript**
- Sprawdzanie typów: `npx tsc --noEmit`

### 6.6 Accessibility testing
**axe DevTools** (Chrome Extension)
- Automatyczne skanowanie WCAG
- Raportowanie problemów accessibility

**NVDA/JAWS** (Screen readers)
- Manualne testowanie z czytnikiem ekranu

**Keyboard-only navigation**
- Manualne testowanie bez myszy

---

## 7. Harmonogram testów

### 7.1 Faza 1: Przygotowanie (1 dzień)
- Konfiguracja Playwright
- Utworzenie danych testowych (seed data)
- Przygotowanie środowiska CI/CD
- Dokumentacja narzędzi

### 7.2 Faza 2: Implementacja testów podstawowych (2-3 dni)
- Test krytycznej ścieżki (US-014) - **PRIORYTET 1**
- Testy autentykacji (login/logout)
- Testy podstawowych operacji CRUD sprzętu
- Testy podstawowych operacji CRUD wpisów serwisowych

### 7.3 Faza 3: Implementacja testów autoryzacji (1-2 dni)
- Testy uprawnień Owner vs Worker
- Testy RLS na poziomie API
- Weryfikacja ukrywania UI dla Worker

### 7.4 Faza 4: Implementacja testów rozszerzonych (2-3 dni)
- Testy zarządzania użytkownikami
- Testy filtrowania i sortowania
- Testy paginacji
- Testy wyszukiwania
- Testy walidacji formularzy

### 7.5 Faza 5: Testy nie-funkcjonalne (1-2 dni)
- Testy responsywności (mobile/tablet/desktop)
- Testy accessibility
- Testy wydajnościowe (Lighthouse)
- Testy bezpieczeństwa

### 7.6 Faza 6: Testy regresji i stabilizacja (1 dzień)
- Uruchomienie pełnego zestawu testów
- Naprawa błędów
- Dokumentacja wyników

### 7.7 Utrzymanie i ciągłe testowanie
- Testy automatyczne w CI/CD przy każdym PR
- Testy regresji przed wdrożeniem
- Monitoring pokrycia testami (coverage)

**Szacowany całkowity czas**: 8-12 dni roboczych (w trybie AI-driven development może być szybciej)

---

## 8. Kryteria akceptacji testów

### 8.1 Kryteria funkcjonalne
✅ **Wszystkie historyjki użytkowników (US-001 do US-014) są pokryte testami**
- Każda historyjka ma minimum 1 test pozytywny (happy path)
- Kluczowe historyjki mają testy negatywne (edge cases, błędy)

✅ **Test krytycznej ścieżki (US-014) przechodzi pomyślnie**
- Logowanie → Dodanie sprzętu → Dodanie wpisu serwisowego

✅ **Wszystkie endpointy API są przetestowane**
- Status codes (200, 201, 400, 401, 403, 404, 409, 500)
- Response body structure
- Walidacja danych wejściowych

✅ **RLS działa poprawnie**
- Owner ma pełny dostęp
- Worker ma ograniczony dostęp
- equipment_counter jest ukryta

### 8.2 Kryteria bezpieczeństwa
✅ **Autentykacja działa poprawnie**
- Brak dostępu bez sesji
- Przekierowanie na /login
- Bezpieczne cookies (HttpOnly, SameSite)

✅ **Autoryzacja jest egzekwowana**
- Na poziomie UI (ukrywanie przycisków)
- Na poziomie API (403 dla nieuprawnionych)
- Na poziomie bazy danych (RLS)

✅ **Walidacja danych na wszystkich poziomach**
- Frontend (Zod)
- API (Zod)
- Database (CHECK constraints)

### 8.3 Kryteria wydajności
✅ **Czasy odpowiedzi API w akceptowalnym zakresie**
- Lista sprzętu: < 500ms
- Szczegóły sprzętu: < 300ms
- Generowanie ID: < 200ms

✅ **Lighthouse scores**
- Performance: > 80
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

### 8.4 Kryteria dostępności
✅ **Keyboard navigation działa**
- Tab przez wszystkie interaktywne elementy
- Enter/Space do aktywacji
- Escape do zamykania dialogów

✅ **Screen reader support**
- Wszystkie inputs mają labels
- ARIA attributes gdzie potrzebne
- ARIA live regions dla komunikatów

✅ **Kontrasty spełniają WCAG AA**
- Minimum 4.5:1 dla tekstu

### 8.5 Kryteria CI/CD
✅ **Pipeline działa poprawnie**
- Build aplikacji przechodzi
- Testy E2E przechodzą
- Artefakty są generowane

✅ **Testy są stabilne**
- Brak flakinness (<5% niepowodzeń)
- Powtarzalne wyniki

### 8.6 Kryteria dokumentacji
✅ **README jest aktualne**
- Instrukcje uruchomienia testów
- Dokumentacja narzędzi
- Przykłady użycia

✅ **Testy są czytelne i utrzymywalne**
- Opisowe nazwy testów
- Komentarze dla złożonych scenariuszy
- Reusable test utilities

---

## 9. Role i odpowiedzialności w procesie testowania

### 9.1 AI Agent (główny executor)
**Odpowiedzialności**:
- Implementacja testów automatycznych (Playwright)
- Generowanie danych testowych
- Konfiguracja CI/CD
- Debugowanie błędów wykrytych przez testy
- Raportowanie wyników testów

### 9.2 Developer (projektant/nadzorca)
**Odpowiedzialności**:
- Review testów generowanych przez AI
- Definiowanie strategii testowania
- Priorytetyzacja obszarów testowych
- Manualne testy eksploracyjne
- Akceptacja wyników testów
- Decyzja o gotowości do deployment

### 9.3 Podział odpowiedzialności według typów testów

| Typ testu | AI Agent | Developer |
|-----------|----------|-----------|
| Testy E2E | Implementacja | Review i uruchomienie manualne |
| Testy API | Implementacja | Weryfikacja pokrycia |
| Testy RLS | Implementacja | Weryfikacja scenariuszy |
| Testy UI/UX | Częściowa automatyzacja | Manualne testy responsywności |
| Testy accessibility | Automatyczne (axe) | Manualne (screen reader) |
| Testy wydajności | Automatyczne (Lighthouse) | Interpretacja wyników |
| Testy bezpieczeństwa | Automatyczne (podstawowe) | Manualna weryfikacja (penetration) |

---

## 10. Procedury raportowania błędów

### 10.1 Format raportu błędu

Każdy znaleziony błąd powinien być zgłoszony w następującym formacie:

```markdown
## [SEVERITY] Tytuł błędu

**ID**: BUG-YYYY-MM-DD-NNN
**Priorytet**: Krytyczny / Wysoki / Średni / Niski
**Severity**: Blocker / Major / Minor / Trivial
**Moduł**: Auth / Equipment / Service Entries / Users / Database / UI
**Środowisko**: Local / CI/CD / Staging / Production

### Opis
[Krótki, jasny opis problemu]

### Kroki do reprodukcji
1. Krok 1
2. Krok 2
3. Krok 3

### Oczekiwany rezultat
[Co powinno się stać]

### Aktualny rezultat
[Co się faktycznie dzieje]

### Screenshoty/Logi
[Załącz screenshoty, logi konsoli, network logs]

### Środowisko
- OS: [np. Ubuntu 22.04]
- Przeglądarka: [np. Chrome 120]
- Wersja aplikacji: [commit hash lub branch]
- Baza danych: [Supabase local/remote]

### Dodatkowe informacje
[Workarounds, powiązane błędy, itp.]
```

### 10.2 Priorytety błędów

#### Krytyczny (Blocker)
- **Definicja**: Aplikacja nie działa, brak workaround, blokuje dalsze testowanie
- **Przykłady**:
  - Nie można się zalogować
  - Crash aplikacji
  - Utrata danych
  - RLS nie działa (breach bezpieczeństwa)
- **SLA**: Naprawa natychmiastowa, wstrzymanie deployment

#### Wysoki (Major)
- **Definicja**: Główna funkcjonalność nie działa, jest workaround
- **Przykłady**:
  - Nie można dodać sprzętu
  - Błąd w generowaniu equipment_id
  - Paginacja nie działa
  - Worker może usuwać sprzęt
- **SLA**: Naprawa priorytetowa, przed deployment

#### Średni (Minor)
- **Definicja**: Funkcjonalność działa z ograniczeniami, minor issue
- **Przykłady**:
  - Błąd w sortowaniu
  - Brak walidacji w jednym polu
  - Tooltip nie pokazuje się poprawnie
  - Loading spinner nie pojawia się
- **SLA**: Naprawa w najbliższym sprincie

#### Niski (Trivial)
- **Definicja**: Kosmetyczne błędy, nie wpływa na funkcjonalność
- **Przykłady**:
  - Literówki
  - Niewielkie problemy z layoutem
  - Sugestie UX
  - Brakujące hover states
- **SLA**: Naprawa gdy jest czas, może poczekać

### 10.3 Proces zgłaszania błędów

#### Lokalizacja zgłoszeń
- **GitHub Issues**: Dla błędów znalezionych w kodzie
- **Dokument `.ai/bugs-log.md`**: Dla błędów znalezionych podczas AI-driven development

#### Workflow
```
1. Znaleziono błąd podczas testów
   ↓
2. Sprawdź czy błąd nie był już zgłoszony
   ↓
3. Wypełnij szablon raportu błędu
   ↓
4. Przypisz priorytet i severity
   ↓
5. Zgłoś jako GitHub Issue lub zapisz w .ai/bugs-log.md
   ↓
6. Powiadom zespół (jeśli krytyczny)
   ↓
7. Developer/AI naprawia błąd
   ↓
8. Weryfikacja naprawy przez testowanie
   ↓
9. Zamknięcie zgłoszenia
```

### 10.4 Labeling w GitHub Issues

Używaj następujących labels:

**Typ**:
- `bug` - Błąd w kodzie
- `test-failure` - Test nie przechodzi
- `flaky-test` - Test niestabilny

**Priorytet**:
- `priority: critical` - Krytyczny
- `priority: high` - Wysoki
- `priority: medium` - Średni
- `priority: low` - Niski

**Moduł**:
- `module: auth`
- `module: equipment`
- `module: service-entries`
- `module: users`
- `module: database`
- `module: ui`

**Środowisko**:
- `env: local`
- `env: ci`
- `env: staging`
- `env: production`

### 10.5 Metryki błędów

Śledź następujące metryki:

| Metryka | Cel |
|---------|-----|
| Liczba otwartych błędów | < 10 (przed deployment) |
| Liczba krytycznych błędów | 0 (przed deployment) |
| Średni czas naprawy (Critical) | < 4 godziny |
| Średni czas naprawy (High) | < 1 dzień |
| Średni czas naprawy (Medium) | < 3 dni |
| Liczba błędów znalezionych w produkcji | < 2 (w pierwszym miesiącu) |
| Pokrycie testami | > 80% (critical paths) |

---

## 11. Podsumowanie i następne kroki

### 11.1 Podsumowanie planu testów

Ten plan testów definiuje kompleksową strategię testowania aplikacji ServiceRegistry, obejmującą:

✅ **7 typów testów**: Unit (✅ częściowo zaimplementowane), API Integration (🔜), Database (🔜), E2E (🔜), Performance (🔜), UI/UX (🔜), Security (🔜)  
✅ **14 historyjek użytkowników**: Wszystkie US z PRD pokryte testami  
✅ **4 główne moduły**: Auth, Users, Equipment, Service Entries  
✅ **3 środowiska testowe**: Local, CI/CD, Staging (opcjonalnie)  
✅ **Harmonogram 8-12 dni**: Realistyczny timeline dla AI-driven development  
✅ **Jasne kryteria akceptacji**: Mierzalne cele dla każdego typu testów  
✅ **Procedury raportowania**: Strukturyzowany proces zgłaszania i trackowania błędów  

### Status implementacji (2026-01-25)

✅ **Testy jednostkowe**: Zaimplementowane dla schematów walidacji Equipment
- Framework: Vitest 4.0.18
- Coverage provider: @vitest/coverage-v8 4.0.18
- Lokalizacja: `src/lib/schemas/equipment.schema.test.ts`
- Pokrycie: 24 testy sprawdzające walidację danych sprzętu
- Status: Wszystkie testy przechodzą (24/24)

✅ **Testy E2E - Infrastruktura**: Podstawowa konfiguracja gotowa
- Framework: Playwright 1.49.0
- Konfiguracja: `playwright.config.ts`
- Przeglądarki: Chromium, Firefox, WebKit
- Lokalizacja: `e2e/`
- Status: Przykładowy test homepage zaimplementowany
- Dokumentacja: `e2e/README.md`

✅ **CI/CD Pipeline**: GitHub Actions workflow zaimplementowany
- Workflow: `.github/workflows/pull-request.yml`
- Jobs: Lint → (Unit Tests + E2E Tests równolegle) → Status Comment
- Artefakty: Coverage (unit + e2e), raporty Playwright (7 dni retencji)
- Środowisko: integration z sekretami Supabase
- Dokumentacja: `.github/workflows/README.md`

🔜 **Następne kroki**: 
1. ✅ ~~Setup Playwright dla testów E2E~~ **DONE**
2. ✅ ~~Konfiguracja CI/CD pipeline~~ **DONE**
3. Implementacja testu krytycznej ścieżki (US-014)
4. Rozszerzenie testów jednostkowych na pozostałe schematy
5. Dodanie testów E2E dla kluczowych funkcjonalności  

### 11.2 Priorytety implementacji testów

**✅ ZAIMPLEMENTOWANE**:
1. ✅ **Testy jednostkowe - Schematy walidacji Equipment** (2026-01-25)
   - 24 testy dla `equipment.schema.ts`
   - Pokrycie walidacji: createEquipment, updateEquipment, listParams, categoryEnum
   - Wszystkie testy przechodzą
2. ✅ **Infrastruktura E2E - Playwright** (2026-01-25)
   - Konfiguracja Playwright dla 3 przeglądarek
   - Coverage provider (@vitest/coverage-v8)
   - Przykładowy test homepage
   - Dokumentacja w `e2e/README.md`
3. ✅ **CI/CD Pipeline - GitHub Actions** (2026-01-25)
   - Workflow `.github/workflows/pull-request.yml`
   - Lint → (Unit Tests + E2E Tests) → Status Comment
   - Artefakty: coverage + raporty Playwright
   - Środowisko integration z sekretami Supabase

**MUST HAVE (MVP)**:
4. 🔜 Test krytycznej ścieżki E2E (US-014) - **NAJWYŻSZY PRIORYTET**
5. 🔜 Testy autentykacji (login/logout)
6. 🔜 Testy autoryzacji ról (owner/worker)
7. 🔜 Testy CRUD sprzętu
8. 🔜 Testy CRUD wpisów serwisowych
9. 🔜 Testy RLS na poziomie bazy danych

**SHOULD HAVE (po MVP)**:
10. 🔜 Testy jednostkowe - pozostałe schematy (service-entry, user, pagination)
11. 🔜 Testy zarządzania użytkownikami
12. 🔜 Testy filtrowania i sortowania
13. 🔜 Testy paginacji i wyszukiwania
14. 🔜 Testy walidacji wszystkich formularzy
15. 🔜 Testy responsywności
16. 🔜 Testy accessibility (podstawowe)

**NICE TO HAVE (rozszerzenie)**:
17. 🔜 Testy wydajnościowe (Lighthouse)
18. 🔜 Testy jednostkowe logiki biznesowej
19. 🔜 Zaawansowane testy accessibility (screen reader)
20. 🔜 Testy bezpieczeństwa (penetration testing)
21. 🔜 Visual regression testing

### 11.3 Następne kroki

#### ✅ Krok 0: Testy jednostkowe - Schematy walidacji (Zrealizowane - 2026-01-25)
```bash
# ✅ Instalacja Vitest
npm install -D vitest

# ✅ Utworzenie konfiguracji Vitest
vitest.config.ts

# ✅ Implementacja testów dla schematów equipment
src/lib/schemas/equipment.schema.test.ts (24 testy)

# ✅ Dodanie skryptów npm
npm run test / test:run / test:ui
```

**Rezultat**: 24/24 testy przechodzą, brak błędów lintera

#### Krok 1: Setup środowiska E2E (Dzień 1)
```bash
# Instalacja Playwright
npm install -D @playwright/test
npx playwright install

# Utworzenie struktury folderów testów
mkdir -p tests/e2e/{auth,equipment,service-entries,users}
mkdir -p tests/fixtures

# Utworzenie konfiguracji Playwright
npx playwright init

# Przygotowanie danych testowych
# Edycja: supabase/quick-test-data.sql
```

#### Krok 2: Implementacja testu krytycznej ścieżki (Dzień 1-2)
- Utworzenie pliku `tests/e2e/critical-path.spec.ts`
- Implementacja scenariusza US-014
- Uruchomienie i debugowanie
- Weryfikacja przejścia testu

#### Krok 3: Rozszerzenie testów (Dzień 2-5)
- Implementacja testów autentykacji
- Implementacja testów autoryzacji
- Implementacja testów CRUD

#### Krok 4: Konfiguracja CI/CD (Dzień 5-6)
- Utworzenie pliku `.github/workflows/ci.yml`
- Konfiguracja Supabase w CI
- Test pipeline

#### Krok 5: Dokumentacja i stabilizacja (Dzień 6-7)
- Aktualizacja README z instrukcjami testowania
- Naprawa błędów
- Uruchomienie pełnego zestawu testów

### 11.4 Sukces projektu testów

Projekt testów zostanie uznany za sukces, gdy:

✅ Wszystkie testy z kategorii MUST HAVE przechodzą  
✅ CI/CD pipeline działa stabilnie  
✅ Pokrycie testami krytycznych ścieżek > 80%  
✅ Brak krytycznych błędów przed deployment  
✅ Dokumentacja testów jest kompletna i aktualna  
✅ Zespół wie jak uruchomić i dodać nowe testy  

### 11.5 Utrzymanie testów

Po zakończeniu implementacji:

- **Codziennie**: Testy automatyczne w CI/CD przy każdym PR
- **Przed każdym deployment**: Pełny zestaw testów regresji
- **Co sprint**: Review pokrycia testami i dodanie nowych testów
- **Co miesiąc**: Analiza metryki błędów i optymalizacja strategii testowania
- **Przy nowych feature**: Dodanie testów dla nowych funkcjonalności

---

## 12. Załączniki

### 12.1 Odnośniki do dokumentacji projektu
- [PRD - Product Requirements Document](.ai/prd.md)
- [Database Plan](.ai/db-plan.md)
- [API Plan](.ai/api-plan.md)
- [UI Plan](.ai/ui-plan.md)
- [README](../README.md)
- [Database Migrations](../supabase/migrations/README.md)

### 12.2 Odnośniki do narzędzi
- [Playwright Documentation](https://playwright.dev/)
- [Supabase Testing Guide](https://supabase.com/docs/guides/testing)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### 12.3 Przykładowe komendy

```bash
# Uruchomienie testów E2E
npx playwright test

# Uruchomienie testów w trybie UI
npx playwright test --ui

# Uruchomienie konkretnego testu
npx playwright test tests/e2e/critical-path.spec.ts

# Debug mode
npx playwright test --debug

# Generowanie raportu
npx playwright show-report

# Uruchomienie testów w CI (headless)
npx playwright test --reporter=html

# Sprawdzenie lintów
npm run lint

# Build aplikacji
npm run build

# Uruchomienie local Supabase
npm run db:start

# Reset bazy danych z migracjami
npm run db:reset
```

### 12.4 Checklisty testów

#### Checklist przed PR
- [ ] Wszystkie testy E2E przechodzą lokalnie
- [ ] Nie wprowadzono nowych błędów lintingu
- [ ] Kod jest sformatowany (Prettier)
- [ ] Nowe funkcjonalności mają testy
- [ ] Dokumentacja jest zaktualizowana

#### Checklist przed deployment
- [ ] Wszystkie testy w CI przechodzą
- [ ] Brak krytycznych błędów w backlogu
- [ ] Testy manualne wykonane (smoke testing)
- [ ] Lighthouse score > 80 dla wszystkich metryk
- [ ] Testy accessibility przeszły (axe DevTools)
- [ ] README i dokumentacja aktualne
- [ ] Backup bazy danych utworzony

---

**Wersja dokumentu**: 1.1  
**Data utworzenia**: 2026-01-25  
**Ostatnia aktualizacja**: 2026-01-25  
**Autor**: AI Agent (Claude Sonnet 4.5) w ramach AI-driven development  
**Status**: Wersja robocza - częściowo zaimplementowana

**Historia zmian**:
- v1.0 (2026-01-25): Utworzenie kompleksowego planu testów
- v1.1 (2026-01-25): Aktualizacja o rzeczywistą implementację testów jednostkowych (Vitest, 24 testy dla equipment.schema)
