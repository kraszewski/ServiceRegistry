# Plan implementacji widoku Listy Sprzętu (Equipment List)

## 1. Przegląd

Widok Listy Sprzętu (`/equipment`) służy do przeglądania i zarządzania całym inwentarzem sprzętu w systemie ServiceRegistry. Jest to główny punkt dostępu do danych o sprzęcie dla wszystkich uwierzytelnionych użytkowników (role: owner i worker).

Główne funkcje widoku:
- Wyświetlanie paginowanej listy sprzętu z możliwością sortowania
- Filtrowanie po kategorii sprzętu
- Responsywny layout (tabela na desktop, karty na mobile)
- Przycisk dodawania nowego sprzętu (otwierający modal)
- Nawigacja do szczegółów sprzętu przez kliknięcie wiersza/karty
- Synchronizacja stanu filtrów/sortowania/paginacji z URL (możliwość bookmarkowania)

## 2. Routing widoku

**Ścieżka:** `/equipment`

**Plik strony Astro:** `src/pages/equipment/index.astro`

**Ochrona trasy:**
- Wymaga uwierzytelnienia (sprawdzane w middleware)
- Dostępna dla wszystkich ról (owner i worker)
- Brak sesji → redirect do `/login`

**Query Parameters:**
| Parametr | Typ | Domyślna | Opis |
|----------|-----|----------|------|
| `page` | number | 1 | Numer strony (1-indexed) |
| `limit` | number | 50 | Elementy na stronę (max 100) |
| `sort` | string | `created_at` | Pole sortowania |
| `order` | string | `desc` | Kierunek: `asc` \| `desc` |
| `category` | string | - | Filtr kategorii |

**Przykład URL:** `/equipment?sort=name&order=asc&category=computer&page=2`

## 3. Struktura komponentów

```
equipment/index.astro (Strona Astro - SSR)
└── Layout.astro
    └── EquipmentListPage (React - client:load)
        ├── PageHeader
        │   ├── Heading "Sprzęt"
        │   └── Button "+ Dodaj sprzęt"
        ├── FilterBar
        │   ├── CategoryCombobox
        │   └── ActiveFiltersBadges
        │       └── Badge[] (z przyciskiem X)
        ├── EquipmentTable (desktop: md+)
        │   ├── TableHeader (sortowalne kolumny + kolumna Akcje)
        │   └── TableRow[] (klikalne)
        │       └── EquipmentRowActions (ikony edycji/usuwania)
        ├── EquipmentCardList (mobile: <md)
        │   └── EquipmentCard[] (klikalne, z akcjami w dropdown)
        ├── Pagination
        │   ├── PrevButton
        │   ├── PageNumbers
        │   ├── NextButton
        │   └── PaginationInfo ("Showing X-Y of Z")
        ├── EmptyState (warunkowo)
        ├── EquipmentTableSkeleton / EquipmentCardSkeleton (loading)
        ├── EquipmentFormDialog (modal do dodawania/edycji)
        └── DeleteEquipmentDialog (modal potwierdzenia usunięcia)
```

## 4. Szczegóły komponentów

### 4.1 EquipmentListPage

**Opis:** Główny komponent React zarządzający całym widokiem listy sprzętu. Obsługuje pobieranie danych, synchronizację z URL i koordynację między komponentami potomnymi. Zarządza również operacjami CRUD (dodawanie, edycja, usuwanie).

**Główne elementy:**
- Container div z klasami layoutu
- PageHeader na górze (sticky)
- FilterBar poniżej headera
- Warunkowe renderowanie: EquipmentTable (desktop) lub EquipmentCardList (mobile)
- Pagination na dole
- EmptyState gdy brak wyników
- EquipmentFormDialog (modal do dodawania/edycji)
- DeleteEquipmentDialog (modal potwierdzenia usunięcia)

**Obsługiwane interakcje:**
- Inicjalizacja stanu z URL query params przy mount
- Aktualizacja URL przy zmianach filtrów/sortowania/strony
- Otwieranie/zamykanie modala dodawania sprzętu
- Otwieranie modala edycji z danymi wybranego sprzętu
- Otwieranie dialogu potwierdzenia usunięcia
- Wywołanie mutacji usunięcia po potwierdzeniu

**Obsługiwana walidacja:**
- Walidacja parametrów URL przy inicjalizacji (fallback do domyślnych przy błędnych wartościach)

**Typy:**
- `EquipmentListParams` - parametry zapytania
- `EquipmentListResponse` - odpowiedź API
- `EquipmentListViewModel` - wewnętrzny stan widoku

**Propsy:** Brak (komponent root-level)

---

### 4.2 PageHeader

**Opis:** Sticky header widoku z tytułem strony i przyciskiem akcji. Pozostaje widoczny podczas scrollowania.

**Główne elementy:**
- `<header>` z klasą `sticky top-0`
- `<h1>` z tekstem "Sprzęt"
- `<Button>` z tekstem "+ Dodaj sprzęt" i wariantem `default`

**Obsługiwane interakcje:**
- `onAddClick` - kliknięcie przycisku dodawania

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

### 4.3 FilterBar

**Opis:** Pasek filtrów i sortowania. Zawiera combobox do wyboru kategorii oraz badges pokazujące aktywne filtry.

**Główne elementy:**
- Container `<div>` z flexbox layout
- `CategoryCombobox` - wybór kategorii
- `ActiveFiltersBadges` - aktywne filtry

**Obsługiwane interakcje:**
- `onCategoryChange` - zmiana wybranej kategorii
- `onClearFilter` - usunięcie pojedynczego filtra
- `onClearAllFilters` - wyczyszczenie wszystkich filtrów

**Obsługiwana walidacja:**
- Kategoria musi być jedną z wartości enum `EquipmentCategory`

**Typy:**
- `EquipmentCategory` - enum kategorii

**Propsy:**
```typescript
interface FilterBarProps {
  selectedCategory: EquipmentCategory | null;
  onCategoryChange: (category: EquipmentCategory | null) => void;
  onClearAllFilters: () => void;
}
```

---

### 4.4 CategoryCombobox

**Opis:** Multi-select combobox z listą kategorii sprzętu. Każda opcja ma ikonę odpowiadającą kategorii.

**Główne elementy:**
- Shadcn/ui `Combobox` component
- `Command` z listą kategorii
- Ikony dla każdej kategorii (np. Monitor, Printer, Phone)

**Obsługiwane interakcje:**
- Wybór/odznaczenie kategorii
- Wyszukiwanie w liście kategorii (filtrowanie opcji)

**Obsługiwana walidacja:**
- Tylko wartości z enum `EquipmentCategory` są akceptowane

**Typy:**
- `EquipmentCategory`

**Propsy:**
```typescript
interface CategoryComboboxProps {
  value: EquipmentCategory | null;
  onChange: (value: EquipmentCategory | null) => void;
}
```

---

### 4.5 ActiveFiltersBadges

**Opis:** Wyświetla badges reprezentujące aktywne filtry z możliwością ich usunięcia.

**Główne elementy:**
- Container `<div>` z flexbox i gap
- `Badge` dla każdego aktywnego filtra
- Przycisk X w każdym badge do usunięcia filtra
- Opcjonalny przycisk "Wyczyść wszystkie" gdy wiele filtrów

**Obsługiwane interakcje:**
- `onRemoveFilter` - kliknięcie X na badge
- `onClearAll` - kliknięcie "Wyczyść wszystkie"

**Obsługiwana walidacja:** Brak

**Typy:**
- `ActiveFilter` - typ reprezentujący aktywny filtr

**Propsy:**
```typescript
interface ActiveFilter {
  type: 'category';
  value: string;
  label: string;
}

interface ActiveFiltersBadgesProps {
  filters: ActiveFilter[];
  onRemoveFilter: (filter: ActiveFilter) => void;
  onClearAll: () => void;
}
```

---

### 4.6 EquipmentTable

**Opis:** Tabela sprzętu wyświetlana na urządzeniach desktop (md breakpoint i większe). Zawiera sortowalne nagłówki kolumn i klikalne wiersze.

**Główne elementy:**
- Shadcn/ui `Table` component
- `TableHeader` z `TableHead` dla każdej kolumny
- Ikony sortowania (strzałka góra/dół) w nagłówkach
- `TableBody` z `TableRow` dla każdego elementu
- `TableCell` dla każdej kolumny
- `CategoryBadge` w kolumnie kategorii

**Kolumny:**
1. Equipment ID (`equipment_id`)
2. Nazwa (`name`)
3. Producent (`manufacturer`)
4. Model (`model`)
5. Kategoria (`category`)
6. Data dodania (`created_at`)
7. Akcje (ikony edycji i usuwania)

**Obsługiwane interakcje:**
- `onSort` - kliknięcie nagłówka kolumny (sortowanie)
- `onRowClick` - kliknięcie wiersza (nawigacja do szczegółów)
- `onEdit` - kliknięcie ikony edycji (otwiera EquipmentFormDialog w trybie edycji)
- `onDelete` - kliknięcie ikony usuwania (otwiera AlertDialog potwierdzenia) - tylko owner
- Keyboard: Tab przez wiersze, Enter otwiera szczegóły

**Obsługiwana walidacja:** Brak

**Typy:**
- `EquipmentListItemDTO`
- `SortConfig`

**Propsy:**
```typescript
interface SortConfig {
  field: 'created_at' | 'name' | 'equipment_id' | 'category' | 'manufacturer';
  order: 'asc' | 'desc';
}

interface EquipmentTableProps {
  data: EquipmentListItemDTO[];
  sortConfig: SortConfig;
  onSort: (field: SortConfig['field']) => void;
  onRowClick: (equipment: EquipmentListItemDTO) => void;
  onEdit: (equipment: EquipmentListItemDTO) => void;
  onDelete: (equipment: EquipmentListItemDTO) => void;
  isOwner: boolean;
}
```

**Atrybuty ARIA:**
- `aria-sort="ascending"` lub `aria-sort="descending"` na aktywnie sortowanej kolumnie
- `role="button"` i `tabindex="0"` na wierszach
- `aria-label` na przyciskach akcji (np. "Edytuj sprzęt", "Usuń sprzęt")

---

### 4.7 EquipmentCard

**Opis:** Karta pojedynczego elementu sprzętu wyświetlana na urządzeniach mobile. Kompaktowa prezentacja kluczowych danych z przyciskami akcji.

**Główne elementy:**
- Shadcn/ui `Card` component
- `CardHeader` z nazwą i Equipment ID
- `CategoryBadge` z ikoną
- `CardContent` z metadanymi (producent, model, data)
- `CardFooter` z przyciskami akcji (edytuj, usuń)
- `DropdownMenu` dla akcji (alternatywnie) z ikoną "więcej" (trzy kropki)

**Obsługiwane interakcje:**
- `onClick` - kliknięcie karty (nawigacja do szczegółów)
- `onEdit` - kliknięcie przycisku/opcji edycji
- `onDelete` - kliknięcie przycisku/opcji usuwania (tylko owner)
- Keyboard: Enter/Space otwiera szczegóły

**Obsługiwana walidacja:** Brak

**Typy:**
- `EquipmentListItemDTO`

**Propsy:**
```typescript
interface EquipmentCardProps {
  equipment: EquipmentListItemDTO;
  onClick: (equipment: EquipmentListItemDTO) => void;
  onEdit: (equipment: EquipmentListItemDTO) => void;
  onDelete: (equipment: EquipmentListItemDTO) => void;
  isOwner: boolean;
}
```

---

### 4.8 EquipmentCardList

**Opis:** Kontener dla listy kart sprzętu w widoku mobile. Vertical stack z odstępami.

**Główne elementy:**
- Container `<div>` z `flex flex-col gap-4`
- `EquipmentCard` dla każdego elementu

**Obsługiwane interakcje:**
- Przekazuje `onClick`, `onEdit`, `onDelete` do potomnych `EquipmentCard`

**Obsługiwana walidacja:** Brak

**Typy:**
- `EquipmentListItemDTO[]`

**Propsy:**
```typescript
interface EquipmentCardListProps {
  data: EquipmentListItemDTO[];
  onItemClick: (equipment: EquipmentListItemDTO) => void;
  onEdit: (equipment: EquipmentListItemDTO) => void;
  onDelete: (equipment: EquipmentListItemDTO) => void;
  isOwner: boolean;
}
```

---

### 4.8a EquipmentRowActions

**Opis:** Komponent akcji wyświetlany w kolumnie "Akcje" tabeli. Zawiera ikony edycji i usuwania.

**Główne elementy:**
- Container `<div>` z `flex gap-2`
- `Button` z ikoną `Pencil` (edycja) - wariant `ghost`, rozmiar `icon`
- `Button` z ikoną `Trash2` (usuwanie) - wariant `ghost`, rozmiar `icon`, destructive - tylko dla owner
- `Tooltip` na każdym przycisku z opisem akcji

**Obsługiwane interakcje:**
- `onEdit` - kliknięcie ikony edycji
- `onDelete` - kliknięcie ikony usuwania
- `e.stopPropagation()` - zapobiega propagacji do wiersza (nie otwiera szczegółów)

**Obsługiwana walidacja:** Brak

**Typy:**
- `EquipmentListItemDTO`

**Propsy:**
```typescript
interface EquipmentRowActionsProps {
  equipment: EquipmentListItemDTO;
  onEdit: (equipment: EquipmentListItemDTO) => void;
  onDelete: (equipment: EquipmentListItemDTO) => void;
  isOwner: boolean;
}
```

---

### 4.8b DeleteEquipmentDialog

**Opis:** Dialog potwierdzenia usunięcia sprzętu. Informuje o konsekwencjach (cascade delete wpisów serwisowych).

**Główne elementy:**
- Shadcn/ui `AlertDialog` component
- `AlertDialogHeader` z tytułem "Usunąć sprzęt?"
- `AlertDialogDescription` z ostrzeżeniem o usunięciu powiązanych wpisów
- `AlertDialogFooter` z przyciskami "Anuluj" i "Usuń"
- Przycisk "Usuń" z wariantem `destructive`

**Tekst ostrzeżenia:**
"Ta akcja jest nieodwracalna. Sprzęt **{equipment_id} - {name}** oraz wszystkie powiązane wpisy serwisowe zostaną trwale usunięte."

**Obsługiwane interakcje:**
- `onConfirm` - potwierdzenie usunięcia
- `onCancel` - anulowanie (zamknięcie dialogu)

**Obsługiwana walidacja:** Brak

**Typy:**
- `EquipmentListItemDTO`

**Propsy:**
```typescript
interface DeleteEquipmentDialogProps {
  equipment: EquipmentListItemDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
}
```

---

### 4.9 Pagination

**Opis:** Kontrolki paginacji z przyciskami poprzednia/następna strona, numerami stron i informacją o wyświetlanych elementach.

**Główne elementy:**
- Container `<nav>` z `aria-label="Pagination"`
- Button "Poprzednia" (disabled na pierwszej stronie)
- Numery stron (max 5 widocznych, z elipsą)
- Button "Następna" (disabled na ostatniej stronie)
- Tekst "Showing X-Y of Z items"

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

### 4.10 EmptyState

**Opis:** Stan pusty wyświetlany gdy brak wyników. Różne warianty w zależności od kontekstu (brak sprzętu vs brak wyników filtrowania).

**Główne elementy:**
- Container z centrowaniem
- Ilustracja/ikona
- Nagłówek (np. "Brak sprzętu")
- Opis
- CTA Button (opcjonalny)

**Warianty:**
1. **Brak sprzętu (pusta baza):** "Brak sprzętu w bazie. Dodaj pierwszy sprzęt." + CTA "Dodaj sprzęt"
2. **Brak wyników filtrowania:** "Nie znaleziono sprzętu spełniającego kryteria." + CTA "Wyczyść filtry"

**Obsługiwane interakcje:**
- `onAction` - kliknięcie CTA

**Obsługiwana walidacja:** Brak

**Typy:**
- `EmptyStateVariant`

**Propsy:**
```typescript
type EmptyStateVariant = 'no-data' | 'no-results';

interface EmptyStateProps {
  variant: EmptyStateVariant;
  onAction?: () => void;
}
```

---

### 4.11 EquipmentTableSkeleton

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
interface EquipmentTableSkeletonProps {
  rowCount?: number;
}
```

---

### 4.12 EquipmentCardSkeleton

**Opis:** Skeleton loader dla kart w widoku mobile.

**Główne elementy:**
- Shadcn/ui `Skeleton` w formie karty
- Placeholder dla nagłówka, badge, metadanych

**Obsługiwane interakcje:** Brak

**Obsługiwana walidacja:** Brak

**Typy:** Brak

**Propsy:**
```typescript
interface EquipmentCardSkeletonProps {
  count?: number;
}
```

---

### 4.13 CategoryBadge

**Opis:** Badge wyświetlający kategorię sprzętu z odpowiednią ikoną i kolorem.

**Główne elementy:**
- Shadcn/ui `Badge` component
- Ikona odpowiadająca kategorii (Lucide icons)
- Tekst kategorii (przetłumaczony)

**Mapowanie kategorii:**
| Kategoria | Ikona | Kolor | Label |
|-----------|-------|-------|-------|
| computer | `Monitor` | blue | Komputer |
| printer | `Printer` | purple | Drukarka |
| monitor | `Monitor` | cyan | Monitor |
| network_device | `Network` | green | Urządzenie sieciowe |
| phone | `Phone` | pink | Telefon |
| tablet | `Tablet` | orange | Tablet |
| peripheral | `Usb` | gray | Peryferia |
| other | `Box` | slate | Inne |

**Obsługiwane interakcje:** Brak (komponent prezentacyjny)

**Obsługiwana walidacja:** Brak

**Typy:**
- `EquipmentCategory`

**Propsy:**
```typescript
interface CategoryBadgeProps {
  category: EquipmentCategory;
  size?: 'sm' | 'md';
}
```

---

### 4.14 EquipmentFormDialog

**Opis:** Modal dialog do dodawania nowego lub edycji istniejącego sprzętu. Zawiera formularz z walidacją. W trybie edycji wypełnia pola danymi istniejącego sprzętu.

**Główne elementy:**
- Shadcn/ui `Dialog` component
- `DialogHeader` z tytułem:
  - Tryb create: "Dodaj sprzęt"
  - Tryb edit: "Edytuj sprzęt"
- Formularz z polami:
  - Nazwa (wymagane)
  - Kategoria (wymagane, select)
  - Producent (wymagane)
  - Model (wymagane)
  - Numer seryjny (wymagane)
  - Opis (opcjonalne)
  - Lokalizacja (opcjonalne)
  - Data zakupu (opcjonalne, date picker)
- Przyciski: Anuluj, Zapisz

**Obsługiwane interakcje:**
- Wypełnienie formularza
- Submit formularza (POST dla create, PATCH dla edit)
- Anulowanie (zamknięcie modala)
- Auto-save do localStorage (tylko w trybie create)

**Obsługiwana walidacja:**
- `name`: wymagane, min 1, max 100 znaków
- `category`: wymagane, wartość z enum
- `manufacturer`: wymagane, min 1, max 100 znaków
- `model`: wymagane, min 1, max 100 znaków
- `serial_number`: wymagane, min 1, max 100 znaków, unikalny (walidacja API)
- `location`: opcjonalne, max 200 znaków
- `purchase_date`: opcjonalne, format YYYY-MM-DD

**Typy:**
- `CreateEquipmentCommand`
- `UpdateEquipmentCommand`
- `EquipmentListItemDTO` (dla initialData)

**Propsy:**
```typescript
interface EquipmentFormDialogProps {
  mode: 'create' | 'edit';
  equipment?: EquipmentListItemDTO | null; // dane do edycji (wymagane gdy mode='edit')
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (equipment: EquipmentResponseDTO) => void;
}
```

## 5. Typy

### 5.1 Typy z `src/types.ts` (istniejące)

```typescript
// DTO elementu listy
interface EquipmentListItemDTO {
  id: string;
  equipment_id: string;
  name: string;
  category: EquipmentCategory;
  manufacturer: string;
  model: string;
  serial_number: string;
  description: string | null;
  location: string | null;
  purchase_date: string | null;
  created_at: string;
  created_by: UserReference;
}

// Parametry zapytania listy
interface EquipmentListParams extends PaginationParams {
  sort?: 'created_at' | 'name' | 'equipment_id' | 'category' | 'manufacturer';
  order?: 'asc' | 'desc';
  category?: EquipmentCategory;
  search?: string;
}

// Odpowiedź paginowana
interface EquipmentListResponse {
  data: EquipmentListItemDTO[];
  pagination: PaginationMeta;
}

// Metadane paginacji
interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Enum kategorii
type EquipmentCategory = 
  | 'computer' 
  | 'printer' 
  | 'monitor' 
  | 'network_device' 
  | 'phone' 
  | 'tablet' 
  | 'peripheral' 
  | 'other';

// Command do tworzenia sprzętu
interface CreateEquipmentCommand {
  name: string;
  category: EquipmentCategory;
  manufacturer: string;
  model: string;
  serial_number: string;
  description?: string | null;
  location?: string | null;
  purchase_date?: string | null;
}
```

### 5.2 Nowe typy ViewModel (do utworzenia w komponencie)

```typescript
// Konfiguracja sortowania
interface SortConfig {
  field: 'created_at' | 'name' | 'equipment_id' | 'category' | 'manufacturer';
  order: 'asc' | 'desc';
}

// Aktywny filtr do wyświetlenia w badges
interface ActiveFilter {
  type: 'category';
  value: string;
  label: string;
}

// Stan widoku listy
interface EquipmentListViewState {
  page: number;
  limit: number;
  sort: SortConfig;
  category: EquipmentCategory | null;
  formDialog: {
    open: boolean;
    mode: 'create' | 'edit';
    equipment: EquipmentListItemDTO | null;
  };
  deleteDialog: {
    open: boolean;
    equipment: EquipmentListItemDTO | null;
  };
}

// Wariant empty state
type EmptyStateVariant = 'no-data' | 'no-results';

// Wynik hooka useUserRole (z UserContext)
interface UseUserRoleResult {
  user: User | null;
  role: 'owner' | 'worker' | null;
  isOwner: boolean;
  isLoading: boolean;
}
```

### 5.3 Mapowanie kategorii (stałe)

```typescript
// src/lib/constants/equipment-categories.ts
export const EQUIPMENT_CATEGORY_CONFIG: Record<EquipmentCategory, {
  label: string;
  icon: LucideIcon;
  colorClass: string;
}> = {
  computer: { label: 'Komputer', icon: Monitor, colorClass: 'bg-blue-100 text-blue-800' },
  printer: { label: 'Drukarka', icon: Printer, colorClass: 'bg-purple-100 text-purple-800' },
  monitor: { label: 'Monitor', icon: Monitor, colorClass: 'bg-cyan-100 text-cyan-800' },
  network_device: { label: 'Urządzenie sieciowe', icon: Network, colorClass: 'bg-green-100 text-green-800' },
  phone: { label: 'Telefon', icon: Phone, colorClass: 'bg-pink-100 text-pink-800' },
  tablet: { label: 'Tablet', icon: Tablet, colorClass: 'bg-orange-100 text-orange-800' },
  peripheral: { label: 'Peryferia', icon: Usb, colorClass: 'bg-gray-100 text-gray-800' },
  other: { label: 'Inne', icon: Box, colorClass: 'bg-slate-100 text-slate-800' },
};
```

## 6. Zarządzanie stanem

### 6.1 URL State (source of truth)

Stan filtrów, sortowania i paginacji jest przechowywany w URL query parameters. Umożliwia to:
- Bookmarkowanie konkretnego widoku
- Udostępnianie linków z filtrami
- Nawigację przeglądarką (back/forward)

**Custom hook `useEquipmentListParams`:**
```typescript
// src/components/hooks/useEquipmentListParams.ts
export function useEquipmentListParams() {
  // Odczytuje parametry z URL
  // Waliduje i zwraca z defaults
  // Zwraca funkcję do aktualizacji URL
  return {
    params: EquipmentListParams,
    setParams: (newParams: Partial<EquipmentListParams>) => void,
    resetParams: () => void,
  };
}
```

### 6.2 Server State (TanStack Query)

Dane sprzętu są pobierane i cache'owane przez TanStack Query.

**Custom hook `useEquipmentList`:**
```typescript
// src/components/hooks/useEquipmentList.ts
export function useEquipmentList(params: EquipmentListParams) {
  return useQuery({
    queryKey: ['equipment', 'list', params],
    queryFn: () => fetchEquipmentList(params),
    staleTime: 30_000, // 30 sekund
    placeholderData: keepPreviousData, // zachowaj poprzednie dane podczas ładowania
  });
}
```

**Mutation hook `useCreateEquipment`:**
```typescript
// src/components/hooks/useCreateEquipment.ts
export function useCreateEquipment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createEquipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment', 'list'] });
    },
  });
}
```

**Mutation hook `useUpdateEquipment`:**
```typescript
// src/components/hooks/useUpdateEquipment.ts
export function useUpdateEquipment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEquipmentCommand }) => 
      updateEquipment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment', 'list'] });
    },
  });
}
```

**Mutation hook `useDeleteEquipment`:**
```typescript
// src/components/hooks/useDeleteEquipment.ts
export function useDeleteEquipment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteEquipment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment', 'list'] });
    },
  });
}
```

### 6.3 Local UI State

Stan lokalny komponentu dla UI:

```typescript
// W komponencie EquipmentListPage

// Dialog dodawania/edycji
const [formDialogState, setFormDialogState] = useState<{
  open: boolean;
  mode: 'create' | 'edit';
  equipment: EquipmentListItemDTO | null;
}>({
  open: false,
  mode: 'create',
  equipment: null,
});

// Dialog potwierdzenia usunięcia
const [deleteDialogState, setDeleteDialogState] = useState<{
  open: boolean;
  equipment: EquipmentListItemDTO | null;
}>({
  open: false,
  equipment: null,
});

// Helpery do otwierania dialogów
const openCreateDialog = () => setFormDialogState({ open: true, mode: 'create', equipment: null });
const openEditDialog = (eq: EquipmentListItemDTO) => setFormDialogState({ open: true, mode: 'edit', equipment: eq });
const openDeleteDialog = (eq: EquipmentListItemDTO) => setDeleteDialogState({ open: true, equipment: eq });
```

### 6.4 Responsive State

Hook do wykrywania breakpointu:

```typescript
// src/components/hooks/useMediaQuery.ts
export function useIsMobile() {
  return useMediaQuery('(max-width: 767px)');
}
```

### 6.5 User Role State

Rola użytkownika pobierana z kontekstu, używana do warunkowego renderowania akcji:

```typescript
// W komponencie EquipmentListPage
const { isOwner } = useUserRole();

// Przekazywanie do komponentów potomnych
<EquipmentTable 
  // ...inne propsy
  isOwner={isOwner}
  onDelete={isOwner ? openDeleteDialog : undefined}
/>
```

**Zasady widoczności akcji:**
- **Ikona edycji**: Widoczna dla wszystkich użytkowników (owner i worker)
- **Ikona usuwania**: Widoczna tylko dla użytkowników z rolą `owner`
- Worker nie widzi ikony usuwania w ogóle (nie jest disabled, jest całkowicie ukryta)

## 7. Integracja API

### 7.1 Pobieranie listy sprzętu

**Endpoint:** `GET /api/equipment`

**Parametry żądania:**
```typescript
interface EquipmentListParams {
  page?: number;      // default: 1
  limit?: number;     // default: 50, max: 100
  sort?: string;      // default: 'created_at'
  order?: string;     // default: 'desc'
  category?: string;  // filter by category
}
```

**Odpowiedź sukcesu (200):**
```typescript
interface EquipmentListResponse {
  data: EquipmentListItemDTO[];
  pagination: PaginationMeta;
}
```

**Funkcja fetch:**
```typescript
// src/lib/api/equipment.ts
export async function fetchEquipmentList(
  params: EquipmentListParams
): Promise<EquipmentListResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.sort) searchParams.set('sort', params.sort);
  if (params.order) searchParams.set('order', params.order);
  if (params.category) searchParams.set('category', params.category);
  
  const response = await fetch(`/api/equipment?${searchParams}`);
  
  if (!response.ok) {
    throw new Error(await response.text());
  }
  
  return response.json();
}
```

### 7.2 Tworzenie sprzętu

**Endpoint:** `POST /api/equipment`

**Body żądania:**
```typescript
interface CreateEquipmentCommand {
  name: string;
  category: EquipmentCategory;
  manufacturer: string;
  model: string;
  serial_number: string;
  description?: string | null;
  location?: string | null;
  purchase_date?: string | null;
}
```

**Odpowiedź sukcesu (201):**
```typescript
interface EquipmentResponseDTO {
  id: string;
  equipment_id: string;
  name: string;
  category: EquipmentCategory;
  // ... pozostałe pola
}
```

**Funkcja mutation (create):**
```typescript
// src/lib/api/equipment.ts
export async function createEquipment(
  command: CreateEquipmentCommand
): Promise<EquipmentResponseDTO> {
  const response = await fetch('/api/equipment', {
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

### 7.3 Aktualizacja sprzętu

**Endpoint:** `PATCH /api/equipment/{id}`

**Body żądania:**
```typescript
type UpdateEquipmentCommand = Partial<CreateEquipmentCommand>;
```

**Odpowiedź sukcesu (200):** `EquipmentResponseDTO`

**Funkcja mutation (update):**
```typescript
// src/lib/api/equipment.ts
export async function updateEquipment(
  id: string,
  command: UpdateEquipmentCommand
): Promise<EquipmentResponseDTO> {
  const response = await fetch(`/api/equipment/${id}`, {
    method: 'PATCH',
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

### 7.4 Usuwanie sprzętu

**Endpoint:** `DELETE /api/equipment/{id}`

**Odpowiedź sukcesu (200):**
```typescript
interface DeleteResponse {
  message: string;
}
```

**Funkcja mutation (delete):**
```typescript
// src/lib/api/equipment.ts
export async function deleteEquipment(id: string): Promise<DeleteResponse> {
  const response = await fetch(`/api/equipment/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(response.status, error);
  }
  
  return response.json();
}
```

## 8. Interakcje użytkownika

### 8.1 Sortowanie

1. Użytkownik klika nagłówek kolumny w tabeli
2. Jeśli kolumna jest już sortowana:
   - `asc` → zmienia na `desc`
   - `desc` → zmienia na `asc`
3. Jeśli kolumna nie jest sortowana:
   - Ustawia sortowanie `asc` dla tej kolumny
4. Aktualizowany jest URL (`?sort=X&order=Y`)
5. TanStack Query automatycznie refetchuje dane
6. Ikona strzałki w nagłówku aktualizuje się

### 8.2 Filtrowanie po kategorii

1. Użytkownik otwiera CategoryCombobox
2. Wybiera kategorię z listy
3. Aktualizowany jest URL (`?category=X`)
4. Pojawia się badge w ActiveFiltersBadges
5. TanStack Query refetchuje dane
6. Strona resetowana do 1

### 8.3 Usuwanie filtra

1. Użytkownik klika X na badge filtra
2. Parametr usuwany z URL
3. TanStack Query refetchuje dane
4. Badge znika

### 8.4 Paginacja

1. Użytkownik klika numer strony lub strzałkę
2. Aktualizowany jest URL (`?page=X`)
3. Pokazuje się loading spinner na paginacji
4. TanStack Query refetchuje dane (poprzednie dane widoczne)
5. Scroll do góry tabeli

### 8.5 Nawigacja do szczegółów

1. Użytkownik klika wiersz tabeli lub kartę
2. `navigate(`/equipment/${equipment.id}`)`
3. Prefetching szczegółów może być aktywowany przy hover

### 8.6 Dodawanie sprzętu

1. Użytkownik klika "+ Dodaj sprzęt"
2. Otwiera się EquipmentFormDialog
3. Użytkownik wypełnia formularz
4. Auto-save do localStorage co 2 sekundy
5. Użytkownik klika "Zapisz"
6. Walidacja client-side (Zod)
7. Jeśli błędy: wyświetlenie inline errors
8. Jeśli OK: `POST /api/equipment`
9. Loading state na przycisku
10. Sukces (201):
    - Toast "Sprzęt dodany pomyślnie"
    - Wyczyszczenie localStorage
    - Zamknięcie modala
    - Redirect do `/equipment/[id]`
11. Błąd 409 (duplikat serial_number):
    - Toast "Sprzęt o tym numerze seryjnym już istnieje"
12. Błąd 400 (walidacja):
    - Inline errors przy polach
13. Błąd 500:
    - Toast "Wystąpił błąd serwera. Spróbuj ponownie."

### 8.7 Edycja sprzętu

1. Użytkownik klika ikonę edycji (ołówek) w kolumnie Akcje
2. `e.stopPropagation()` zapobiega nawigacji do szczegółów
3. Otwiera się EquipmentFormDialog w trybie `edit`
4. Formularz jest wypełniony danymi wybranego sprzętu
5. Użytkownik modyfikuje pola
6. Użytkownik klika "Zapisz"
7. Walidacja client-side (Zod)
8. Jeśli błędy: wyświetlenie inline errors
9. Jeśli OK: `PATCH /api/equipment/{id}`
10. Loading state na przycisku
11. Sukces (200):
    - Toast "Sprzęt zaktualizowany pomyślnie"
    - Zamknięcie modala
    - Odświeżenie listy (invalidate query)
12. Błąd 404:
    - Toast "Sprzęt nie został znaleziony"
    - Zamknięcie modala
    - Odświeżenie listy
13. Błąd 409 (duplikat serial_number):
    - Inline error przy polu serial_number
14. Błąd 500:
    - Toast "Wystąpił błąd serwera. Spróbuj ponownie."

### 8.8 Usuwanie sprzętu (tylko owner)

1. Użytkownik klika ikonę usuwania (kosz) w kolumnie Akcje
2. `e.stopPropagation()` zapobiega nawigacji do szczegółów
3. Otwiera się DeleteEquipmentDialog z informacją o cascade
4. Dialog wyświetla:
   - Nazwa i ID sprzętu
   - Ostrzeżenie o usunięciu powiązanych wpisów serwisowych
5. Użytkownik klika "Anuluj" → dialog się zamyka, nic się nie dzieje
6. Użytkownik klika "Usuń":
   - `DELETE /api/equipment/{id}`
   - Loading state na przycisku "Usuń"
7. Sukces (200):
   - Toast "Sprzęt usunięty pomyślnie"
   - Zamknięcie dialogu
   - Odświeżenie listy (invalidate query)
8. Błąd 403:
   - Toast "Brak uprawnień do usunięcia sprzętu"
   - Zamknięcie dialogu
9. Błąd 404:
   - Toast "Sprzęt nie został znaleziony"
   - Zamknięcie dialogu
   - Odświeżenie listy
10. Błąd 500:
    - Toast "Wystąpił błąd serwera. Spróbuj ponownie."

### 8.9 Keyboard Navigation

- **Tab**: Przechodzenie przez interaktywne elementy (w tym ikony akcji)
- **Enter/Space** na wierszu tabeli: Otwiera szczegóły
- **Enter/Space** na ikonie edycji: Otwiera dialog edycji
- **Enter/Space** na ikonie usuwania: Otwiera dialog potwierdzenia
- **Escape** w modalu: Zamyka modal (z potwierdzeniem jeśli niezapisane zmiany)
- **Arrow keys** w combobox: Nawigacja po opcjach

## 9. Warunki i walidacja

### 9.1 Walidacja parametrów URL

| Parametr | Warunki | Fallback |
|----------|---------|----------|
| `page` | integer >= 1 | 1 |
| `limit` | integer 1-100 | 50 |
| `sort` | enum: created_at, name, equipment_id, category, manufacturer | created_at |
| `order` | enum: asc, desc | desc |
| `category` | enum: equipment_category lub puste | null |

### 9.2 Walidacja formularza tworzenia sprzętu

| Pole | Warunki | Komunikat błędu |
|------|---------|-----------------|
| `name` | wymagane, 1-100 znaków | "Nazwa jest wymagana" / "Nazwa może mieć max 100 znaków" |
| `category` | wymagane, wartość z enum | "Kategoria jest wymagana" |
| `manufacturer` | wymagane, 1-100 znaków | "Producent jest wymagany" / "Max 100 znaków" |
| `model` | wymagane, 1-100 znaków | "Model jest wymagany" / "Max 100 znaków" |
| `serial_number` | wymagane, 1-100 znaków, unikalny | "Numer seryjny jest wymagany" / "Numer już istnieje" (409) |
| `location` | opcjonalne, max 200 znaków | "Max 200 znaków" |
| `purchase_date` | opcjonalne, format YYYY-MM-DD | "Nieprawidłowy format daty" |

### 9.3 Zod Schema dla formularza

```typescript
// src/lib/schemas/equipment-form.schema.ts
import { z } from 'zod';

export const createEquipmentFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Nazwa jest wymagana')
    .max(100, 'Nazwa może mieć maksymalnie 100 znaków'),
  category: z.enum([
    'computer', 'printer', 'monitor', 'network_device',
    'phone', 'tablet', 'peripheral', 'other'
  ], { required_error: 'Kategoria jest wymagana' }),
  manufacturer: z
    .string()
    .min(1, 'Producent jest wymagany')
    .max(100, 'Producent może mieć maksymalnie 100 znaków'),
  model: z
    .string()
    .min(1, 'Model jest wymagany')
    .max(100, 'Model może mieć maksymalnie 100 znaków'),
  serial_number: z
    .string()
    .min(1, 'Numer seryjny jest wymagany')
    .max(100, 'Numer seryjny może mieć maksymalnie 100 znaków'),
  description: z.string().nullable().optional(),
  location: z
    .string()
    .max(200, 'Lokalizacja może mieć maksymalnie 200 znaków')
    .nullable()
    .optional(),
  purchase_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Nieprawidłowy format daty (oczekiwany: YYYY-MM-DD)')
    .nullable()
    .optional(),
});
```

## 10. Obsługa błędów

### 10.1 Błędy API - pobieranie listy

| Kod | Przyczyna | Obsługa UI |
|-----|-----------|------------|
| 400 | Nieprawidłowe parametry | Toast "Nieprawidłowe parametry", reset do defaults |
| 401 | Brak sesji / wygasła | Redirect do `/login` + toast "Sesja wygasła" |
| 500 | Błąd serwera | EmptyState z komunikatem + przycisk "Spróbuj ponownie" |
| Network error | Brak połączenia | Toast "Brak połączenia z serwerem" + retry button |

### 10.2 Błędy API - tworzenie sprzętu

| Kod | Przyczyna | Obsługa UI |
|-----|-----------|------------|
| 400 | Walidacja server-side | Inline errors przy polach |
| 401 | Brak sesji | Redirect do `/login` |
| 409 | Duplikat serial_number | Toast "Sprzęt o tym numerze seryjnym już istnieje" |
| 500 | Błąd serwera | Toast "Wystąpił błąd serwera. Spróbuj ponownie." |

### 10.3 Błędy API - edycja sprzętu

| Kod | Przyczyna | Obsługa UI |
|-----|-----------|------------|
| 400 | Walidacja server-side | Inline errors przy polach |
| 401 | Brak sesji | Redirect do `/login` |
| 404 | Sprzęt nie istnieje | Toast "Sprzęt nie został znaleziony" + zamknij modal + odśwież listę |
| 409 | Duplikat serial_number | Inline error przy polu serial_number |
| 500 | Błąd serwera | Toast "Wystąpił błąd serwera. Spróbuj ponownie." |

### 10.4 Błędy API - usuwanie sprzętu

| Kod | Przyczyna | Obsługa UI |
|-----|-----------|------------|
| 401 | Brak sesji | Redirect do `/login` |
| 403 | Użytkownik nie jest owner | Toast "Brak uprawnień do usunięcia sprzętu" |
| 404 | Sprzęt nie istnieje | Toast "Sprzęt nie został znaleziony" + zamknij dialog + odśwież listę |
| 500 | Błąd serwera | Toast "Wystąpił błąd serwera. Spróbuj ponownie." |

### 10.5 Error Boundary

Komponent React error boundary dla całego widoku:

```typescript
// src/components/ErrorBoundary.tsx
export function EquipmentListErrorBoundary({ children }) {
  return (
    <ErrorBoundary
      fallback={
        <EmptyState
          variant="error"
          title="Wystąpił nieoczekiwany błąd"
          action={{ label: "Odśwież stronę", onClick: () => window.location.reload() }}
        />
      }
    >
      {children}
    </ErrorBoundary>
  );
}
```

### 10.6 Retry Logic

TanStack Query automatycznie ponawia nieudane requesty:
- Queries: 3 próby z exponential backoff
- Mutations: bez retry (użytkownik decyduje)

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików

1. Utworzenie strony Astro: `src/pages/equipment/index.astro`
2. Utworzenie folderu komponentów: `src/components/equipment/`
3. Utworzenie folderu hooków: `src/components/hooks/`
4. Utworzenie pliku stałych: `src/lib/constants/equipment-categories.ts`

### Krok 2: Implementacja typów i stałych

1. Sprawdzenie typów w `src/types.ts` (powinny już istnieć)
2. Utworzenie `equipment-categories.ts` z mapowaniem kategorii na ikony i kolory
3. Utworzenie schematu walidacji formularza `equipment-form.schema.ts`

### Krok 3: Implementacja custom hooków

1. `useEquipmentListParams` - zarządzanie stanem URL
2. `useEquipmentList` - TanStack Query hook dla pobierania listy
3. `useCreateEquipment` - TanStack Query mutation hook dla tworzenia
4. `useUpdateEquipment` - TanStack Query mutation hook dla edycji
5. `useDeleteEquipment` - TanStack Query mutation hook dla usuwania
6. `useMediaQuery` / `useIsMobile` - wykrywanie breakpointów
7. `useUserRole` - pobieranie roli użytkownika (owner/worker)

### Krok 4: Implementacja komponentów prezentacyjnych

1. `CategoryBadge` - badge kategorii z ikoną
2. `EmptyState` - stan pusty z wariantami
3. `EquipmentTableSkeleton` - skeleton loadery dla tabeli
4. `EquipmentCardSkeleton` - skeleton loadery dla kart

### Krok 5: Implementacja komponentów filtrowania

1. `CategoryCombobox` - combobox wyboru kategorii
2. `ActiveFiltersBadges` - badges aktywnych filtrów
3. `FilterBar` - kontener filtrów

### Krok 6: Implementacja komponentów listy

1. `EquipmentRowActions` - ikony akcji (edycja, usuwanie) w wierszu tabeli
2. `EquipmentTable` - tabela desktop z sortowaniem i kolumną akcji
3. `EquipmentCard` - karta mobile z przyciskami akcji
4. `EquipmentCardList` - lista kart mobile
5. `Pagination` - kontrolki paginacji

### Krok 7: Implementacja formularzy i dialogów

1. `EquipmentFormDialog` - modal z formularzem (tryb create i edit)
2. Integracja z react-hook-form i Zod
3. Auto-save do localStorage (tylko tryb create)
4. Obsługa sukcesu i błędów dla create/edit
5. `DeleteEquipmentDialog` - dialog potwierdzenia usunięcia
6. Obsługa cascade delete warning

### Krok 8: Implementacja głównego komponentu

1. `PageHeader` - sticky header z tytułem i przyciskiem
2. `EquipmentListPage` - główny komponent łączący wszystko
3. Logika przełączania między tabelą a kartami (responsive)
4. Integracja z hookami i API

### Krok 9: Implementacja strony Astro

1. Utworzenie `equipment/index.astro`
2. Import Layout i EquipmentListPage
3. Konfiguracja `client:load` dla React component
4. Przekazanie ewentualnych props z SSR

### Krok 10: Testowanie i poprawki

1. Testowanie manualne wszystkich interakcji
2. Testowanie responsywności (mobile, tablet, desktop)
3. Testowanie dostępności (keyboard navigation, screen reader)
4. Testowanie error states
5. Sprawdzenie lintera i poprawienie błędów
6. Code review i refactoring

### Krok 11: Dokumentacja

1. Dodanie komentarzy JSDoc do komponentów
2. Aktualizacja README jeśli potrzebna
3. Sprawdzenie spójności z resztą aplikacji
