# Dokument wymagań produktu (PRD) - ServiceRegistry

## 1. Przegląd produktu
Cel: Edukacyjny projekt webowy do nauki AI-driven development, umożliwiający rejestrowanie i śledzenie historii serwisowej sprzętu.  
Model: Aplikacja darmowa, open-source (MIT), single-tenant, tylko web.  
Role: Właściciel (pełne uprawnienia), Pracownik (dodawanie/edycja sprzętu i wpisów, bez usuwania, bez zarządzania kontami).  
Stack: Astro 5 + React 19 + TypeScript 5 + Tailwind 4 + Shadcn/ui; Supabase (PostgreSQL, Auth, RLS); CI/CD GitHub Actions; hosting DigitalOcean (basic).  
Tryb pracy: W pełni AI-driven development.  
Testy: ✅ Testy jednostkowe (Vitest 4.0.18) + Testy E2E (Playwright 1.49.0); CI/CD pipeline z automatyzacją testów.  
Scope MVP: Pełna funkcjonalność CRUD, autoryzacja, testy, CI/CD. Bez: QR, Docker Compose, powiadomień, załączników.

## 2. Problem użytkownika
Serwisy mają trudność w utrzymaniu pełnej historii serwisów wielu urządzeń; zapisują tylko poważne uwagi, tracąc kontekst i ciągłość informacji. Potrzebne jest proste narzędzie do kompletnego rejestrowania działań serwisowych dla każdego sprzętu.

## 3. Wymagania funkcjonalne
3.1 Autentykacja i autoryzacja  
- Ekran logowania (email, hasło) oparty o Supabase Auth.  
- Sesje użytkownika, wylogowanie.  
- Role: owner (pełne uprawnienia), worker (dodawanie/edycja sprzętu i wpisów; brak usuwania; brak zarządzania kontami).  
- Zarządzanie użytkownikami (owner): dodawanie i usuwanie pracowników.  

3.2 Zarządzanie sprzętem (CRUD)  
- Dodawanie sprzętu z polami obowiązkowymi: nazwa, kategoria, producent, model, numer seryjny.  
- Pola opcjonalne: opis, lokalizacja, data zakupu.  
- Automatyczne nadawanie unikatowego ID (format EQ-{ROK}-{NUMER}, licznik globalny, 5 cyfr).  
- Lista sprzętu z sortowaniem i paginacją.  
- Szczegóły sprzętu: pełne dane + historia wpisów.  
- Edycja sprzętu (wszystkie pola poza ID).  
- Usuwanie sprzętu: tylko owner; kasuje także powiązane wpisy (cascade).  

3.3 Zarządzanie wpisami serwisowymi (CRUD)  
- Dodawanie wpisu z polami: data (auto, edytowalna), godzina (auto, edytowalna), typ operacji (przegląd/naprawa/konserwacja), opis (min 5 znaków, wymagany), wykonawca (auto z zalogowanego).  
- Lista wpisów chronologicznie (najnowsze na górze) z wizualnym rozróżnieniem typu.  
- Edycja wpisu: zmiana daty/godziny, typu, opisu; wykonawca niezmienialny.  
- Usuwanie wpisu: tylko owner.  

3.4 Wyszukiwanie  
- Wyszukiwanie sprzętu po unikatowym ID z poziomu nawigacji; przekierowanie do karty sprzętu; komunikat gdy brak wyników.  

3.5 Logika biznesowa i bezpieczeństwo danych  
- Auto-generowanie ID sprzętu (EQ-{ROK}-{NUMER}, 5 cyfr, licznik globalny).  
- Audit log w polach metadanych (created_at/by, updated_at/by).  
- RLS w Supabase:  
  - equipment: select/insert/update dla zalogowanych, delete tylko owner.  
  - service_entries: select/insert/update dla zalogowanych, delete tylko owner.  
  - users: select/insert/update/delete tylko owner.  

3.6 CI/CD i testy  
- ✅ GitHub Actions workflow dla pull requestów: Lint → (Unit Tests + E2E Tests równolegle) → Status Comment  
- ✅ Testy jednostkowe (Vitest): Schematy walidacji, logika biznesowa, coverage reporting  
- ✅ Testy E2E (Playwright): Konfiguracja dla 3 przeglądarek (Chromium, Firefox, WebKit)  
- 🔜 Test E2E minimalny (US-014): logowanie → dodanie sprzętu → weryfikacja na liście → karta sprzętu → dodanie wpisu serwisowego → weryfikacja wpisu  
- ✅ Artefakty CI: Coverage reports (unit + e2e), raporty Playwright (7 dni retencji)  
- ✅ Środowisko integration z sekretami Supabase dla testów  

3.7 Dokumentacja  
- ✅ README: instalacja, konfiguracja env, uruchomienie, testy, CI/CD, deployment basic  
- ✅ PRD: niniejszy dokument  
- ✅ Test Plan: `.ai/test-plan.md` - kompleksowy plan testów  
- ✅ Workflows: `.github/workflows/README.md` - dokumentacja CI/CD  
- ✅ E2E Tests: `e2e/README.md` - dokumentacja testów Playwright  
- ✅ Database: `supabase/README.md` - dokumentacja bazy danych i migracji  

## 4. Granice produktu
Wchodzi w MVP: Auth, role owner/worker, CRUD sprzętu, CRUD wpisów serwisowych, wyszukiwanie po ID, auto-ID, RLS, testy jednostkowe (Vitest), infrastruktura E2E (Playwright), CI/CD pipeline, basic deployment na DigitalOcean.  
Nie wchodzi w MVP: Kody QR i wydruk etykiet, Docker Compose/self-host orchestration, powiadomienia, pliki/załączniki, multi-tenancy, aplikacje mobilne, demo online, contributing guidelines.  
Założenia: Single-tenant, web-only, brak trybu offline, brak powiadomień, brak plików.  

## 5. Historyjki użytkowników
US-001 Logowanie  
Opis: Użytkownik chce się zalogować, aby korzystać z aplikacji.  
Kryteria akceptacji: Formularz email/hasło; walidacja; poprawne dane logują i prowadzą do strony ze sprzętem; niepoprawne pokazują błąd; wylogowanie dostępne.

US-002 Dodanie pracownika (owner)  
Opis: Właściciel chce dodać konto pracownika.  
Kryteria akceptacji: Formularz email/hasło/imię; rola automatycznie worker; zapis w bazie; komunikat sukcesu; nowy użytkownik widoczny na liście użytkowników.

US-003 Usunięcie pracownika (owner)  
Opis: Właściciel chce usunąć konto pracownika.  
Kryteria akceptacji: Lista użytkowników; przycisk usuń tylko dla ownera; potwierdzenie; po usunięciu użytkownik traci dostęp.

US-004 Dodanie sprzętu  
Opis: Użytkownik dodaje sprzęt, aby go ewidencjonować.  
Kryteria akceptacji: Wymagane pola (nazwa, kategoria, producent, model, numer seryjny); opcjonalne (opis, lokalizacja, data zakupu); auto-ID nadane; walidacja; komunikat sukcesu; przekierowanie do karty sprzętu.

US-005 Przeglądanie listy sprzętu  
Opis: Użytkownik chce zobaczyć cały inwentarz.  
Kryteria akceptacji: Lista z kolumnami ID, nazwa, producent, model, kategoria, data dodania; sortowanie; paginacja dla >50; kliknięcie prowadzi do karty sprzętu.

US-006 Wyszukiwanie sprzętu po ID  
Opis: Użytkownik szybko odnajduje sprzęt po ID.  
Kryteria akceptacji: Pole wyszukiwania w nawigacji; wpisanie ID i Enter przenosi do karty sprzętu; komunikat gdy brak wyniku.

US-007 Edycja sprzętu  
Opis: Użytkownik aktualizuje dane sprzętu.  
Kryteria akceptacji: Formularz z bieżącymi danymi; edytowalne wszystkie pola poza ID; walidacja; zapis zmian; zapis kto i kiedy edytował.

US-008 Usunięcie sprzętu (owner)  
Opis: Właściciel usuwa sprzęt, aby oczyścić dane.  
Kryteria akceptacji: Przycisk usuń tylko dla ownera; potwierdzenie; usunięcie sprzętu i powiązanych wpisów; powrót do listy.

US-009 Dodanie wpisu serwisowego  
Opis: Użytkownik rejestruje wykonany serwis dla sprzętu.  
Kryteria akceptacji: Pola: data auto edytowalna, godzina auto edytowalna, typ z listy, opis min 5 znaków; wykonawca auto; zapis; wpis widoczny na liście w karcie sprzętu.

US-010 Edycja wpisu serwisowego  
Opis: Użytkownik koryguje lub uzupełnia wpis.  
Kryteria akceptacji: Edycja daty/godziny, typu, opisu; wykonawca niezmienialny; zapis; aktualizacja widoczna na liście.

US-011 Usunięcie wpisu serwisowego (owner)  
Opis: Właściciel usuwa błędny wpis.  
Kryteria akceptacji: Przycisk usuń tylko dla ownera; potwierdzenie; wpis znika z listy.

US-012 Przegląd historii serwisowej  
Opis: Użytkownik przegląda historię prac dla sprzętu.  
Kryteria akceptacji: Lista wpisów chronologicznie, pokazuje datę, godzinę, typ, opis, wykonawcę; wizualne oznaczenie typu; dostępne akcje zgodne z uprawnieniami.

US-013 Autoryzacja ról  
Opis: System egzekwuje uprawnienia owner/worker.  
Kryteria akceptacji: Worker nie widzi akcji usuwania sprzętu/wpisów ani zarządzania użytkownikami; próby wejścia na endpointy administracyjne są blokowane; owner ma pełny dostęp.

US-014 Test E2E ścieżki krytycznej  
Opis: Zweryfikowanie głównego flow użytkownika.  
Kryteria akceptacji: Playwright test przechodzi: logowanie → dodanie sprzętu → weryfikacja na liście → karta sprzętu → dodanie wpisu serwisowego → weryfikacja wpisu.  
Status: ✅ Infrastruktura gotowa (Playwright config, CI/CD), 🔜 Test do zaimplementowania

## 6. Metryki sukcesu
- Funkcjonalne: ✅ Auth działa; ✅ role i uprawnienia działają; ✅ CRUD sprzętu i wpisów działa; ✅ wyszukiwanie po ID działa; ✅ auto-ID działa; ✅ historia serwisowa kompletna.  
- Techniczne: ✅ RLS skonfigurowane i przetestowane; ✅ Testy jednostkowe zaimplementowane (24 testy); ✅ Infrastruktura E2E gotowa; 🔜 Test E2E krytycznej ścieżki; ✅ Pipeline CI/CD działa (lint + unit + e2e + status comment); 🔜 Aplikacja wdrożona na DigitalOcean (basic); ✅ README i PRD kompletne.  
- Edukacyjne: ✅ Ukończone AI-driven development; ✅ praktyka promptowania, iteracji i debugowania kodu AI.  
- Minimalna adopcja: 🔜 Aplikacja działa stabilnie i mogłaby być użyta przez co najmniej jeden serwis w codziennej pracy.  
