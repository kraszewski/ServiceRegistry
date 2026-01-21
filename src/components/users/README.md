# Users Management View

Widok zarządzania użytkownikami systemu ServiceRegistry.

## Opis

Widok dostępny pod adresem `/users` umożliwia właścicielom (owner) zarządzanie kontami pracowników:
- Przeglądanie listy wszystkich użytkowników z paginacją
- Dodawanie nowych kont pracowników (rola: worker)
- Usuwanie kont pracowników (z ograniczeniami bezpieczeństwa)

## Uprawnienia

- **Dostęp:** Wyłącznie dla użytkowników z rolą `owner`
- **Worker:** Przekierowanie do `/equipment` przy próbie dostępu
- **Brak sesji:** Przekierowanie do `/login`

## Struktura komponentów

```
UsersApp (wrapper z providers)
└── UsersPage (główny komponent)
    ├── PageHeader
    │   ├── Tytuł "Zarządzanie Użytkownikami"
    │   └── Przycisk "+ Dodaj Pracownika"
    ├── UsersTable (desktop: ≥768px)
    │   ├── Kolumny: Email, Imię, Rola, Data utworzenia, Akcje
    │   └── UserRowActions (przycisk usuń z warunkami)
    ├── UsersCardList (mobile: <768px)
    │   └── UserCard[]
    │       ├── RoleBadge
    │       └── Przycisk "Usuń" (warunkowy)
    ├── Pagination
    ├── UsersEmptyState (gdy brak pracowników)
    ├── UsersTableSkeleton / UsersCardSkeleton (loading)
    ├── AddUserDialog (modal dodawania)
    └── DeleteUserAlertDialog (potwierdzenie usunięcia)
```

## Funkcje

### Dodawanie pracownika

- Formularz z polami: email, hasło, imię
- Walidacja client-side (Zod) i server-side
- Obsługa konfliktów (409 - duplikat email)
- Toast notifications

### Usuwanie pracownika

**Ograniczenia bezpieczeństwa:**
- Nie można usunąć własnego konta (przycisk disabled + tooltip)
- Nie można usunąć kont ownerów (przycisk ukryty)
- Nie można usunąć pracownika z przypisanymi wpisami serwisowymi (409 Conflict)

**Proces:**
1. Kliknięcie przycisku "Usuń"
2. Alert dialog z potwierdzeniem
3. DELETE /api/users/{id}
4. Toast notification + refetch listy

### Paginacja

- Parametry URL: `?page=1&limit=50`
- Domyślne: 50 elementów na stronę (max 100)
- Kontrolki: Poprzednia/Następna + numery stron
- Info: "Wyświetlanie X-Y z Z"

### Responsywność

- **Desktop (≥768px):** Tabela z kolumnami
- **Mobile (<768px):** Karty w pionowym stosie
- Automatyczne przełączanie przez `useIsMobile()` hook

## Pliki

### Komponenty
- `UsersApp.tsx` - Wrapper z providers (QueryClient, Toaster)
- `UsersPage.tsx` - Główny komponent z logiką
- `UsersTable.tsx` - Tabela desktop
- `UsersCardList.tsx` - Lista kart mobile
- `UserCard.tsx` - Karta użytkownika mobile
- `UserRowActions.tsx` - Akcje w wierszu tabeli
- `RoleBadge.tsx` - Badge roli z ikoną
- `UsersEmptyState.tsx` - Stan pusty
- `UsersTableSkeleton.tsx` - Skeleton loader dla tabeli
- `UsersCardSkeleton.tsx` - Skeleton loader dla kart
- `AddUserDialog.tsx` - Modal dodawania pracownika
- `DeleteUserAlertDialog.tsx` - Dialog potwierdzenia usunięcia
- `index.ts` - Eksporty

### Hooki
- `useUsersList.ts` - TanStack Query hook dla pobierania listy
- `useUsersListParams.ts` - Zarządzanie parametrami URL
- `useCreateUser.ts` - Mutation dla tworzenia
- `useDeleteUser.ts` - Mutation dla usuwania

### API
- `lib/api/users.ts` - Funkcje fetch dla API endpoints

### Stałe i schematy
- `lib/constants/user-roles.ts` - Konfiguracja ról (label, ikona, wariant)
- `lib/schemas/user-form.schema.ts` - Zod schema walidacji

### Strona
- `pages/users/index.astro` - Strona Astro z ochroną dostępu

## API Endpoints

### GET /api/users
Pobieranie listy użytkowników z paginacją.

**Query params:**
- `page` (number, default: 1)
- `limit` (number, default: 50, max: 100)

**Response:** `UserListResponse` z `data[]` i `pagination`

### POST /api/users
Tworzenie nowego pracownika.

**Body:** `CreateUserCommand` (email, password, name)

**Response:** `UserListItemDTO`

**Błędy:**
- 409: Duplikat email
- 400: Błędy walidacji

### DELETE /api/users/{id}
Usuwanie użytkownika.

**Response:** `DeleteResponse`

**Błędy:**
- 403: Brak uprawnień / własne konto / próba usunięcia ownera
- 404: Użytkownik nie istnieje
- 409: Użytkownik ma przypisane wpisy serwisowe

## Typy

```typescript
// z src/types.ts
interface UserListItemDTO {
  id: string;
  email: string;
  name: string;
  role: UserRole; // 'owner' | 'worker'
  created_at: string;
}

interface CreateUserCommand {
  email: string;
  password: string;
  name: string;
}

type UserRole = 'owner' | 'worker';
```

## Accessibility

- ARIA labels na tabelach i przyciskach
- Keyboard navigation (Tab, Enter/Space, Escape)
- Tooltips na disabled buttons
- Screen reader support

## Wzorzec implementacji

Widok został zaimplementowany według wzorca z widoku Equipment:
- Podobna struktura komponentów
- Spójne nazewnictwo i style
- Reużywanie komponentów (Pagination, skeletons)
- TanStack Query dla state management
- URL state dla paginacji
