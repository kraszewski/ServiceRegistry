# Architektura UI dla ServiceRegistry

## 1. Przegląd struktury UI

ServiceRegistry to aplikacja webowa do zarządzania sprzętem i historią serwisową, zbudowana jako hybrydowa aplikacja wykorzystująca **Astro 5** dla server-side rendering i routing, z **React 19** dla interaktywnych komponentów (partial hydration). Architektura łączy korzyści SSR (SEO, performance, security) z interaktywnością React tam gdzie jest potrzebna.

### Główne założenia projektowe

- **Mobile-First Responsive Design**: Wszystkie widoki projektowane najpierw dla mobile, następnie adaptowane dla tablet i desktop
- **Role-Based UI**: Dynamiczne renderowanie elementów interfejsu w oparciu o rolę użytkownika (owner/worker)
- **Progressive Enhancement**: Podstawowa funkcjonalność dostępna bez JavaScript, interaktywność dodawana przez React
- **Accessibility-First**: Wszystkie komponenty zgodne z WCAG AA, keyboard navigation, screen reader support

### Breakpointy responsywne

- **Mobile**: <768px (single column, cards, hamburger menu)
- **Tablet**: 768px-1024px (adaptive layout)
- **Desktop**: >1024px (multi-column, tables, sidebar visible)

## 2. Lista widoków

### 2.1 Login Page (`/login`)

**Dostępność**: Publiczna

**Główny cel**: Umożliwienie użytkownikowi zalogowania się do systemu

**Kluczowe informacje do wyświetlenia**:
- Formularz logowania (email, hasło)
- Logo aplikacji
- Komunikaty błędów walidacji i API

**Kluczowe komponenty widoku**:
- **LoginForm**: Formularz z email i password inputs, przycisk submit
- **ErrorAlert**: Komponent do wyświetlania błędów API (401, 500)
- **Logo**: Branding aplikacji

**Layout**:
- Centered card (max-width 400px)
- Logo na górze
- Nagłówek "Zaloguj się"
- Formularz z inputami i przyciskiem
- Error alert poniżej formularza (jeśli błąd)

**UX, dostępność i względy bezpieczeństwa**:
- Auto-focus na email input
- Enter key submits form
- Walidacja inline (invalid email format)
- Loading state disables form podczas request
- Password input z toggle visibility
- Labels powiązane z inputs (for/id)
- Error messages announced dla screen readers
- CSRF protection przez Supabase
- Redirect do /dashboard jeśli już zalogowany

### 2.2 Dashboard (`/dashboard`)

**Dostępność**: Protected (wszystkie role)

**Główny cel**: Przegląd najważniejszych informacji i szybki dostęp do kluczowych akcji

**Kluczowe informacje do wyświetlenia**:
- Statystyki: liczba sprzętu, wpisy serwisowe dziś, wpisy w miesiącu
- Lista 5 ostatnich wpisów serwisowych (z linkami do equipment details)
- Quick actions: "Dodaj sprzęt", pole wyszukiwania po ID

**Kluczowe komponenty widoku**:
- **StatsCard** (3x): Karty z ikoną, liczbą i labelą dla statystyk
- **RecentEntriesSection**: Sekcja z ostatnimi wpisami
  - **ServiceEntryCard**: Karta pojedynczego wpisu (equipment name/ID, service type badge, timestamp, performer)
- **QuickActionsBar**: Przycisk "Dodaj sprzęt" i pole wyszukiwania

**Layout Desktop**:
- Grid 3 kolumny dla statystyk (równe szerokości)
- Sekcja "Ostatnie wpisy" poniżej (full-width)
- Quick actions na górze (prawy górny róg sekcji)

**Layout Mobile**:
- Single column
- Statystyki w kartach (vertical stack)
- Ostatnie wpisy (vertical stack)
- Quick actions sticky bottom

**UX, dostępność i względy bezpieczeństwa**:
- Skeleton loaders dla statystyk podczas ładowania
- Skeleton dla listy wpisów
- Empty state "Brak ostatnich wpisów" z ilustracją jeśli brak danych
- Linki do equipment details zachowują context (breadcrumbs)
- Semantic HTML (main, section, article)
- ARIA labels dla interaktywnych elementów
- Server-side protection w middleware przed renderowaniem

### 2.3 Equipment List (`/equipment`)

**Dostępność**: Protected (wszystkie role)

**Główny cel**: Przeglądanie i zarządzanie całym inwentarzem sprzętu

**Kluczowe informacje do wyświetlenia**:
- Lista sprzętu z kolumnami: Equipment ID, Nazwa, Producent, Model, Kategoria, Data dodania
- Aktywne filtry (kategoria)
- Informacja o paginacji (showing X-Y of Z items)

**Kluczowe komponenty widoku**:
- **PageHeader**: Sticky header z tytułem "Sprzęt" i przyciskiem "+ Dodaj sprzęt"
- **FilterBar**: Filtry i sortowanie
  - **CategoryCombobox**: Multi-select z ikonami dla kategorii
  - **ActiveFiltersBadges**: Badges pokazujące aktywne filtry z opcją usunięcia
- **EquipmentTable** (desktop): Tabela z sortowalnymi kolumnami
- **EquipmentCard** (mobile): Karty z kluczowymi danymi sprzętu
- **Pagination**: Kontrolki paginacji (previous, next, page numbers)
- **EmptyState**: Stan pusty gdy brak wyników

**Layout Desktop**:
- Sticky header (title + add button)
- FilterBar (horizontal, poniżej headera)
- Tabela z kolumnami (sortable headers)
- Pagination na dole (fixed)

**Layout Mobile**:
- Sticky header (title + add button)
- Filtry (collapsible section)
- Karty (EquipmentCard) w vertical stack
- Pagination na dole

**UX, dostępność i względy bezpieczeństwa**:
- Sortowanie po wszystkich kolumnach (strzałka wskazuje kierunek)
- Filtry i sortowanie w URL query params (możliwość bookmark/share): `?sort=name&order=asc&category=computer&page=2`
- Skeleton loaders dla tabeli/kart podczas ładowania
- Loading spinner na pagination podczas zmiany strony
- Empty state "Brak sprzętu" z CTA "Dodaj pierwszy sprzęt" (jeśli brak filtrów)
- Empty state "Brak wyników dla wybranych filtrów" z CTA "Wyczyść filtry" (jeśli filtry aktywne)
- Hover row highlight w tabeli
- Click row/card → navigate to equipment details
- Prefetching następnej strony (TanStack Query)
- Keyboard navigation (Tab przez wiersze/karty, Enter otwiera szczegóły)
- ARIA sort attributes dla sortable columns
- Server-side pagination (limit 50, max 100)

### 2.4 Equipment Details (`/equipment/[id]`)

**Dostępność**: Protected (wszystkie role)

**Główny cel**: Przeglądanie szczegółowych informacji o sprzęcie i jego historii serwisowej

**Kluczowe informacje do wyświetlenia**:
- Kompletne dane sprzętu (wszystkie pola)
- Historia serwisowa (timeline z wpisami chronologicznie)
- Metadata: kto i kiedy dodał/zmodyfikował

**Kluczowe komponenty widoku**:
- **PageHeader**: Sticky header z Equipment ID, nazwą i akcjami
  - Button "Edytuj" → otwiera EquipmentFormDialog
  - Button "Usuń" (owner only) → otwiera AlertDialog
- **EquipmentDataCard**: Karta z danymi sprzętu
  - Grid layout (2 kolumny desktop, 1 kolumna mobile)
  - Label + Value pairs
  - **CategoryBadge** z ikoną
- **ServiceHistorySection**: Sekcja historii serwisowej
  - Header "Historia Serwisowa" + Button "+ Dodaj wpis"
  - **ServiceEntryTimeline**: Timeline z wpisami
    - **ServiceEntryItem**: Pojedynczy wpis z:
      - Timestamp (relatywny <7 dni, absolutny ≥7 dni, tooltip z pełną datą)
      - **ServiceTypeBadge** + ikona (inspection: niebieski/ClipboardCheck, repair: pomarańczowy/Wrench, maintenance: zielony/Cog)
      - Description (z "Read more" dla >200 znaków)
      - Performer name
      - Actions dropdown (Edytuj, Usuń - owner only)

**Layout Desktop**:
- Sticky header (breadcrumbs + title + actions)
- Equipment data card (2-column grid)
- Separator
- Service history section (full-width)
- Timeline (vertical line, entries po lewej)

**Layout Mobile**:
- Sticky header (title + actions w dropdown)
- Equipment data card (single column)
- Service history section
- Timeline (compact layout)

**UX, dostępność i względy bezpieczeństwa**:
- Skeleton loaders dla equipment data i timeline
- Empty state "Brak wpisów serwisowych. Dodaj pierwszy wpis." jeśli brak historii
- Scroll to newest entry po dodaniu wpisu
- Optimistic update timeline po dodaniu/edycji wpisu
- "Read more" expansion dla długich opisów (smooth animation)
- Tooltip z pełnym timestamp przy hover na relatywnych datach
- Confirmation AlertDialog przed usunięciem sprzętu (z informacją o cascade: "Ta akcja usunie również X wpisów serwisowych")
- Confirmation AlertDialog przed usunięciem wpisu (owner only)
- Actions (Edytuj/Usuń) ukryte dla worker (całkowite ukrycie, nie disabled)
- Keyboard navigation (Tab przez wpisy, Enter otwiera actions dropdown)
- ARIA labels dla timeline
- Focus management w modals/drawers

### 2.5 User Management (`/users`)

**Dostępność**: Protected (owner only)

**Główny cel**: Zarządzanie kontami pracowników

**Kluczowe informacje do wyświetlenia**:
- Lista użytkowników: email, imię, rola, data utworzenia
- Informacja o paginacji

**Kluczowe komponenty widoku**:
- **PageHeader**: Header z tytułem "Zarządzanie Użytkownikami" i przyciskiem "+ Dodaj Pracownika"
- **UsersTable** (desktop): Tabela z kolumnami (Email, Imię, Rola, Data utworzenia, Akcje)
- **UserCard** (mobile): Karty użytkowników z kluczowymi danymi
- **RoleBadge**: Badge pokazujący rolę (owner: primary color, worker: secondary color)
- **Pagination**: Kontrolki paginacji
- **AddUserDialog**: Modal do dodawania pracownika
- **EmptyState**: Stan pusty gdy brak pracowników

**Layout Desktop**:
- Header (title + add button)
- Tabela (kolumny: Email, Imię, Rola, Data utworzenia, Akcje)
- Button "Usuń" w kolumnie Akcje (destructive styling)
- Pagination na dole

**Layout Mobile**:
- Header (title + add button)
- Karty (UserCard) w vertical stack
- Button "Usuń" w każdej karcie
- Pagination na dole

**UX, dostępność i względy bezpieczeństwa**:
- Skeleton loaders dla tabeli/kart
- Empty state "Brak pracowników. Dodaj pierwszego pracownika."
- Confirmation AlertDialog przed usunięciem użytkownika
- Obsługa 409 Conflict (użytkownik ma wpisy serwisowe) → Toast "Nie można usunąć - użytkownik ma przypisane wpisy serwisowe. Usuń najpierw wszystkie wpisy lub zmień wykonawcę."
- Nie można usunąć własnego konta (button disabled z tooltip "Nie możesz usunąć własnego konta")
- Nie można usunąć innych ownerów (button hidden)
- Optimistic update listy po dodaniu/usunięciu
- Server-side route protection (middleware sprawdza rolę owner)
- Redirect do /dashboard z toast error jeśli worker próbuje dostać się do /users
- Keyboard navigation
- ARIA labels dla destructive actions

### 2.6 Not Found (`/404`)

**Dostępność**: Publiczna

**Główny cel**: Informowanie użytkownika o nieistniejącej stronie

**Kluczowe informacje do wyświetlenia**:
- Komunikat "404 - Strona nie znaleziona"
- Przycisk powrotu

**Kluczowe komponenty widoku**:
- **ErrorIllustration**: Ilustracja 404
- **Message**: Komunikat błędu
- **BackButton**: Przycisk "Wróć do dashboardu"

**UX, dostępność i względy bezpieczeństwa**:
- Centered layout
- Friendly message (nie techniczny żargon)
- Clear CTA
- Link do dashboardu lub poprzedniej strony

## 3. Mapa podróży użytkownika

### Journey 1: Logowanie i przegląd dashboardu (US-001)

1. Użytkownik otwiera aplikację
2. System wykrywa brak sesji → redirect do `/login`
3. Użytkownik wypełnia formularz (email, hasło)
4. Klika "Zaloguj" lub naciska Enter
5. **Frontend**: Walidacja client-side (format email)
6. **API Call**: `POST /api/auth/login`
7. **Loading State**: Button disabled + spinner
8. **Success Path**: 
   - Session cookie ustawiony
   - Redirect do `/dashboard`
   - **API Call**: `GET /api/auth/me` (pobiera profil użytkownika)
   - Wyświetla statystyki i ostatnie wpisy
9. **Error Path**:
   - 401 (nieprawidłowe dane) → Error alert "Nieprawidłowy email lub hasło"
   - 500 → Error alert "Wystąpił błąd serwera"
10. Użytkownik może kliknąć quick action "Dodaj sprzęt" → Journey 2

### Journey 2: Dodawanie sprzętu (US-004)

1. Użytkownik klika "+ Dodaj sprzęt" (z dashboardu lub listy sprzętu)
2. Otwiera się **EquipmentFormDialog** (Modal Dialog)
3. Formularz wyświetla sekcję "Dane wymagane"
4. Użytkownik wypełnia:
   - Nazwa (text input)
   - Kategoria (select z ikonami)
   - Producent (text input)
   - Model (text input)
   - Numer seryjny (text input)
5. Opcjonalnie rozwija sekcję "Dane opcjonalne" i wypełnia:
   - Opis (textarea)
   - Lokalizacja (text input)
   - Data zakupu (date picker)
6. **Auto-save**: Dane zapisywane do localStorage co 2 sekundy
7. Klika "Zapisz"
8. **Frontend**: Walidacja client-side (Zod schema)
9. **Validation Errors**: Inline errors pod konkretnymi polami, focus na pierwsze pole z błędem
10. **Validation Success**: 
    - **API Call**: `POST /api/equipment`
    - **Loading State**: Button disabled + spinner
11. **Success Path** (201):
    - Toast notification "Sprzęt dodany pomyślnie"
    - localStorage cleared
    - Modal zamyka się
    - Redirect do `/equipment/[id]` (nowo dodany sprzęt)
12. **Error Paths**:
    - 400 (validation) → Inline errors
    - 409 (duplikat serial_number) → Toast "Sprzęt o tym numerze seryjnym już istnieje"
    - 500 → Toast "Wystąpił błąd serwera. Spróbuj ponownie."

### Journey 3: Przeglądanie i dodawanie wpisu serwisowego (US-009, US-012)

1. Użytkownik wyszukuje sprzęt (Journey 5) lub wybiera z listy `/equipment`
2. **API Call**: `GET /api/equipment/{id}`
3. **Loading State**: Skeleton dla equipment data i timeline
4. Widzi szczegóły sprzętu i sekcję "Historia Serwisowa"
5. **API Call**: `GET /api/equipment/{equipmentId}/service-entries`
6. Timeline wyświetla wpisy chronologicznie (najnowsze na górze)
7. Klika "+ Dodaj wpis"
8. Otwiera się **ServiceEntryFormDrawer** z prawej strony (zachowuje widoczność timeline)
9. Formularz wyświetla pola:
   - Data i godzina serwisu (datetime picker, domyślnie now, edytowalna)
   - Typ operacji (select z ikonami: przegląd/naprawa/konserwacja)
   - Opis (textarea, min 5 znaków)
   - Wykonawca (read-only input, auto-filled z zalogowanego użytkownika, disabled)
10. Wypełnia formularz
11. Klika "Zapisz"
12. **Frontend**: Walidacja client-side (min 5 znaków dla opisu)
13. **Validation Errors**: Inline errors
14. **Validation Success**:
    - **Optimistic Update**: Nowy wpis dodany do timeline natychmiast (z loading indicator)
    - **API Call**: `POST /api/equipment/{equipmentId}/service-entries`
    - **Loading State**: Button disabled + spinner
15. **Success Path** (201):
    - Toast notification "Wpis dodany pomyślnie"
    - Drawer zamyka się
    - Timeline refresh z realnym wpisem z API
    - Scroll do najnowszego wpisu
16. **Error Path**:
    - Optimistic update cofnięty
    - 400 (validation) → Inline errors
    - 404 (equipment nie istnieje) → Toast + redirect do /equipment
    - 500 → Toast "Wystąpił błąd serwera"

### Journey 4: Zarządzanie użytkownikami - Dodawanie pracownika (US-002) - Owner only

1. Owner klika "Użytkownicy" w nawigacji
2. **Middleware Check**: Server-side sprawdza rolę
3. **If worker**: Redirect do `/dashboard` + Toast "Brak uprawnień"
4. **If owner**: Renderuje `/users`
5. **API Call**: `GET /api/users?page=1&limit=50`
6. **Loading State**: Skeleton dla tabeli/kart
7. Widzi listę użytkowników
8. Klika "+ Dodaj Pracownika"
9. Otwiera się **AddUserDialog** (Modal)
10. Formularz wyświetla pola:
    - Email (email input)
    - Hasło (password input z toggle visibility, min 8 znaków)
    - Imię (text input)
    - Info text: "Rola zostanie automatycznie ustawiona na 'Pracownik'"
11. Wypełnia formularz
12. Klika "Dodaj"
13. **Frontend**: Walidacja client-side (email format, hasło min 8 znaków)
14. **Validation Errors**: Inline errors
15. **Validation Success**:
    - **API Call**: `POST /api/users`
    - **Loading State**: Button disabled + spinner
16. **Success Path** (201):
    - Toast notification "Pracownik dodany pomyślnie"
    - Dialog zamyka się
    - **Cache Invalidation**: TanStack Query invalidate users list
    - Lista użytkowników refresh
    - Nowy użytkownik widoczny
17. **Error Paths**:
    - 400 (validation) → Inline errors
    - 409 (duplikat email) → Toast "Użytkownik o tym adresie email już istnieje"
    - 500 → Toast "Wystąpił błąd serwera"

### Journey 5: Wyszukiwanie sprzętu po ID (US-006)

1. Użytkownik wpisuje Equipment ID w pole wyszukiwania (nawigacja)
2. **Client-side**: Walidacja formatu na blur (EQ-YYYY-NNNNN)
3. Naciśka Enter lub klika przycisk wyszukaj
4. **Invalid format**: Inline error "Nieprawidłowy format ID (oczekiwany: EQ-2024-00001)"
5. **Valid format**:
   - **API Call**: `GET /api/equipment?search={equipment_id}`
   - **Loading State**: Spinner w input
6. **Success Path** (equipment found):
   - Redirect do `/equipment/[id]`
7. **Error Path** (equipment not found):
   - Toast "Nie znaleziono sprzętu o podanym ID"
   - Input cleared
   - Focus pozostaje na input

### Journey 6: Usuwanie pracownika (US-003) - Owner only

1. Owner w widoku `/users` klika "Usuń" przy użytkowniku
2. Otwiera się **AlertDialog** (confirmation)
3. Dialog wyświetla:
   - Title: "Usunąć użytkownika?"
   - Message: "Ta akcja jest nieodwracalna. Użytkownik straci dostęp do systemu."
   - Buttons: "Anuluj" (default focus), "Usuń" (destructive)
4. **If Anuluj**: Dialog zamyka się, nic się nie dzieje
5. **If Usuń**:
   - **API Call**: `DELETE /api/users/{id}`
   - **Loading State**: Button disabled + spinner
6. **Success Path** (200):
   - Toast notification "Użytkownik usunięty pomyślnie"
   - Dialog zamyka się
   - **Cache Invalidation**: Lista użytkowników refresh
   - Użytkownik znika z listy
7. **Error Paths**:
   - 403 (próba usunięcia własnego konta lub ownera) → Toast "Nie można wykonać tej akcji"
   - 404 (użytkownik już nie istnieje) → Toast "Użytkownik nie został znaleziony" + refresh listy
   - 409 (użytkownik ma wpisy serwisowe) → Toast "Nie można usunąć - użytkownik ma przypisane wpisy serwisowe. Usuń najpierw wszystkie wpisy lub zmień wykonawcę."
   - 500 → Toast "Wystąpił błąd serwera"

## 4. Układ i struktura nawigacji

### 4.1 Navigation Bar (dla zalogowanych użytkowników)

**Desktop (>1024px)**:

```
+------------------------------------------------------------------+
| [Logo] Dashboard | Sprzęt | Użytkownicy*  [Search] [Avatar ▾] |
+------------------------------------------------------------------+
```

**Elementy**:
- **Logo** (lewy górny róg): Link do `/dashboard`
- **Główne menu** (horizontal):
  - "Dashboard" → `/dashboard`
  - "Sprzęt" → `/equipment`
  - "Użytkownicy" → `/users` (visible only for owner)
- **Search Bar** (centrum): Pole wyszukiwania po Equipment ID z ikoną lupki
- **User Menu** (prawy górny):
  - Avatar użytkownika
  - Dropdown (click avatar):
    - Header: Imię użytkownika + role badge
    - Separator
    - "Wyloguj" → `POST /api/auth/logout`

**Mobile (<768px)**:

```
+----------------------------------+
| [☰] ServiceRegistry     [Avatar]|
+----------------------------------+
```

Po kliknięciu hamburger menu (☰):

```
+----------------------------------+
|            [✕ Close]             |
|                                  |
|  [Search Equipment ID...]        |
|                                  |
|  Dashboard                       |
|  Sprzęt                          |
|  Użytkownicy*                    |
|                                  |
|  ────────────────────            |
|                                  |
|  Jan Kowalski (Owner)            |
|  Wyloguj                         |
+----------------------------------+
```

**Tablet (768px-1024px)**:
- Podobny layout do desktop, możliwe collapsed labels (tylko ikony + tooltips)

### 4.2 Breadcrumbs

Wyświetlane na wszystkich stronach poza login i dashboard (opcjonalnie):

- `/equipment` → `Dashboard > Sprzęt`
- `/equipment/[id]` → `Dashboard > Sprzęt > [Equipment Name]`
- `/users` → `Dashboard > Użytkownicy`

### 4.3 Routing i ochrona tras

**Struktura ścieżek**:

```
/login                          # Publiczna
/dashboard                      # Protected (all authenticated)
/equipment                      # Protected (all authenticated)
/equipment/[id]                 # Protected (all authenticated)
/users                          # Protected (owner only)
/404                            # Publiczna
```

**Server-side Protection** (Astro middleware):
1. Sprawdza session (Supabase auth)
2. Jeśli brak session + protected route → Redirect do `/login`
3. Jeśli session + owner-only route → Sprawdza rolę
4. Jeśli worker + owner-only route → Redirect do `/dashboard` + toast error "Brak uprawnień"
5. Jeśli session + `/login` → Redirect do `/dashboard`

**Client-side Navigation**:
- Modals/Drawers nie zmieniają URL (local state)
- Wszystkie linki używają Astro transitions (smooth page transitions)

### 4.4 Conditional Rendering na podstawie roli

**Hook `useUserRole()`**:

```typescript
interface UseUserRoleResult {
  user: User | null;
  role: 'owner' | 'worker' | null;
  isOwner: boolean;
  isLoading: boolean;
}
```

**Przykłady użycia**:

```tsx
// Navigation
const { isOwner } = useUserRole();
{isOwner && <NavLink to="/users">Użytkownicy</NavLink>}

// Actions w Equipment Details
{isOwner && <Button variant="destructive" onClick={handleDelete}>Usuń</Button>}

// Actions w Service Entry Timeline
{isOwner && (
  <DropdownMenuItem onSelect={handleDeleteEntry}>
    Usuń wpis
  </DropdownMenuItem>
)}
```

## 5. Kluczowe komponenty

### 5.1 Komponenty layoutu

#### Navigation (Custom)
- **Opis**: Główna nawigacja aplikacji z logo, menu, search bar i user menu
- **Warianty**: Desktop (horizontal), Mobile (hamburger menu)
- **Props**: `currentUser`, `currentPath`
- **State**: `mobileMenuOpen` (mobile only)

#### PageHeader
- **Opis**: Sticky header dla stron z tytułem i akcjami
- **Props**: `title`, `breadcrumbs?`, `actions?`
- **Użycie**: Equipment List, Equipment Details, User Management

#### Card (Shadcn/ui)
- **Opis**: Kontener dla grupowania powiązanych treści
- **Użycie**: Dashboard stats, Equipment data, User cards (mobile)

### 5.2 Komponenty nawigacyjne

#### Pagination
- **Opis**: Kontrolki paginacji dla list
- **Props**: `currentPage`, `totalPages`, `onPageChange`
- **Elementy**: Previous button, page numbers (max 5 visible), Next button, total count
- **Użycie**: Equipment List, User Management, Service Entry Timeline

#### Breadcrumbs (Custom)
- **Opis**: Nawigacja hierarchiczna
- **Props**: `items: Array<{ label, href }>`
- **Użycie**: Equipment Details, User Management

### 5.3 Komponenty danych i wyświetlania

#### EquipmentTable (Custom)
- **Opis**: Tabela sprzętu dla desktop
- **Props**: `data`, `sortConfig`, `onSort`, `onRowClick`
- **Features**: Sortable columns, hover highlight, click to navigate

#### EquipmentCard (Custom)
- **Opis**: Karta sprzętu dla mobile
- **Props**: `equipment`, `onClick`
- **Layout**: Category badge + nazwa, metadata (producent, model, data)

#### ServiceEntryTimeline (Custom)
- **Opis**: Timeline historii serwisowej
- **Props**: `entries`, `onEdit`, `onDelete`, `isOwner`
- **Features**: Chronologiczne grupowanie, service type badges, read more expansion

#### ServiceEntryItem (Custom)
- **Opis**: Pojedynczy wpis w timeline
- **Props**: `entry`, `onEdit?`, `onDelete?`, `isOwner`
- **Elementy**: Timestamp (relatywny/absolutny), service type badge + ikona, description, performer, actions dropdown

#### StatsCard (Custom)
- **Opis**: Karta statystyki na dashboardzie
- **Props**: `icon`, `value`, `label`, `isLoading`
- **Layout**: Ikona + liczba (duża) + label

#### UserCard (Custom)
- **Opis**: Karta użytkownika dla mobile
- **Props**: `user`, `onDelete`, `canDelete`
- **Elementy**: Email (heading), name, role badge, created_at, delete button

#### EmptyState (Custom)
- **Opis**: Stan pusty dla list bez elementów
- **Props**: `illustration`, `title`, `description`, `action?`
- **Użycie**: Puste listy sprzętu, wpisów, użytkowników, brak wyników filtrowania

### 5.4 Komponenty formularzy

#### EquipmentFormDialog (Custom)
- **Opis**: Modal do dodawania/edycji sprzętu
- **Props**: `mode: 'create' | 'edit'`, `initialData?`, `onSuccess`
- **Form**: react-hook-form + Zod validation
- **Features**: Auto-save do localStorage, inline validation, category select z ikonami

#### ServiceEntryFormDrawer (Custom)
- **Opis**: Drawer do dodawania/edycji wpisu serwisowego
- **Props**: `equipmentId`, `mode: 'create' | 'edit'`, `initialData?`, `onSuccess`
- **Form**: react-hook-form + Zod validation
- **Features**: DateTime picker, service type select z ikonami, read-only performer

#### AddUserDialog (Custom)
- **Opis**: Dialog do dodawania pracownika
- **Props**: `onSuccess`
- **Form**: react-hook-form + Zod validation
- **Features**: Email validation, password toggle visibility, inline validation

#### SearchBar (Custom)
- **Opis**: Pole wyszukiwania po Equipment ID
- **Props**: `onSearch`, `placeholder`
- **Features**: Format validation (EQ-YYYY-NNNNN), loading state, clear button

### 5.5 Komponenty feedbacku

#### Toast/Sonner (Shadcn/ui)
- **Opis**: Notyfikacje dla akcji użytkownika
- **Warianty**: Success (green), Error (red), Info (blue)
- **Props**: `title`, `description?`, `duration` (auto-dismiss 3-5s dla success)
- **Użycie**: Wszystkie API responses (sukces/błąd)

#### Alert (Shadcn/ui)
- **Opis**: Inline alerts dla ważnych komunikatów
- **Warianty**: Info, Warning, Error, Success
- **Użycie**: Login errors, form-level errors

#### AlertDialog (Shadcn/ui)
- **Opis**: Dialog potwierdzenia dla destruktive actions
- **Props**: `title`, `description`, `onConfirm`, `onCancel`, `confirmLabel`, `isDestructive`
- **Użycie**: Usuwanie sprzętu, użytkownika, wpisu serwisowego

#### Skeleton (Shadcn/ui)
- **Opis**: Loading placeholder dla treści
- **Warianty**: Text, Card, Table, Avatar
- **Użycie**: Ładowanie list, szczegółów sprzętu, statystyk

#### Spinner (Custom)
- **Opis**: Loading indicator
- **Warianty**: Small (button), Medium (inline), Large (page)
- **Użycie**: Loading states w przyciskach, API calls

### 5.6 Komponenty UI (Shadcn/ui)

#### Badge
- **Użycie**: Role badges, category badges, service type badges, active filters
- **Warianty**: Default, Primary, Secondary, Destructive, Outline

#### Button
- **Warianty**: Default, Primary, Secondary, Destructive, Outline, Ghost, Link
- **States**: Default, Hover, Active, Disabled, Loading
- **Sizes**: Small, Medium, Large

#### Input, Textarea, Label
- **Użycie**: Wszystkie formularze
- **Features**: Validation states (error, success), helper text, character count (textarea)

#### Select, Combobox
- **Użycie**: Category select (z ikonami), service type select, sortowanie, filtry
- **Features**: Search (combobox), multi-select (combobox), ikony w options

#### DatePicker (Custom based on Shadcn)
- **Użycie**: Data zakupu, service timestamp
- **Features**: Calendar popup, manual input, validation

#### Dialog, Sheet (Drawer)
- **Użycie**: Modals (equipment form, add user), Drawers (service entry form)
- **Features**: Focus trap, keyboard navigation (Escape closes), overlay

#### DropdownMenu
- **Użycie**: User menu w navigation, actions w timeline entries
- **Features**: Keyboard navigation, sub-menus

#### Separator
- **Użycie**: Rozdzielanie sekcji (equipment data vs history, form sections)

#### Table
- **Użycie**: Equipment list (desktop), Users list (desktop)
- **Features**: Sortable headers, hover highlight, responsive

#### Tooltip
- **Użycie**: Ikony akcji, relatywne timestamps (full date on hover), disabled buttons (reason)
- **Features**: Arrow, delay on show, instant on hide

#### Avatar
- **Użycie**: User menu, performer w service entries
- **Features**: Fallback (inicjały z imienia)

### 5.7 Komponenty specjalistyczne

#### CategoryBadge (Custom)
- **Opis**: Badge kategorii sprzętu z ikoną
- **Props**: `category: EquipmentCategory`
- **Mapowanie**:
  - `computer`: Monitor icon, blue
  - `printer`: Printer icon, purple
  - `monitor`: Monitor icon, cyan
  - `network_device`: Network icon, green
  - `phone`: Phone icon, pink
  - `tablet`: Tablet icon, orange
  - `peripheral`: Usb icon, gray
  - `other`: Box icon, slate

#### ServiceTypeBadge (Custom)
- **Opis**: Badge typu operacji serwisowej z ikoną
- **Props**: `serviceType: ServiceType`
- **Mapowanie**:
  - `inspection`: ClipboardCheck icon, blue, "Przegląd"
  - `repair`: Wrench icon, orange, "Naprawa"
  - `maintenance`: Cog icon, green, "Konserwacja"

#### RoleBadge (Custom)
- **Opis**: Badge roli użytkownika
- **Props**: `role: UserRole`
- **Mapowanie**:
  - `owner`: Primary color, "Właściciel"
  - `worker`: Secondary color, "Pracownik"

#### DateTimeDisplay (Custom)
- **Opis**: Wyświetlanie timestamp z relatywnym/absolutnym formatem
- **Props**: `timestamp`, `showRelative` (default true dla <7 dni)
- **Features**: Tooltip z pełnym timestamp przy hover
- **Format**:
  - Relatywny (<7 dni): "2 godziny temu", "wczoraj", "3 dni temu"
  - Absolutny (≥7 dni): "19 sty 2026" (date only) lub "19 sty 2026, 14:30" (datetime)

## 6. Mapowanie UI do API

### 6.1 Authentication & Session

| UI Action | API Endpoint | Method | Response Handling |
|-----------|--------------|--------|-------------------|
| Login form submit | `/api/auth/login` | POST | Success: redirect `/dashboard`, Error: show alert |
| Logout click | `/api/auth/logout` | POST | Success: redirect `/login`, clear cache |
| Get current user | `/api/auth/me` | GET | Store in UserContext, use for role checks |

### 6.2 Equipment Management

| UI Action | API Endpoint | Method | Response Handling |
|-----------|--------------|--------|-------------------|
| Equipment list load | `/api/equipment?page=X&limit=50&sort=Y&order=Z&category=W` | GET | Display table/cards, update pagination |
| Search by ID | `/api/equipment?search={id}` | GET | Redirect to details, or toast "Not found" |
| Add equipment (form submit) | `/api/equipment` | POST | Toast success, redirect to `/equipment/[id]`, 409: toast "Serial number exists" |
| Equipment details load | `/api/equipment/{id}` | GET | Display data card, 404: toast + redirect to list |
| Edit equipment (form submit) | `/api/equipment/{id}` | PATCH | Toast success, update data card, 409: toast "Serial number exists" |
| Delete equipment (owner) | `/api/equipment/{id}` | DELETE | Toast success, redirect to `/equipment`, confirmation with cascade warning |

### 6.3 Service Entries Management

| UI Action | API Endpoint | Method | Response Handling |
|-----------|--------------|--------|-------------------|
| Service entries list load | `/api/equipment/{equipmentId}/service-entries?page=X&limit=50` | GET | Display timeline, update pagination |
| Add service entry (form submit) | `/api/equipment/{equipmentId}/service-entries` | POST | Toast success, optimistic update timeline, 404: toast + redirect |
| Get service entry | `/api/service-entries/{id}` | GET | Populate edit form |
| Edit service entry (form submit) | `/api/service-entries/{id}` | PATCH | Toast success, update timeline item |
| Delete service entry (owner) | `/api/service-entries/{id}` | DELETE | Toast success, remove from timeline, confirmation dialog |

### 6.4 User Management (Owner only)

| UI Action | API Endpoint | Method | Response Handling |
|-----------|--------------|--------|-------------------|
| Users list load | `/api/users?page=X&limit=50` | GET | Display table/cards, update pagination |
| Add user (form submit) | `/api/users` | POST | Toast success, update list, 409: toast "Email exists" |
| Get user details | `/api/users/{id}` | GET | Display in table/card row |
| Delete user (owner) | `/api/users/{id}` | DELETE | Toast success, update list, 409: toast "User has service entries", confirmation dialog |

### 6.5 Dashboard Statistics

| UI Component | Data Source | Notes |
|--------------|-------------|-------|
| Total equipment count | `GET /api/equipment?page=1&limit=1` | Use `pagination.total` from response |
| Entries today | **Brakuje endpointu** | Wymaga `GET /api/service-entries?filter=today` lub client-side filtering |
| Entries this month | **Brakuje endpointu** | Wymaga `GET /api/service-entries?filter=month` lub client-side filtering |
| Recent entries (5) | **Brakuje endpointu** | Wymaga `GET /api/service-entries?page=1&limit=5&sort=created_at&order=desc` |

**Rekomendacja**: Dodać globalny endpoint `GET /api/service-entries` z parametrami:
- `page`, `limit` (pagination)
- `sort`, `order` (sortowanie)
- `filter`: `today`, `week`, `month` (opcjonalny pre-filter)
- Response zawiera join z equipment (name, equipment_id) i performer (name)

## 7. Stany aplikacji i obsługa błędów

### 7.1 Loading States

| Kontekst | UI Implementacja |
|----------|------------------|
| Lista sprzętu/użytkowników ładuje | Skeleton loaders (tabela/karty), liczba rows = limit |
| Szczegóły sprzętu ładują | Skeleton dla data card + timeline |
| Statystyki dashboardu ładują | Skeleton dla każdej StatsCard |
| API call z formularza | Button disabled + spinner, form fields disabled |
| Zmiana strony paginacji | Loading spinner na pagination, dane niezmienione (nie znikają) |
| Wyszukiwanie po ID | Spinner w search input |

### 7.2 Error States - Matrix

| Kod | Typ Błędu | UI Response | Przykład Kontekstu |
|-----|-----------|-------------|---------------------|
| 400 | Validation | Inline errors w formularzu pod konkretnymi polami | Nieprawidłowe dane w formularzu equipment |
| 401 | Unauthorized | Redirect do `/login` + toast "Sesja wygasła, zaloguj się ponownie" | Session cookie wygasł podczas przeglądania |
| 403 | Forbidden | Toast "Brak uprawnień do wykonania tej akcji" | Worker próbuje usunąć sprzęt |
| 404 | Not Found | Toast "Nie znaleziono" + redirect do listy | Equipment usunięty przez innego użytkownika |
| 409 | Conflict | Toast z szczegółami konfliktu | Duplikat serial_number, użytkownik ma wpisy |
| 500 | Server Error | Toast "Wystąpił błąd serwera. Spróbuj ponownie." + retry button | Backend error |
| Network | Connection | Toast "Brak połączenia z serwerem. Sprawdź połączenie internetowe." + retry | Offline, server down |

### 7.3 Empty States

| Kontekst | UI Implementacja |
|----------|------------------|
| Brak sprzętu (żadnego) | EmptyState: ilustracja + "Brak sprzętu w bazie. Dodaj pierwszy sprzęt." + CTA "Dodaj sprzęt" |
| Brak wyników filtrowania | EmptyState: "Nie znaleziono sprzętu spełniającego kryteria." + CTA "Wyczyść filtry" |
| Brak wpisów serwisowych dla sprzętu | EmptyState: "Brak wpisów serwisowych. Dodaj pierwszy wpis." + CTA "Dodaj wpis" |
| Brak pracowników (oprócz owner) | EmptyState: "Brak pracowników. Dodaj pierwszego pracownika." + CTA "Dodaj pracownika" |
| Brak ostatnich wpisów (dashboard) | EmptyState: ilustracja + "Brak ostatnich wpisów" (bez CTA) |

### 7.4 Edge Cases

| Scenariusz | Obsługa UI |
|------------|------------|
| Długi opis w timeline (>200 znaków) | "Read more" button, expand z smooth animation, "Show less" po expand |
| Jednoczesna edycja (MVP) | Last-write-wins, brak conflict detection |
| Usuwanie sprzętu z wieloma wpisami | AlertDialog: "Ta akcja usunie również X wpisów serwisowych. Czy na pewno?" |
| Użytkownik ma wpisy (nie można usunąć) | Toast: "Nie można usunąć - użytkownik ma przypisane wpisy serwisowe" (409) |
| Próba usunięcia własnego konta | Button disabled + tooltip "Nie możesz usunąć własnego konta" |
| Pagination na ostatniej stronie (niepełna) | Disable "Next" button, show "Showing X-Y of Z items" |
| Wiele aktywnych filtrów | Badge dla każdego filtra z X (remove), "Wyczyść wszystkie" button |
| Equipment ID nie znaleziony (search) | Toast "Nie znaleziono sprzętu o podanym ID", input cleared |
| Formularz z niezapisanymi zmianami + ESC | Confirmation dialog "Masz niezapisane zmiany. Czy na pewno chcesz zamknąć?" |

## 8. Wzorce UX i dostępności

### 8.1 Feedback Patterns

**Immediate Feedback**:
- Inline validation w formularzach (po blur lub real-time dla format validation)
- Loading states na przyciskach (disabled + spinner)
- Optimistic updates dla mutations (immediate UI update, revert on error)

**Delayed Feedback**:
- Toast notifications dla API responses (success: auto-dismiss 3-5s, error: manual dismiss)
- Skeleton loaders dla list (lepszy perceived performance niż spinner)

**Confirmation Patterns**:
- AlertDialog dla destructive actions (usuwanie)
- Informacja o konsekwencjach (cascade delete, nie można cofnąć)
- "Anuluj" jako default focus (safer)

### 8.2 Accessibility Compliance (WCAG AA)

**Keyboard Navigation**:
- Wszystkie interaktywne elementy dostępne przez Tab/Shift+Tab
- Enter activates buttons/links, Space activates buttons
- Escape closes modals/drawers/dropdowns
- Arrow keys w dropdown menus i comboboxes
- Focus visible (outline) dla wszystkich focusable elements

**Focus Management**:
- Focus trap w modals i drawers (Tab nie wychodzi poza dialog)
- Restore focus po zamknięciu modala (powrót do triggering element)
- Focus na pierwszy input po otwarciu formularza
- Focus na pierwsze pole z błędem po failed validation

**Screen Reader Support**:
- Semantic HTML (nav, main, aside, article, section)
- ARIA labels dla ikon bez tekstu (icon buttons)
- ARIA live regions dla dynamic content (toast notifications, loading states)
- ARIA expanded/collapsed dla collapsible sections
- ARIA sort dla sortable table columns
- ARIA current dla active navigation item

**Color & Contrast**:
- Wszystkie kombinacje tekst/tło spełniają kontrast 4.5:1 (text) lub 3:1 (UI components)
- Nie tylko kolor dla rozróżnienia - ikony + text labels + patterns
- Service type badges: kolor + ikona + text label
- Disabled state: visual + attribute (disabled/aria-disabled)

**Forms**:
- Labels explicitly powiązane z inputs (for/id)
- Helper text dla złożonych pól (format expectations)
- Error messages announced (aria-live lub aria-describedby)
- Required fields oznaczone (visual + aria-required)
- Autocomplete attributes dla standard fields (email, password, name)

### 8.3 Responsive Patterns

**Mobile-First Components**:
- Cards zamiast tabel dla listy sprzętu i użytkowników
- Bottom sheet dla akcji (alternatywa dla dropdown)
- Hamburger menu zamiast horizontal nav
- Sticky header z collapsed actions (dropdown/overflow menu)
- Touch-friendly hit areas (minimum 44x44px)

**Breakpoint Strategy**:
- Mobile (<768px): Single column, cards, hamburger, bottom sheets
- Tablet (768px-1024px): 2 columns gdzie sensowne, adaptive tables (hide non-critical columns)
- Desktop (>1024px): Multi-column, full tables, persistent sidebar nav

**Content Priority**:
- Najważniejsze informacje widoczne bez scrollowania (above the fold)
- Progressive disclosure dla secondary info (expandable sections)
- Skippable content (skip to main, skip navigation) dla keyboard users

## 9. Performance Considerations

### 9.1 Initial Load Optimization

- **Astro SSR**: HTML renderowany na serwerze, szybkie First Contentful Paint
- **Partial Hydration**: React tylko dla interaktywnych komponentów (forms, modals, timeline)
- **Code Splitting**: Dynamic imports dla heavy components (date picker, combobox)
- **CSS**: Tailwind z purge, critical CSS inline, reszta w external stylesheet
- **Fonts**: Self-hosted, preloaded, system font stack fallback

### 9.2 Runtime Performance

- **Server-side Pagination**: Limit 50-100 items per page, brak virtual scrolling w MVP
- **TanStack Query Cache**: 
  - Stale time: 30s dla list, 60s dla szczegółów
  - Cache time: 5 minut
  - Prefetching następnej strony paginacji
- **Optimistic Updates**: Immediate UI update, revert on error (lepszy perceived performance)
- **Debouncing**: Search inputs, filters (300ms)
- **Memoization**: Expensive computations, stable references w React (useMemo, useCallback)

### 9.3 Perceived Performance

- **Skeleton Loaders**: Zamiast spinnerów dla list (pokazują strukturę, lepszy UX)
- **Optimistic Updates**: UI update przed API response
- **Instant Feedback**: Loading states natychmiast po akcji (button disabled + spinner)
- **Prefetching**: Następna strona paginacji, linked resources (equipment details z listy)
- **Smooth Transitions**: Astro view transitions dla page navigation, CSS transitions dla state changes

## 10. Security Considerations na poziomie UI

### 10.1 Authentication Flow

- **Session Management**: Supabase Auth z HTTP-only cookies (Secure, SameSite)
- **Auto-logout**: Redirect do `/login` jeśli session expired (401)
- **CSRF Protection**: Supabase handles token validation

### 10.2 Authorization UI Patterns

- **Role-based Rendering**: useUserRole() hook dla conditional rendering
- **Complete Hiding**: Akcje niedostępne dla roli całkowicie ukryte (nie disabled)
- **Server-side Backup**: Zawsze server-side check (middleware) dla protected routes i API calls
- **Graceful Degradation**: UI działa bez JS (forms submit, navigation), ale z ograniczoną funkcjonalnością

### 10.3 Input Validation & Sanitization

- **Client-side Validation**: Zod schemas dla wszystkich formularzy (format, length, required)
- **Server-side Validation**: Duplikacja walidacji w API (nigdy nie ufaj client-side tylko)
- **XSS Prevention**: React automatic escaping, dangerous HTML explicitly marked (dangerouslySetInnerHTML avoided)
- **SQL Injection**: Supabase parameterized queries (ORM level protection)

### 10.4 Sensitive Data Handling

- **Passwords**: Type="password", toggle visibility (ikona), nigdy nie wyświetlane
- **Tokens**: Stored w HTTP-only cookies, nigdy w localStorage/sessionStorage
- **Error Messages**: Generic messages dla security-sensitive errors (nie "user not found", tylko "invalid credentials")
- **Logging**: No sensitive data w console.log (removed w production build)

## 11. Data Flow i State Management

### 11.1 Global State (React Context)

**UserContext**:
```typescript
interface UserContextValue {
  user: User | null;
  role: 'owner' | 'worker' | null;
  isOwner: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
}
```

**Provider**: App root level (layout), ładuje user z `GET /api/auth/me` on mount

**Consumers**: Wszystkie protected components (useUserRole hook)

### 11.2 Server Cache (TanStack Query)

**Query Keys Structure**:
```typescript
['equipment', 'list', { page, limit, sort, order, category }]
['equipment', 'detail', equipmentId]
['service-entries', 'list', { equipmentId, page, limit }]
['service-entries', 'detail', entryId]
['users', 'list', { page, limit }]
```

**Cache Configuration**:
- Stale time: 30s dla list, 60s dla details
- Cache time: 5 minut
- Retry: 1 dla mutations, 3 dla queries
- Refetch on window focus: tylko dla krytycznych danych (listy)

**Cache Invalidation**:
- Po mutation success (create/update/delete) → invalidate related queries
- Przykład: Po dodaniu sprzętu → invalidate `['equipment', 'list']`

### 11.3 Local Component State

**Forms** (react-hook-form):
- Form state (values, dirty, errors)
- Zod resolver dla validation
- Submit handlers wywołują TanStack Query mutations

**UI State** (useState):
- Modal/drawer open/close
- Expanded/collapsed sections (read more)
- Mobile menu open/close
- Loading states (local, nie z API)

**Complex Form Logic** (useReducer):
- Multi-step forms (future)
- Form arrays (dynamic fields)

### 11.4 Persistent State (localStorage)

**Auto-save Forms**:
- Equipment form → `equipment-form-draft`
- Service entry form → `service-entry-form-draft`
- Cleared on successful submit lub explicit discard

**User Preferences** (future):
- Theme (dark/light mode)
- Preferred sort order
- Pagination limit

## 12. Testing Strategy (UI perspective)

### 12.1 E2E Tests (Playwright)

**Minimalny test (PRD requirement)**:
1. Login → dashboard
2. Add equipment → verify in list
3. Equipment details → add service entry
4. Verify entry in timeline

**Rozszerzone testy** (post-MVP):
- Role-based access (worker nie widzi delete buttons, users page)
- Error scenarios (validation, 409 conflicts, network errors)
- Responsive (mobile, tablet, desktop)
- Accessibility (keyboard navigation, screen reader)

### 12.2 Manual Testing Checklist

**Każdy widok**:
- [ ] Działa na mobile, tablet, desktop
- [ ] Skeleton loaders podczas ładowania
- [ ] Empty states wyświetlają się poprawnie
- [ ] Error states wyświetlają się poprawnie
- [ ] Keyboard navigation działa
- [ ] Screen reader announcements

**Formularze**:
- [ ] Inline validation działa
- [ ] Submit success → toast + proper action (redirect/close)
- [ ] Submit error → proper toast/inline errors
- [ ] ESC zamyka modal (z confirmation jeśli unsaved changes)
- [ ] Auto-save działa
- [ ] Recovery z localStorage po przypadkowym zamknięciu

**Role-based UI**:
- [ ] Owner widzi wszystkie akcje
- [ ] Worker nie widzi delete buttons
- [ ] Worker nie widzi link do /users
- [ ] Worker nie ma dostępu do /users (redirect + toast)

## 13. Future Enhancements (Post-MVP)

Funkcjonalności poza scope MVP, które mogą wymagać zmian w architekturze UI:

### 13.1 QR Codes
- Nowy widok: Equipment label print preview
- Component: QRCodeGenerator
- PDF generation dla druku etykiet

### 13.2 Attachments
- Upload komponenty dla zdjęć/dokumentów w service entries
- Gallery view dla attachments
- File storage integration (Supabase Storage)

### 13.3 Advanced Search
- Full-text search (nie tylko equipment ID)
- Advanced filters (date range, performer, multi-field)
- Search results highlighting

### 13.4 Notifications
- Email/push notifications dla przeterminowanych przeglądów
- In-app notification center
- Notification preferences

### 13.5 Multi-tenancy
- Organization switcher w navigation
- Subdomain routing
- Organization settings page

### 13.6 Reports
- Report builder UI
- PDF export
- Charts i wykresy (trends, statistics)

### 13.7 Dark Mode
- Theme toggle w user menu
- Theme persistence (localStorage)
- CSS variables dla colors

### 13.8 Offline Support
- Service Worker dla offline functionality
- Queue mutations podczas offline
- Sync po powrocie online

### 13.9 Audit Log
- Dedicated page `/audit-log`
- Filter by user, action type, date range
- Detailed view dla każdej akcji

### 13.10 Mobile App
- React Native lub PWA
- Mobile-specific optimizations
- Native features (camera dla QR scan, push notifications)

---

## Podsumowanie

Architektura UI dla ServiceRegistry MVP została zaprojektowana z myślą o:

1. **Użyteczności**: Intuicyjne interfejsy, jasne feedback, minimalna ilość kliknięć do wykonania akcji
2. **Dostępności**: WCAG AA compliance, keyboard navigation, screen reader support
3. **Bezpieczeństwie**: Role-based rendering, server-side protection, input validation
4. **Performance**: SSR, partial hydration, optimistic updates, caching
5. **Skalowalności**: Modular components, clear separation of concerns, extensible patterns

Główne widoki (Login, Dashboard, Equipment List/Details, User Management) pokrywają wszystkie user stories z PRD. Komponenty są zaprojektowane jako reusable i accessible. Data flow wykorzystuje proven patterns (React Context, TanStack Query, react-hook-form). Error handling i loading states zapewniają smooth UX nawet przy błędach API czy wolnym połączeniu.

Architektura jest gotowa do implementacji z jasno określonymi komponentami, data flow i integration points z API.