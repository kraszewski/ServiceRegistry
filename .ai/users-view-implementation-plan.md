# Plan implementacji widoku Zarządzania Użytkownikami

## 1. Przegląd

Widok Zarządzania Użytkownikami (`/users`) służy do przeglądania i zarządzania kontami wszystkich użytkowników systemu ServiceRegistry. Jest to narzędzie administracyjne dostępne wyłącznie dla użytkowników z rolą `owner`, umożliwiające dodawanie nowych pracowników oraz usuwanie kont pracowników.

Główne funkcje widoku:
- Wyświetlanie paginowanej listy wszystkich użytkowników (owner i worker)
- Dodawanie nowych kont pracowników (rola worker)
- Usuwanie kont pracowników (z ograniczeniami bezpieczeństwa)
- Responsywny layout (tabela na desktop, karty na mobile)
- Wyświetlanie informacji o rolach użytkowników za pomocą kolorowych badges
- Ochrona przed usunięciem własnego konta oraz kont innych ownerów
- Obsługa konfliktów przy próbie usunięcia użytkowników z przypisanymi wpisami serwisowymi

## 2. Routing widoku

**Ścieżka:** `/users`

**Plik strony Astro:** `src/pages/users/index.astro`

**Ochrona trasy:**
- Wymaga uwierzytelnienia (sprawdzane w middleware)
- Dostępna **wyłącznie** dla roli `owner`
- Worker próbujący dostać się do `/users` → redirect do `/equipment` z toast error "Brak uprawnień"
- Brak sesji → redirect do `/login`

**Query Parameters:**
| Parametr | Typ | Domyślna | Opis |
|----------|-----|----------|------|
| `page` | number | 1 | Numer strony (1-indexed) |
| `limit` | number | 50 | Elementy na stronę (max 100) |

**Przykład URL:** `/users?page=2&limit=25`

## 3. Struktura komponentów

```
users/index.astro (Strona Astro - SSR)
└── Layout.astro
    └── UsersPage (React - client:load)
        ├── PageHeader
        │   ├── Heading "Zarządzanie Użytkownikami"
        │   └── Button "+ Dodaj Pracownika"
        ├── UsersTable (desktop: md+)
        │   ├── TableHeader (kolumny: Email, Imię, Rola, Data utworzenia, Akcje)
        │   └── TableRow[]
        │       ├── RoleBadge
        │       └── UserRowActions (przycisk usuń)
        ├── UsersCardList (mobile: <md)
        │   └── UserCard[]
        │       ├── RoleBadge
        │       └── Button "Usuń"
        ├── Pagination
        │   ├── PrevButton
        │   ├── PageNumbers
        │   ├── NextButton
        │   └── PaginationInfo ("Showing X-Y of Z")
        ├── EmptyState (warunkowo)
        ├── UsersTableSkeleton / UsersCardSkeleton (loading)
        ├── AddUserDialog (modal do dodawania pracownika)
        └── DeleteUserAlertDialog (potwierdzenie usunięcia)
```

## 4. Szczegóły komponentów

### 4.1 UsersPage

**Opis:** Główny komponent React zarządzający całym widokiem zarządzania użytkownikami. Obsługuje pobieranie danych, koordynację między komponentami potomnymi oraz operacje dodawania i usuwania użytkowników.

**Główne elementy:**
- Container div z klasami layoutu
- PageHeader na górze (sticky)
- Warunkowe renderowanie: UsersTable (desktop) lub UsersCardList (mobile)
- Pagination na dole
- EmptyState gdy brak użytkowników
- AddUserDialog (modal do dodawania pracownika)
- DeleteUserAlertDialog (modal potwierdzenia usunięcia)

**Obsługiwane interakcje:**
- Inicjalizacja stanu z URL query params przy mount
- Aktualizacja URL przy zmianie strony
- Otwieranie/zamykanie modala dodawania pracownika
- Otwieranie dialogu potwierdzenia usunięcia
- Wywołanie mutacji usunięcia po potwierdzeniu
- Obsługa optimistic updates

**Obsługiwana walidacja:**
- Walidacja parametrów URL przy inicjalizacji (fallback do domyślnych)
- Sprawdzenie czy użytkownik próbuje usunąć własne konto (button disabled + tooltip)
- Sprawdzenie czy target jest ownerem (button hidden)

**Typy:**
- `PaginationParams` - parametry zapytania
- `UserListResponse` - odpowiedź API
- `UserListViewModel` - wewnętrzny stan widoku

**Propsy:** Brak (komponent root-level)

---

### 4.2 PageHeader

**Opis:** Sticky header widoku z tytułem strony i przyciskiem dodawania pracownika. Pozostaje widoczny podczas scrollowania.

**Główne elementy:**
- `<header>` z klasą `sticky top-0 z-10 bg-background`
- `<h1>` z tekstem "Zarządzanie Użytkownikami"
- `<Button>` z tekstem "+ Dodaj Pracownika" i wariantem `default`

**Obsługiwane interakcje:**
- `onAddClick` - kliknięcie przycisku dodawania pracownika

**Obsługiwana walidacja:** Brak

**Typy:** Brak specjalnych typów

**Propsy:**
```typescript
interface PageHeaderProps {
  title: string;
  onAddClick: () => void;
}
```

---

### 4.3 UsersTable

**Opis:** Tabela użytkowników wyświetlana na urządzeniach desktop (md breakpoint i większe). Zawiera kolumny z danymi użytkowników oraz kolumnę Akcje z przyciskiem usuwania.

**Główne elementy:**
- Shadcn/ui `Table` component
- `TableHeader` z `TableHead` dla każdej kolumny
- `TableBody` z `TableRow` dla każdego użytkownika
- `TableCell` dla każdej kolumny
- `RoleBadge` w kolumnie roli

**Kolumny:**
1. Email (`email`)
2. Imię (`name`)
3. Rola (`role`) - wyświetlana jako RoleBadge
4. Data utworzenia (`created_at`) - formatowana jako DD.MM.YYYY
5. Akcje - przycisk "Usuń" (warunkowo)

**Obsługiwane interakcje:**
- `onDelete` - kliknięcie przycisku usuwania (otwiera AlertDialog potwierdzenia)
- Tooltip na disabled button: "Nie możesz usunąć własnego konta"
- Keyboard: Tab przez wiersze i przyciski akcji

**Obsługiwana walidacja:**
- Własne konto: przycisk disabled z tooltipem "Nie możesz usunąć własnego konta"
- Inny owner: przycisk hidden (nie renderowany)
- Worker: przycisk widoczny i aktywny

**Typy:**
- `UserListItemDTO`

**Propsy:**
```typescript
interface UsersTableProps {
  data: UserListItemDTO[];
  currentUserId: string;
  onDelete: (user: UserListItemDTO) => void;
}
```

**Atrybuty ARIA:**
- `aria-label="Lista użytkowników"` na tabeli
- `aria-label="Usuń użytkownika"` na przycisku usuwania
- `aria-disabled="true"` na disabled button
- Tooltip z `role="tooltip"`

---

### 4.4 UserRowActions

**Opis:** Komponent akcji wyświetlany w kolumnie "Akcje" tabeli. Zawiera przycisk usuwania z logiką warunkowego renderowania.

**Główne elementy:**
- Container `<div>` z `flex justify-end`
- `Button` z ikoną `Trash2` (usuwanie) - wariant `ghost`, rozmiar `icon`, destructive
- `Tooltip` na disabled button z komunikatem "Nie możesz usunąć własnego konta"

**Obsługiwane interakcje:**
- `onDelete` - kliknięcie ikony usuwania
- Hover tooltip dla disabled state

**Obsługiwana walidacja:**
- Jeśli `user.id === currentUserId`: button disabled + tooltip
- Jeśli `user.role === 'owner'`: button nie renderowany (null)
- W przeciwnym razie: button aktywny

**Typy:**
- `UserListItemDTO`

**Propsy:**
```typescript
interface UserRowActionsProps {
  user: UserListItemDTO;
  currentUserId: string;
  onDelete: (user: UserListItemDTO) => void;
}
```

---

### 4.5 UserCard

**Opis:** Karta pojedynczego użytkownika wyświetlana na urządzeniach mobile. Kompaktowa prezentacja kluczowych danych z przyciskiem usuwania.

**Główne elementy:**
- Shadcn/ui `Card` component
- `CardHeader` z imieniem i emailem
- `RoleBadge` z ikoną
- `CardContent` z datą utworzenia
- `CardFooter` z przyciskiem "Usuń" (warunkowo)

**Obsługiwane interakcje:**
- `onDelete` - kliknięcie przycisku usuwania
- Keyboard: Tab, Enter/Space na przycisku

**Obsługiwana walidacja:**
- Własne konto: button disabled + tooltip
- Inny owner: button nie renderowany
- Worker: button aktywny

**Typy:**
- `UserListItemDTO`

**Propsy:**
```typescript
interface UserCardProps {
  user: UserListItemDTO;
  currentUserId: string;
  onDelete: (user: UserListItemDTO) => void;
}
```

---

### 4.6 UsersCardList

**Opis:** Kontener dla listy kart użytkowników w widoku mobile. Vertical stack z odstępami.

**Główne elementy:**
- Container `<div>` z `flex flex-col gap-4`
- `UserCard` dla każdego użytkownika

**Obsługiwane interakcje:**
- Przekazuje `onDelete` do potomnych `UserCard`

**Obsługiwana walidacja:** Brak

**Typy:**
- `UserListItemDTO[]`

**Propsy:**
```typescript
interface UsersCardListProps {
  data: UserListItemDTO[];
  currentUserId: string;
  onDelete: (user: UserListItemDTO) => void;
}
```

---

### 4.7 RoleBadge

**Opis:** Badge wyświetlający rolę użytkownika z odpowiednią ikoną i kolorem.

**Główne elementy:**
- Shadcn/ui `Badge` component
- Ikona odpowiadająca roli (Lucide icons)
- Tekst roli (przetłumaczony)

**Mapowanie ról:**
| Rola | Ikona | Wariant badge | Label |
|------|-------|---------------|-------|
| owner | `Shield` | `default` (primary color) | Właściciel |
| worker | `User` | `secondary` | Pracownik |

**Obsługiwane interakcje:** Brak (komponent prezentacyjny)

**Obsługiwana walidacja:** Brak

**Typy:**
- `UserRole` - 'owner' | 'worker'

**Propsy:**
```typescript
interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md';
}
```

---

### 4.8 Pagination

**Opis:** Kontrolki paginacji z przyciskami poprzednia/następna strona, numerami stron i informacją o wyświetlanych elementach.

**Główne elementy:**
- Container `<nav>` z `aria-label="Pagination"`
- Button "Poprzednia" (disabled na pierwszej stronie)
- Numery stron (max 5 widocznych, z elipsą)
- Button "Następna" (disabled na ostatniej stronie)
- Tekst "Showing X-Y of Z users"

**Obsługiwane interakcje:**
- `onPageChange` - zmiana strony

**Obsługiwana walidacja:**
- `page` musi być >= 1 i <= totalPages

**Typy:**
- `PaginationMeta`

**Propsy:**
```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}
```

---

### 4.9 EmptyState

**Opis:** Stan pusty wyświetlany gdy brak użytkowników (tylko owner w systemie).

**Główne elementy:**
- Container z centrowaniem
- Ilustracja/ikona (Users icon)
- Nagłówek "Brak pracowników"
- Opis "Dodaj pierwszego pracownika, aby rozpocząć współpracę."
- CTA Button "Dodaj Pracownika"

**Obsługiwane interakcje:**
- `onAction` - kliknięcie CTA (otwiera AddUserDialog)

**Obsługiwana walidacja:** Brak

**Typy:** Brak

**Propsy:**
```typescript
interface EmptyStateProps {
  onAddUser: () => void;
}
```

---

### 4.10 UsersTableSkeleton

**Opis:** Skeleton loader dla tabeli podczas ładowania danych.

**Główne elementy:**
- Shadcn/ui `Skeleton` components
- Struktura naśladująca tabelę (nagłówki + wiersze placeholder)
- Liczba wierszy odpowiadająca limitowi (domyślnie 10)

**Obsługiwane interakcje:** Brak

**Obsługiwana walidacja:** Brak

**Typy:** Brak

**Propsy:**
```typescript
interface UsersTableSkeletonProps {
  rowCount?: number;
}
```

---

### 4.11 UsersCardSkeleton

**Opis:** Skeleton loader dla kart w widoku mobile.

**Główne elementy:**
- Shadcn/ui `Skeleton` w formie karty
- Placeholder dla nagłówka, badge, daty

**Obsługiwane interakcje:** Brak

**Obsługiwana walidacja:** Brak

**Typy:** Brak

**Propsy:**
```typescript
interface UsersCardSkeletonProps {
  count?: number;
}
```

---

### 4.12 AddUserDialog

**Opis:** Modal dialog do dodawania nowego pracownika. Zawiera formularz z walidacją. Zawsze tworzy konto z rolą `worker`.

**Główne elementy:**
- Shadcn/ui `Dialog` component
- `DialogHeader` z tytułem "Dodaj Pracownika"
- Formularz z polami:
  - Email (wymagane)
  - Hasło (wymagane, min 8 znaków, ukryte)
  - Imię/Nazwa (wymagane)
- Przyciski: Anuluj, Dodaj

**Obsługiwane interakcje:**
- Wypełnienie formularza
- Submit formularza (POST /api/users)
- Anulowanie (zamknięcie modala)
- Toggle pokazywania hasła (ikona oka)

**Obsługiwana walidacja:**
- `email`: wymagane, format email, max 255 znaków
- `password`: wymagane, min 8 znaków, max 72 znaków
- `name`: wymagane, min 1, max 100 znaków

**Typy:**
- `CreateUserCommand`

**Propsy:**
```typescript
interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (user: UserListItemDTO) => void;
}
```

---

### 4.13 DeleteUserAlertDialog

**Opis:** Dialog potwierdzenia usunięcia użytkownika. Wyświetla ostrzeżenie o nieodwracalności operacji oraz informację o potencjalnym konflikcie (409).

**Główne elementy:**
- Shadcn/ui `AlertDialog` component
- `AlertDialogHeader` z tytułem "Usunąć użytkownika?"
- `AlertDialogDescription` z informacjami:
  - "Ta akcja jest nieodwracalna."
  - "Użytkownik **{email}** zostanie trwale usunięty."
  - "Uwaga: Jeśli użytkownik ma przypisane wpisy serwisowe, nie będzie można go usunąć."
- `AlertDialogFooter` z przyciskami "Anuluj" i "Usuń"
- Przycisk "Usuń" z wariantem `destructive`

**Obsługiwane interakcje:**
- `onConfirm` - potwierdzenie usunięcia
- `onCancel` - anulowanie (zamknięcie dialogu)

**Obsługiwana walidacja:** Brak

**Typy:**
- `UserListItemDTO`

**Propsy:**
```typescript
interface DeleteUserAlertDialogProps {
  user: UserListItemDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
}
```

## 5. Typy

### 5.1 Typy z `src/types.ts` (istniejące)

```typescript
// DTO elementu listy użytkowników
interface UserListItemDTO {
  id: string;           // UUID z profiles.id
  email: string;        // Email z auth.users
  name: string;         // Nazwa z profiles.name
  role: UserRole;       // Rola z profiles.role ('owner' | 'worker')
  created_at: string;   // Data utworzenia z profiles.created_at
}

// Enum ról
type UserRole = 'owner' | 'worker';

// Odpowiedź paginowana
interface UserListResponse {
  data: UserListItemDTO[];
  pagination: PaginationMeta;
}

// Metadane paginacji
interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Parametry paginacji
interface PaginationParams {
  page?: number;      // default: 1
  limit?: number;     // default: 50, max: 100
}

// Command do tworzenia użytkownika
interface CreateUserCommand {
  email: string;
  password: string;
  name: string;
}

// Odpowiedź sukcesu usunięcia
interface DeleteResponse {
  message: string;
}

// Odpowiedź błędu
interface ErrorResponse {
  error: string;
  details?: Record<string, string[]> | Record<string, unknown>;
}
```

### 5.2 Nowe typy ViewModel (do utworzenia w komponencie)

```typescript
// Stan widoku użytkowników
interface UsersViewState {
  page: number;
  limit: number;
  addUserDialog: {
    open: boolean;
  };
  deleteDialog: {
    open: boolean;
    user: UserListItemDTO | null;
  };
}

// Wynik hooka useUser (current user z kontekstu)
interface UseUserResult {
  user: User | null;
  userId: string | null;
  role: UserRole | null;
  isOwner: boolean;
  isLoading: boolean;
}
```

### 5.3 Mapowanie ról (stałe)

```typescript
// src/lib/constants/user-roles.ts
import { Shield, User } from 'lucide-react';
import type { UserRole } from '../../types';

export const USER_ROLE_CONFIG: Record<UserRole, {
  label: string;
  icon: typeof Shield | typeof User;
  variant: 'default' | 'secondary';
}> = {
  owner: {
    label: 'Właściciel',
    icon: Shield,
    variant: 'default',
  },
  worker: {
    label: 'Pracownik',
    icon: User,
    variant: 'secondary',
  },
};
```

## 6. Zarządzanie stanem

### 6.1 URL State (source of truth)

Stan paginacji jest przechowywany w URL query parameters. Umożliwia to:
- Bookmarkowanie konkretnego widoku
- Udostępnianie linków
- Nawigację przeglądarką (back/forward)

**Custom hook `useUsersListParams`:**
```typescript
// src/components/hooks/useUsersListParams.ts
export function useUsersListParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const params: PaginationParams = {
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: parseInt(searchParams.get('limit') || '50', 10),
  };
  
  // Walidacja i defaults
  if (params.page < 1) params.page = 1;
  if (params.limit < 1 || params.limit > 100) params.limit = 50;
  
  const setParams = (newParams: Partial<PaginationParams>) => {
    const updated = { ...params, ...newParams };
    const sp = new URLSearchParams();
    if (updated.page > 1) sp.set('page', String(updated.page));
    if (updated.limit !== 50) sp.set('limit', String(updated.limit));
    setSearchParams(sp);
  };
  
  const resetParams = () => setSearchParams({});
  
  return { params, setParams, resetParams };
}
```

### 6.2 Server State (TanStack Query)

Dane użytkowników są pobierane i cache'owane przez TanStack Query.

**Custom hook `useUsersList`:**
```typescript
// src/components/hooks/useUsersList.ts
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { PaginationParams, UserListResponse } from '../../types';
import { fetchUsersList } from '../../lib/api/users';

export function useUsersList(params: PaginationParams) {
  return useQuery({
    queryKey: ['users', 'list', params],
    queryFn: () => fetchUsersList(params),
    staleTime: 30_000, // 30 sekund
    placeholderData: keepPreviousData, // zachowaj poprzednie dane podczas ładowania
  });
}
```

**Mutation hook `useCreateUser`:**
```typescript
// src/components/hooks/useCreateUser.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateUserCommand, UserListItemDTO } from '../../types';
import { createUser } from '../../lib/api/users';

export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (command: CreateUserCommand) => createUser(command),
    onSuccess: () => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] });
    },
  });
}
```

**Mutation hook `useDeleteUser`:**
```typescript
// src/components/hooks/useDeleteUser.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteUser } from '../../lib/api/users';

export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] });
    },
  });
}
```

### 6.3 Local UI State

Stan lokalny komponentu dla UI:

```typescript
// W komponencie UsersPage

// Dialog dodawania użytkownika
const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);

// Dialog potwierdzenia usunięcia
const [deleteDialogState, setDeleteDialogState] = useState<{
  open: boolean;
  user: UserListItemDTO | null;
}>({
  open: false,
  user: null,
});

// Helpery do otwierania dialogów
const openAddUserDialog = () => setAddUserDialogOpen(true);
const closeAddUserDialog = () => setAddUserDialogOpen(false);
const openDeleteDialog = (user: UserListItemDTO) => 
  setDeleteDialogState({ open: true, user });
const closeDeleteDialog = () => 
  setDeleteDialogState({ open: false, user: null });
```

### 6.4 Responsive State

Hook do wykrywania breakpointu:

```typescript
// src/components/hooks/useMediaQuery.ts
export function useIsMobile() {
  return useMediaQuery('(max-width: 767px)');
}
```

### 6.5 Current User State

Dane zalogowanego użytkownika pobierane z kontekstu, używane do:
- Sprawdzenia czy user próbuje usunąć własne konto
- Wyświetlenia tooltipa na disabled button

```typescript
// W komponencie UsersPage
const { userId } = useUser();

// Przekazywanie do komponentów potomnych
<UsersTable 
  data={users.data}
  currentUserId={userId}
  onDelete={openDeleteDialog}
/>
```

## 7. Integracja API

### 7.1 Pobieranie listy użytkowników

**Endpoint:** `GET /api/users`

**Parametry żądania:**
```typescript
interface PaginationParams {
  page?: number;      // default: 1
  limit?: number;     // default: 50, max: 100
}
```

**Odpowiedź sukcesu (200):**
```typescript
interface UserListResponse {
  data: UserListItemDTO[];
  pagination: PaginationMeta;
}
```

**Błędy:**
- `401 Unauthorized` - Brak sesji / wygasła
- `403 Forbidden` - User nie jest ownerem
- `500 Internal Server Error` - Błąd serwera

**Funkcja fetch:**
```typescript
// src/lib/api/users.ts
export async function fetchUsersList(
  params: PaginationParams
): Promise<UserListResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  
  const response = await fetch(`/api/users?${searchParams}`);
  
  if (!response.ok) {
    if (response.status === 401) {
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    if (response.status === 403) {
      window.location.href = '/equipment';
      throw new Error('Forbidden');
    }
    throw new Error(await response.text());
  }
  
  return response.json();
}
```

### 7.2 Tworzenie użytkownika

**Endpoint:** `POST /api/users`

**Body żądania:**
```typescript
interface CreateUserCommand {
  email: string;
  password: string;
  name: string;
}
```

**Odpowiedź sukcesu (201):**
```typescript
interface UserListItemDTO {
  id: string;
  email: string;
  name: string;
  role: 'worker'; // zawsze worker
  created_at: string;
}
```

**Błędy:**
- `400 Bad Request` - Walidacja failed
- `401 Unauthorized` - Brak sesji
- `403 Forbidden` - User nie jest ownerem
- `409 Conflict` - Email już istnieje
- `500 Internal Server Error` - Błąd serwera

**Funkcja mutation (create):**
```typescript
// src/lib/api/users.ts
export async function createUser(
  command: CreateUserCommand
): Promise<UserListItemDTO> {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(response.status, error);
  }
  
  return response.json();
}
```

### 7.3 Usuwanie użytkownika

**Endpoint:** `DELETE /api/users/{id}`

**Odpowiedź sukcesu (200):**
```typescript
interface DeleteResponse {
  message: string;
}
```

**Błędy:**
- `401 Unauthorized` - Brak sesji
- `403 Forbidden` - User nie jest ownerem / próba usunięcia własnego konta / próba usunięcia innego ownera
- `404 Not Found` - User nie istnieje
- `409 Conflict` - User ma przypisane wpisy serwisowe (RESTRICT constraint)
- `500 Internal Server Error` - Błąd serwera

**Funkcja mutation (delete):**
```typescript
// src/lib/api/users.ts
export async function deleteUser(userId: string): Promise<DeleteResponse> {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(response.status, error);
  }
  
  return response.json();
}

// Klasa błędu API
export class ApiError extends Error {
  constructor(
    public status: number,
    public body: ErrorResponse
  ) {
    super(body.error);
    this.name = 'ApiError';
  }
}
```

## 8. Interakcje użytkownika

### 8.1 Paginacja

1. Użytkownik klika numer strony lub strzałkę
2. Aktualizowany jest URL (`?page=X`)
3. Pokazuje się loading skeleton na liście
4. TanStack Query refetchuje dane (poprzednie dane widoczne dzięki `keepPreviousData`)
5. Lista aktualizuje się
6. Scroll do góry tabeli

### 8.2 Dodawanie pracownika

1. Użytkownik klika "+ Dodaj Pracownika"
2. Otwiera się AddUserDialog
3. Użytkownik wypełnia formularz (email, hasło, imię)
4. Użytkownik klika "Dodaj"
5. Walidacja client-side (Zod)
6. Jeśli błędy: wyświetlenie inline errors
7. Jeśli OK: `POST /api/users`
8. Loading state na przycisku "Dodaj"
9. **Sukces (201):**
   - Toast "Pracownik dodany pomyślnie"
   - Zamknięcie modala
   - Optimistic update: nowy użytkownik pojawia się na liście
   - Query invalidation: refetch listy w tle
10. **Błąd 409 (duplikat email):**
    - Inline error przy polu email: "Użytkownik o tym adresie email już istnieje"
11. **Błąd 400 (walidacja):**
    - Inline errors przy polach
12. **Błąd 500:**
    - Toast "Wystąpił błąd serwera. Spróbuj ponownie."

### 8.3 Usuwanie pracownika

1. Użytkownik klika przycisk "Usuń" (ikona kosza) w kolumnie Akcje lub na karcie
2. **Jeśli to własne konto:**
   - Przycisk jest disabled
   - Tooltip: "Nie możesz usunąć własnego konta"
   - Kliknięcie nic nie robi
3. **Jeśli to inny owner:**
   - Przycisk jest ukryty (nie renderowany)
4. **Jeśli to worker:**
   - Otwiera się DeleteUserAlertDialog
   - Dialog wyświetla:
     - Email użytkownika
     - Ostrzeżenie o nieodwracalności
     - Info o potencjalnym konflikcie (wpisy serwisowe)
5. Użytkownik klika "Anuluj" → dialog się zamyka, nic się nie dzieje
6. Użytkownik klika "Usuń":
   - `DELETE /api/users/{id}`
   - Loading state na przycisku "Usuń"
7. **Sukces (200):**
   - Toast "Użytkownik usunięty pomyślnie"
   - Zamknięcie dialogu
   - Optimistic update: użytkownik znika z listy
   - Query invalidation: refetch listy w tle
8. **Błąd 403 (własne konto):**
   - Toast "Nie możesz usunąć własnego konta"
   - Zamknięcie dialogu
9. **Błąd 403 (próba usunięcia ownera):**
   - Toast "Nie można usunąć właściciela"
   - Zamknięcie dialogu
10. **Błąd 404:**
    - Toast "Użytkownik nie został znaleziony"
    - Zamknięcie dialogu
    - Refetch listy
11. **Błąd 409 (wpisy serwisowe):**
    - Toast z długim komunikatem: "Nie można usunąć - użytkownik ma przypisane wpisy serwisowe. Usuń najpierw wszystkie wpisy lub zmień wykonawcę."
    - Zamknięcie dialogu
    - Lista pozostaje bez zmian
12. **Błąd 500:**
    - Toast "Wystąpił błąd serwera. Spróbuj ponownie."

### 8.4 Keyboard Navigation

- **Tab**: Przechodzenie przez interaktywne elementy (przyciski)
- **Enter/Space** na przycisku: Wykonanie akcji
- **Escape** w modalu: Zamyka modal
- **Escape** w alert dialog: Zamyka dialog (anulowanie)

### 8.5 Responsywność

- **Desktop (≥768px):** Tabela z kolumnami
- **Mobile (<768px):** Karty w vertical stack
- Automatyczne przełączanie za pomocą `useIsMobile()` hook

## 9. Warunki i walidacja

### 9.1 Walidacja parametrów URL

| Parametr | Warunki | Fallback |
|----------|---------|----------|
| `page` | integer >= 1 | 1 |
| `limit` | integer 1-100 | 50 |

### 9.2 Walidacja formularza dodawania pracownika

| Pole | Warunki | Komunikat błędu |
|------|---------|-----------------|
| `email` | wymagane, format email, max 255 znaków | "Email jest wymagany" / "Nieprawidłowy format email" / "Max 255 znaków" |
| `password` | wymagane, min 8 znaków, max 72 znaków | "Hasło jest wymagane" / "Hasło musi mieć min. 8 znaków" / "Max 72 znaki" |
| `name` | wymagane, min 1, max 100 znaków | "Imię jest wymagane" / "Max 100 znaków" |

### 9.3 Zod Schema dla formularza

```typescript
// src/lib/schemas/user-form.schema.ts
import { z } from 'zod';

export const createUserFormSchema = z.object({
  email: z
    .string()
    .min(1, 'Email jest wymagany')
    .email('Nieprawidłowy format email')
    .max(255, 'Email może mieć maksymalnie 255 znaków'),
  password: z
    .string()
    .min(1, 'Hasło jest wymagane')
    .min(8, 'Hasło musi mieć minimum 8 znaków')
    .max(72, 'Hasło może mieć maksymalnie 72 znaki'),
  name: z
    .string()
    .min(1, 'Imię jest wymagane')
    .max(100, 'Imię może mieć maksymalnie 100 znaków'),
});

export type CreateUserFormInput = z.infer<typeof createUserFormSchema>;
```

### 9.4 Warunki uprawnień

**Dostęp do widoku `/users`:**
- Wymaga roli `owner`
- Worker → redirect do `/equipment` + toast error

**Przycisk usuwania:**
- Nie renderowany (hidden) gdy `user.role === 'owner'`
- Disabled z tooltipem gdy `user.id === currentUserId`
- Aktywny w pozostałych przypadkach (worker, nie ja)

**Server-side validation (endpoint):**
- `DELETE /api/users/{id}` sprawdza:
  1. Czy user jest ownerem (403 jeśli nie)
  2. Czy targetId !== currentUserId (403 jeśli tak)
  3. Czy target nie jest ownerem (403 jeśli tak)
  4. Czy target ma wpisy serwisowe (409 jeśli tak - RESTRICT)

## 10. Obsługa błędów

### 10.1 Błędy API - pobieranie listy

| Kod | Przyczyna | Obsługa UI |
|-----|-----------|------------|
| 400 | Nieprawidłowe parametry | Toast "Nieprawidłowe parametry", reset do defaults |
| 401 | Brak sesji / wygasła | Redirect do `/login` + toast "Sesja wygasła" |
| 403 | User nie jest ownerem | Redirect do `/equipment` + toast "Brak uprawnień" |
| 500 | Błąd serwera | EmptyState z komunikatem + przycisk "Spróbuj ponownie" |
| Network error | Brak połączenia | Toast "Brak połączenia z serwerem" + retry button |

### 10.2 Błędy API - tworzenie użytkownika

| Kod | Przyczyna | Obsługa UI |
|-----|-----------|------------|
| 400 | Walidacja server-side | Inline errors przy polach |
| 401 | Brak sesji | Redirect do `/login` |
| 403 | User nie jest ownerem | Redirect do `/equipment` + toast "Brak uprawnień" |
| 409 | Duplikat email | Inline error przy polu email: "Użytkownik o tym adresie email już istnieje" |
| 500 | Błąd serwera | Toast "Wystąpił błąd serwera. Spróbuj ponownie." |

### 10.3 Błędy API - usuwanie użytkownika

| Kod | Przyczyna | Obsługa UI |
|-----|-----------|------------|
| 401 | Brak sesji | Redirect do `/login` |
| 403 | User nie jest ownerem | Toast "Brak uprawnień" |
| 403 | Próba usunięcia własnego konta | Toast "Nie możesz usunąć własnego konta" |
| 403 | Próba usunięcia innego ownera | Toast "Nie można usunąć właściciela" |
| 404 | User nie istnieje | Toast "Użytkownik nie został znaleziony" + zamknij dialog + refetch |
| 409 | User ma wpisy serwisowe | Toast "Nie można usunąć - użytkownik ma przypisane wpisy serwisowe. Usuń najpierw wszystkie wpisy lub zmień wykonawcę." |
| 500 | Błąd serwera | Toast "Wystąpił błąd serwera. Spróbuj ponownie." |

### 10.4 Error Boundary

Komponent React error boundary dla całego widoku:

```typescript
// W komponencie UsersPage - wrap w ErrorBoundary
<ErrorBoundary
  fallback={
    <EmptyState
      variant="error"
      title="Wystąpił nieoczekiwany błąd"
      description="Odśwież stronę lub spróbuj ponownie później."
      action={{ 
        label: "Odśwież stronę", 
        onClick: () => window.location.reload() 
      }}
    />
  }
>
  {/* Komponenty widoku */}
</ErrorBoundary>
```

### 10.5 Retry Logic

TanStack Query automatycznie ponawia nieudane requesty:
- Queries: 3 próby z exponential backoff
- Mutations: bez retry (użytkownik decyduje poprzez kliknięcie "Spróbuj ponownie")

### 10.6 Toast messages

Używanie biblioteki `sonner` (Shadcn/ui toast) do wyświetlania komunikatów:

```typescript
import { toast } from 'sonner';

// Sukces
toast.success('Pracownik dodany pomyślnie');
toast.success('Użytkownik usunięty pomyślnie');

// Błąd
toast.error('Nie można usunąć - użytkownik ma przypisane wpisy serwisowe.');
toast.error('Wystąpił błąd serwera. Spróbuj ponownie.');

// Info
toast.info('Sesja wygasła. Zaloguj się ponownie.');
```

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików

1. Utworzenie strony Astro: `src/pages/users/index.astro`
2. Utworzenie folderu komponentów: `src/components/users/`
3. Utworzenie pliku stałych: `src/lib/constants/user-roles.ts`
4. Utworzenie schematu walidacji: `src/lib/schemas/user-form.schema.ts`

### Krok 2: Implementacja custom hooków

1. `useUsersListParams` - zarządzanie stanem URL (paginacja)
2. `useUsersList` - TanStack Query hook dla pobierania listy
3. `useCreateUser` - TanStack Query mutation hook dla tworzenia
4. `useDeleteUser` - TanStack Query mutation hook dla usuwania
5. `useIsMobile` - wykrywanie breakpointów (jeśli nie istnieje)
6. `useUser` - pobieranie danych zalogowanego użytkownika (jeśli nie istnieje)

### Krok 3: Implementacja funkcji API

1. `fetchUsersList` - pobieranie listy użytkowników (`GET /api/users`)
2. `createUser` - tworzenie użytkownika (`POST /api/users`)
3. `deleteUser` - usuwanie użytkownika (`DELETE /api/users/{id}`)
4. `ApiError` - klasa błędu API (jeśli nie istnieje)

### Krok 4: Implementacja komponentów prezentacyjnych

1. `RoleBadge` - badge roli z ikoną i kolorem
2. `EmptyState` - stan pusty (brak pracowników)
3. `UsersTableSkeleton` - skeleton loader dla tabeli
4. `UsersCardSkeleton` - skeleton loader dla kart
5. `Pagination` - kontrolki paginacji (jeśli nie istnieje jako komponent reużywalny)

### Krok 5: Implementacja komponentów listy

1. `UserRowActions` - przycisk usuwania w wierszu tabeli (z warunkami)
2. `UsersTable` - tabela desktop z kolumnami i akcjami
3. `UserCard` - karta mobile z przyciskiem usuwania
4. `UsersCardList` - lista kart mobile

### Krok 6: Implementacja formularzy i dialogów

1. `AddUserDialog` - modal z formularzem dodawania pracownika
2. Integracja z react-hook-form i Zod
3. Toggle pokazywania hasła (ikona oka)
4. Obsługa sukcesu i błędów dla tworzenia
5. `DeleteUserAlertDialog` - dialog potwierdzenia usunięcia
6. Obsługa warunku 409 Conflict (wpisy serwisowe)

### Krok 7: Implementacja głównego komponentu

1. `PageHeader` - sticky header z tytułem i przyciskiem
2. `UsersPage` - główny komponent łączący wszystko
3. Logika przełączania między tabelą a kartami (responsive)
4. Integracja z hookami i API
5. Obsługa optimistic updates

### Krok 8: Implementacja strony Astro

1. Utworzenie `users/index.astro`
2. Import Layout i UsersPage
3. Konfiguracja `client:load` dla React component
4. Server-side sprawdzenie roli (middleware)
5. Redirect do `/equipment` jeśli worker

### Krok 9: Implementacja middleware (jeśli potrzebne)

1. Rozszerzenie `src/middleware/index.ts`
2. Dodanie sprawdzenia roli dla trasy `/users`
3. Redirect do `/equipment` z parametrem błędu jeśli worker

### Krok 10: Testowanie i poprawki

1. Testowanie manualne wszystkich interakcji:
   - Pobieranie listy użytkowników
   - Paginacja
   - Dodawanie pracownika (sukces, błąd 409, błąd 400)
   - Usuwanie pracownika (sukces, błąd 409, próba usunięcia własnego konta)
2. Testowanie responsywności (mobile, tablet, desktop)
3. Testowanie dostępności (keyboard navigation, screen reader, tooltips)
4. Testowanie error states
5. Sprawdzenie lintera i poprawienie błędów
6. Code review i refactoring

### Krok 11: Dokumentacja

1. Dodanie komentarzy JSDoc do komponentów
2. Aktualizacja README jeśli potrzebna
3. Sprawdzenie spójności z resztą aplikacji (np. widokiem Equipment)

---

**Uwagi końcowe:**

- Plan oparty jest na istniejącym wzorcu z widoku Equipment
- Wszystkie komponenty powinny używać Shadcn/ui i Tailwind 4
- Komunikaty błędów powinny być po polsku
- Optimistic updates dla lepszego UX
- Server-side i client-side authorization dla bezpieczeństwa
- Walidacja na każdym poziomie (client, server, database)
