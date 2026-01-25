# ServiceRegistry

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Profesjonalna aplikacja webowa do rejestrowania i śledzenia historii serwisowej sprzętu. Projekt edukacyjny stworzony w trybie AI-driven development.

## 📋 Spis treści

- [O projekcie](#-o-projekcie)
- [Funkcjonalności](#-funkcjonalności)
- [Stack technologiczny](#-stack-technologiczny)
- [Wymagania](#-wymagania)
- [Instalacja](#-instalacja)
- [Konfiguracja](#-konfiguracja)
- [Uruchomienie](#-uruchomienie)
- [Struktura projektu](#-struktura-projektu)
- [Baza danych](#-baza-danych)
- [Testowanie](#-testowanie)
- [Dokumentacja](#-dokumentacja)
- [Licencja](#-licencja)

## 🎯 O projekcie

ServiceRegistry to aplikacja webowa przeznaczona dla warsztatów i serwisów technicznych, umożliwiająca kompleksowe zarządzanie inwentarzem sprzętu oraz prowadzenie pełnej historii przeprowadzonych operacji serwisowych.

### Problem

Serwisy mają trudność w utrzymaniu pełnej historii prac wykonanych na wielu urządzeniach. Często zapisują tylko najpoważniejsze uwagi, tracąc kontekst i ciągłość informacji o sprzęcie.

### Rozwiązanie

ServiceRegistry zapewnia proste narzędzie do kompletnego rejestrowania wszystkich działań serwisowych dla każdego sprzętu, z automatycznym generowaniem unikalnych identyfikatorów, pełnym audytem zmian i kontrolą dostępu opartą na rolach.

## ✨ Funkcjonalności

### Autentykacja i autoryzacja
- 🔐 Bezpieczne logowanie oparte o Supabase Auth
- 👥 System ról: **Owner** (pełne uprawnienia) i **Worker** (ograniczone uprawnienia)
- 🔑 Zarządzanie użytkownikami (tylko dla właścicieli)

### Zarządzanie sprzętem
- ➕ Dodawanie sprzętu z pełnym zestawem danych (nazwa, kategoria, producent, model, numer seryjny)
- 🔢 Automatyczne generowanie unikalnych identyfikatorów w formacie `EQ-YYYY-NNNNN`
- 📋 Lista sprzętu z sortowaniem i paginacją
- 🔍 Wyszukiwanie po unikalnym ID
- ✏️ Edycja danych sprzętu
- 🗑️ Usuwanie sprzętu (tylko Owner, z kaskadowym usunięciem wpisów)

### Historia serwisowa
- 📝 Dodawanie wpisów serwisowych z automatyczną datą i godziną
- 🏷️ Trzy typy operacji: przegląd, naprawa, konserwacja
- 👤 Automatyczne przypisanie wykonawcy
- 📊 Chronologiczny przegląd historii dla każdego sprzętu
- ✏️ Edycja wpisów serwisowych
- 🗑️ Usuwanie wpisów (tylko Owner)

### Bezpieczeństwo i audyt
- 🛡️ Row Level Security (RLS) w Supabase
- 📜 Pełny audyt zmian (kto i kiedy utworzył/zmodyfikował)
- 🔒 Bezpieczne generowanie ID przez funkcje SECURITY DEFINER
- 🚫 Kontrola dostępu na poziomie bazy danych

## 🛠️ Stack technologiczny

### Frontend
- **[Astro 5](https://astro.build/)** - Framework do budowy aplikacji webowych
- **[React 19](https://react.dev/)** - Biblioteka UI dla komponentów dynamicznych
- **[TypeScript 5](https://www.typescriptlang.org/)** - Typowany JavaScript
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Framework CSS utility-first
- **[Shadcn/ui](https://ui.shadcn.com/)** - Komponenty UI oparte o Radix UI

### Backend & Database
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service (PostgreSQL, Auth, RLS)
- **[PostgreSQL](https://www.postgresql.org/)** - Relacyjna baza danych

### Narzędzia deweloperskie
- **ESLint** - Linter kodu
- **Prettier** - Formatowanie kodu
- **Husky** - Git hooks
- **TypeScript** - Statyczne typowanie
- **Vitest** - Framework do testów jednostkowych
- **Playwright** - Framework do testów E2E
- **GitHub Actions** - CI/CD pipeline

## 📦 Wymagania

- **Node.js** 20.x lub nowszy
- **npm** 10.x lub nowszy
- **Docker** (do lokalnej instancji Supabase)
- **Git**

## 🚀 Instalacja

### 1. Sklonuj repozytorium

```bash
git clone https://github.com/yourusername/ServiceRegistry.git
cd ServiceRegistry
```

### 2. Zainstaluj zależności

```bash
npm install
```

## ⚙️ Konfiguracja

### 1. Konfiguracja zmiennych środowiskowych

Skopiuj plik `.env.example` do `.env`:

```bash
cp .env.example .env
```

### 2. Uruchom lokalną instancję Supabase

Wymaga Docker Desktop (lub Docker w systemie Linux):

```bash
npm run db:start
```

Po uruchomieniu, w terminalu zobaczysz dane dostępowe, w tym:
- `API URL` - użyj jako `PUBLIC_SUPABASE_URL`
- `anon key` - użyj jako `PUBLIC_SUPABASE_ANON_KEY`

### 3. Uzupełnij plik `.env`

```bash
# Local development
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_ANON_KEY=<twój_local_anon_key_z_terminala>
```

### 4. Zastosuj migracje bazy danych

```bash
npm run db:reset
```

### 5. (Opcjonalnie) Otwórz Supabase Studio

```bash
npm run db:studio
```

Studio będzie dostępne pod adresem: http://localhost:54323

## 🏃 Uruchomienie

### Tryb deweloperski

```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem: http://localhost:3000

### Build produkcyjny

```bash
npm run build
```

### Podgląd buildu produkcyjnego

```bash
npm run preview
```

## 📁 Struktura projektu

```
ServiceRegistry/
├── .ai/                        # Dokumentacja projektowa i plany
│   ├── prd.md                  # Product Requirements Document
│   ├── db-plan.md              # Plan struktury bazy danych
│   ├── test-plan.md            # Plan testów
│   ├── ci-cd-implementation-summary.md  # Implementacja CI/CD
│   └── ...                     # Inne dokumenty techniczne
├── .cursor/                    # Reguły dla AI (Cursor IDE)
├── .github/
│   └── workflows/              # GitHub Actions workflows
│       ├── pull-request.yml    # CI pipeline dla PR
│       └── README.md           # Dokumentacja workflow
├── e2e/                        # Testy E2E (Playwright)
│   ├── homepage.spec.ts        # Przykładowy test
│   └── README.md               # Dokumentacja testów E2E
├── public/                     # Publiczne assety (favicon, itp.)
├── src/
│   ├── components/             # Komponenty UI (Astro i React)
│   │   ├── auth/               # Komponenty autentykacji
│   │   ├── equipment/          # Komponenty zarządzania sprzętem
│   │   ├── ui/                 # Komponenty Shadcn/ui
│   │   └── ...
│   ├── db/                     # Klienty Supabase i typy bazy danych
│   ├── layouts/                # Layouty Astro
│   ├── lib/
│   │   ├── api/                # Klienty API
│   │   ├── constants/          # Stałe (kategorie, role, typy)
│   │   ├── schemas/            # Schematy walidacji Zod (+ testy)
│   │   ├── services/           # Logika biznesowa
│   │   └── utils.ts            # Funkcje pomocnicze
│   ├── middleware/             # Middleware Astro (autentykacja)
│   ├── pages/                  # Strony i endpointy API
│   │   ├── api/                # API routes
│   │   │   ├── auth/           # Endpointy autentykacji
│   │   │   ├── equipment/      # CRUD sprzętu
│   │   │   ├── service-entries/# CRUD wpisów serwisowych
│   │   │   └── users/          # Zarządzanie użytkownikami
│   │   ├── equipment/          # Strony sprzętu
│   │   ├── login.astro         # Strona logowania
│   │   └── ...
│   ├── types.ts                # Typy TypeScript (DTOs, Commands)
│   └── config.ts               # Konfiguracja aplikacji
├── supabase/
│   ├── migrations/             # Migracje bazy danych (10 plików)
│   ├── seed.sql                # Dane startowe
│   ├── config.toml             # Konfiguracja Supabase CLI
│   ├── QUICKSTART.md           # Szybki start z bazą danych
│   ├── EXAMPLES.md             # Przykłady SQL
│   └── README.md               # Dokumentacja bazy danych
├── .env.example                # Przykładowa konfiguracja środowiska
├── astro.config.mjs            # Konfiguracja Astro
├── playwright.config.ts        # Konfiguracja Playwright (E2E)
├── vitest.config.ts            # Konfiguracja Vitest (unit tests + coverage)
├── package.json                # Zależności i skrypty npm
├── tsconfig.json               # Konfiguracja TypeScript
└── README.md                   # Ten plik
```

## 🗄️ Baza danych

### Tabele

| Tabela | Opis | Kluczowe funkcje |
|--------|------|------------------|
| `profiles` | Profile użytkowników i role | 1:1 z auth.users, automatycznie tworzone |
| `equipment` | Inwentarz sprzętu | Auto-generowane ID (EQ-YYYY-NNNNN), audyt |
| `service_entries` | Wpisy serwisowe | Powiązane ze sprzętem, kaskadowe usuwanie |
| `equipment_counter` | Licznik ID sprzętu | Ukryty przez RLS, dostęp tylko przez funkcje |

### Typy ENUM

- **user_role**: `owner`, `worker`
- **equipment_category**: `computer`, `printer`, `monitor`, `network_device`, `phone`, `tablet`, `peripheral`, `other`
- **service_type**: `inspection`, `repair`, `maintenance`

### Funkcje bazodanowe

- `generate_equipment_id()` - Generuje unikalne ID sprzętu w formacie EQ-YYYY-NNNNN
- `is_owner()` - Sprawdza czy użytkownik ma rolę owner
- `get_current_user_role()` - Zwraca rolę zalogowanego użytkownika
- `create_profile_for_new_user()` - Automatycznie tworzy profil przy rejestracji

### Bezpieczeństwo

✅ **Row Level Security (RLS)** na wszystkich tabelach  
✅ **Automatyczny audyt** (created_at/by, updated_at/by)  
✅ **Thread-safe generowanie ID**  
✅ **Kontrola dostępu oparta na rolach**  
✅ **Kaskadowe usuwanie** dla zachowania integralności

Więcej informacji: [supabase/README.md](supabase/README.md)

## 🧪 Testowanie

ServiceRegistry wykorzystuje **Vitest** do testów jednostkowych oraz **Playwright** do testów E2E.

### Aktualny zakres testów

#### Testy jednostkowe (Vitest)
✅ **Schematy walidacji Zod** - `src/lib/schemas/equipment.schema.test.ts`
- 24 testy pokrywające walidację danych sprzętu
- Testy dla `createEquipmentSchema`, `updateEquipmentSchema`, `equipmentListParamsSchema`
- Walidacja pól wymaganych, opcjonalnych, formatów daty, limitów długości
- Walidacja kategorii sprzętu i parametrów paginacji

#### Testy E2E (Playwright)
🔜 **Podstawowa konfiguracja gotowa** - `e2e/`
- Konfiguracja dla trzech przeglądarek (Chromium, Firefox, WebKit)
- Automatyczne uruchamianie w CI/CD
- Zbieranie coverage i raportów testowych

### Uruchamianie testów

#### Testy jednostkowe

```bash
# Tryb watch (automatyczne ponowne uruchamianie przy zmianach)
npm run test

# Jednorazowe uruchomienie (przydatne w CI/CD)
npm run test:run

# Jednorazowe uruchomienie z coverage
npm run test:run -- --coverage

# Interfejs UI z podglądem wyników
npm run test:ui
```

#### Testy E2E

```bash
# Zainstaluj przeglądarki (tylko za pierwszym razem)
npx playwright install --with-deps

# Uruchom testy E2E
npm run test:e2e

# Uruchom testy w trybie headed (widoczna przeglądarka)
npx playwright test --headed

# Uruchom testy dla konkretnej przeglądarki
npx playwright test --project=chromium

# Uruchom testy w trybie debug
npx playwright test --debug

# Zobacz raport z testów
npx playwright show-report
```

### Struktura testów

Testy są umieszczone w tych samych katalogach co testowany kod, z rozszerzeniem `.test.ts`:

```
src/
└── lib/
    └── schemas/
        ├── equipment.schema.ts       # Schemat walidacji
        └── equipment.schema.test.ts  # Testy jednostkowe
```

### Plany rozwoju testów

Zgodnie z [Test Plan](.ai/test-plan.md), planowane są kolejne typy testów:

- 🔜 **Testy E2E (Playwright)** - krytyczne ścieżki użytkownika
- 🔜 **Testy API** - weryfikacja endpointów
- 🔜 **Testy RLS** - bezpieczeństwo na poziomie bazy danych
- 🔜 **Testy accessibility** - wsparcie dla czytników ekranu

Więcej informacji: [.ai/test-plan.md](.ai/test-plan.md)

## 📚 Dokumentacja

### Główne dokumenty
- **[PRD](.ai/prd.md)** - Dokument wymagań produktu
- **[Test Plan](.ai/test-plan.md)** - Kompleksowy plan testów
- **[CI/CD Implementation](.ai/ci-cd-implementation-summary.md)** - Implementacja CI/CD pipeline

### Baza danych
- **[Database README](supabase/README.md)** - Dokumentacja bazy danych
- **[Database Quickstart](supabase/QUICKSTART.md)** - Szybki start z bazą
- **[SQL Examples](supabase/EXAMPLES.md)** - Przykłady zapytań SQL
- **[Migrations README](supabase/migrations/README.md)** - Szczegóły migracji

### CI/CD i Testy
- **[Workflows README](.github/workflows/README.md)** - Dokumentacja GitHub Actions
- **[E2E Tests README](e2e/README.md)** - Dokumentacja testów Playwright

## 🔧 Przydatne komendy

### Zarządzanie bazą danych

```bash
npm run db:start        # Uruchom lokalną instancję Supabase
npm run db:stop         # Zatrzymaj Supabase
npm run db:reset        # Zresetuj bazę i zastosuj migracje
npm run db:status       # Sprawdź status Supabase
npm run db:studio       # Otwórz Supabase Studio
```

### Rozwój aplikacji

```bash
npm run dev             # Tryb deweloperski
npm run build           # Build produkcyjny
npm run preview         # Podgląd buildu
npm run lint            # Sprawdź kod ESLintem
npm run lint:fix        # Napraw problemy ESLint
npm run format          # Formatuj kod Prettier
```

### Testowanie

```bash
npm run test            # Uruchom testy jednostkowe w trybie watch
npm run test:run        # Uruchom testy jednostkowe jednorazowo (CI)
npm run test:ui         # Uruchom testy z interfejsem UI
npm run test:e2e        # Uruchom testy E2E (Playwright)
```

## 🔄 CI/CD

Projekt wykorzystuje **GitHub Actions** do automatyzacji procesów CI/CD.

### Pull Request Pipeline

Każdy pull request do brancha `master` automatycznie uruchamia workflow, który:

1. **Lintuje kod** - Sprawdza jakość kodu za pomocą ESLint
2. **Uruchamia testy** (równolegle):
   - **Unit tests** - Testy jednostkowe z coverage
   - **E2E tests** - Testy end-to-end z Playwright
3. **Publikuje status** - Dodaje komentarz do PR z wynikami

### Artefakty

Pipeline generuje następujące artefakty (przechowywane przez 7 dni):
- Raporty coverage z testów jednostkowych
- Raporty coverage z testów E2E
- Raporty Playwright

### Wymagania

Aby testy E2E działały w CI, skonfiguruj następujące sekrety w GitHub:
- `PUBLIC_SUPABASE_URL` - URL projektu Supabase do testów integracyjnych
- `PUBLIC_SUPABASE_ANON_KEY` - Klucz anon dla Supabase

Więcej informacji: [.github/workflows/README.md](.github/workflows/README.md)

## 🚀 Deployment

### Przygotowanie do wdrożenia

1. **Utwórz projekt Supabase** na [supabase.com](https://supabase.com)

2. **Połącz projekt z lokalnym repozytorium:**

```bash
npx supabase link --project-ref your-project-ref
```

3. **Wgraj migracje do produkcji:**

```bash
npx supabase db push
```

4. **Zaktualizuj zmienne środowiskowe** na produkcji:

```bash
PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
```

### Deployment na różnych platformach

#### DigitalOcean App Platform (zalecane)

1. Połącz repozytorium GitHub z DigitalOcean
2. Ustaw zmienne środowiskowe
3. Deploy automatyczny z main branch

#### Vercel

```bash
npm install -g vercel
vercel
```

#### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

## 🤝 Wkład w projekt

Ten projekt jest częścią edukacyjnego programu AI-driven development. Obecnie nie przyjmuje zewnętrznych kontrybuacji.

## 📄 Licencja

[MIT](LICENSE)

---

## 👨‍💻 Autor

Stworzony jako projekt edukacyjny w ramach nauki AI-driven development.

## 🙏 Podziękowania

- [Astro](https://astro.build/) - za świetny framework
- [Supabase](https://supabase.com/) - za doskonały backend
- [Shadcn/ui](https://ui.shadcn.com/) - za piękne komponenty
- [10xDevs](https://www.10xdevs.io/) - za inspirację i wskazówki

---

**Potrzebujesz pomocy?** Sprawdź dokumentację w katalogu [supabase/](supabase/) lub otwórz issue.
