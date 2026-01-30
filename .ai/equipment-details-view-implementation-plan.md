# Plan implementacji widoku Equipment Details

## 1. Przegląd

Widok Equipment Details (`/equipment/[id]`) służy do przeglądania szczegółowych informacji o konkretnym sprzęcie oraz jego pełnej historii serwisowej. Jest to kluczowy widok aplikacji, który umożliwia użytkownikom (zarówno owner, jak i worker) dostęp do wszystkich danych dotyczących sprzętu, dodawanie wpisów serwisowych oraz (w przypadku owner) edycję i usuwanie sprzętu oraz wpisów.

Widok łączy w sobie prezentację danych statycznych (informacje o sprzęcie) z dynamiczną historią serwisową wyświetlaną w formie timeline. Dla owner dostępne są dodatkowe akcje zarządzania.

## 2. Routing widoku

**Ścieżka:** `/equipment/[id]`

**Parametr dynamiczny:** `id` - UUID sprzętu

**Ochrona:** Protected route - dostępny dla wszystkich uwierzytelnionych użytkowników (owner i worker)

**Middleware:** Sprawdzenie sesji Supabase, redirect do `/login` jeśli brak autentykacji

## 3. Struktura komponentów

```
EquipmentDetailsPage (Astro page)
├── PageHeader
│   ├── Breadcrumbs
│   ├── Title (Equipment ID + Name)
│   └── Actions
│       ├── Button "Edytuj" (opens EquipmentFormDialog)
│       └── Button "Usuń" (owner only, opens AlertDialog)
│
├── EquipmentDataCard
│   ├── Grid Layout (2 columns desktop, 1 mobile)
│   ├── DataField (multiple instances)
│   │   ├── Label
│   │   └── Value
│   └── CategoryBadge (with icon)
│
├── Separator
│
└── ServiceHistorySection
    ├── SectionHeader
    │   ├── Title "Historia Serwisowa"
    │   └── Button "+ Dodaj wpis" (opens ServiceEntryFormDrawer)
    │
    └── ServiceEntryTimeline
        ├── EmptyState (if no entries)
        └── ServiceEntryItem (multiple instances)
            ├── Timestamp (relative/absolute)
            ├── ServiceTypeBadge (with icon)
            ├── Description (with "Read more" for >200 chars)
            ├── Performer name
            └── ActionsDropdown (owner only)
                ├── MenuItem "Edytuj"
                └── MenuItem "Usuń"

Dialogs/Drawers (Portal mounted):
├── EquipmentFormDialog (for edit)
├── ServiceEntryFormDrawer (for create/edit)
├── DeleteEquipmentAlertDialog (owner only)
└── DeleteServiceEntryAlertDialog (owner only)
```

## 4. Szczegóły komponentów

### PageHeader

**Opis:** Sticky header na górze strony zawierający breadcrumbs, tytuł strony (Equipment ID + Name) oraz akcje kontekstowe.

**Główne elementy:**
- `Breadcrumbs` - nawigacja hierarchiczna (Sprzęt > [Equipment Name])
- `div` - kontener na tytuł z Equipment ID (primary) i nazwą (secondary)
- `div` - kontener na akcje (buttons)

**Obsługiwane interakcje:**
- Click "Edytuj" → otwiera `EquipmentFormDialog` z `mode="edit"` i danymi sprzętu
- Click "Usuń" (owner) → otwiera `DeleteEquipmentAlertDialog` z informacją o liczbie wpisów do usunięcia (cascade)

**Obsługiwana walidacja:** Brak (tylko wyświetlanie)

**Typy:**
- `EquipmentDTO` (dane sprzętu do wyświetlenia)
- `UserRole` (do conditional rendering przycisku "Usuń")

**Propsy:**
```typescript
interface PageHeaderProps {
  equipment: EquipmentDTO;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
}
```

---

### Breadcrumbs

**Opis:** Komponent nawigacji hierarchicznej pokazujący ścieżkę od listy sprzętu do aktualnej strony.

**Główne elementy:**
- Lista linków rozdzielonych separatorami (np. `/` lub `>`)
- Ostatni element (current page) bez linku, wyróżniony wizualnie

**Obsługiwane interakcje:**
- Click na link breadcrumb → nawigacja do odpowiedniej strony

**Obsługiwana walidacja:** Brak

**Typy:** Brak specyficznych typów biznesowych

**Propsy:**
```typescript
interface BreadcrumbItem {
  label: string;
  href?: string; // undefined dla current page
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}
```

---

### EquipmentDataCard

**Opis:** Karta prezentująca wszystkie dane sprzętu w układzie grid. Na desktop 2 kolumny, na mobile 1 kolumna.

**Główne elementy:**
- `Card` (shadcn/ui) - kontener
- `CardHeader` z tytułem "Informacje o sprzęcie"
- `CardContent` z grid layout
- Multiple `DataField` components (Label + Value pairs)
- `CategoryBadge` dla kategorii
- Metadata section (created_by, created_at, updated_by, updated_at)

**Obsługiwane interakcje:** Brak (tylko wyświetlanie)

**Obsługiwana walidacja:** Brak

**Typy:**
- `EquipmentDTO` (wszystkie pola)

**Propsy:**
```typescript
interface EquipmentDataCardProps {
  equipment: EquipmentDTO;
}
```

---

### DataField

**Opis:** Komponent pomocniczy do wyświetlania pary label-value w grid layout.

**Główne elementy:**
- `Label` (semantic HTML label lub span)
- `Value` (div lub span) z obsługą pustych wartości (wyświetla "-" lub "Nie podano")

**Obsługiwane interakcje:** Brak

**Obsługiwana walidacja:** Brak

**Typy:** Generyczne (string | null | undefined)

**Propsy:**
```typescript
interface DataFieldProps {
  label: string;
  value: string | null | undefined;
  emptyText?: string; // default: "-"
}
```

---

### CategoryBadge

**Opis:** Badge z ikoną i nazwą kategorii sprzętu. Kolory i ikony mapowane według typu kategorii.

**Główne elementy:**
- `Badge` (shadcn/ui) z custom variant dla koloru
- Icon component (Lucide React)
- Label tekstowy

**Obsługiwane interakcje:** Brak (tylko wyświetlanie)

**Obsługiwana walidacja:** Brak

**Typy:**
- `EquipmentCategory` (enum z types.ts)

**Propsy:**
```typescript
interface CategoryBadgeProps {
  category: EquipmentCategory;
}
```

**Mapowanie kategorii:**
- `computer`: Monitor icon, blue
- `printer`: Printer icon, purple
- `monitor`: Monitor icon, cyan
- `network_device`: Network icon, green
- `phone`: Phone icon, pink
- `tablet`: Tablet icon, orange
- `peripheral`: Usb icon, gray
- `other`: Box icon, slate

---

### ServiceHistorySection

**Opis:** Sekcja zawierająca header z tytułem i przyciskiem "Dodaj wpis" oraz timeline z wpisami serwisowymi.

**Główne elementy:**
- `div` - kontener sekcji
- Header z tytułem "Historia Serwisowa"
- `Button` "+ Dodaj wpis"
- `ServiceEntryTimeline`

**Obsługiwane interakcje:**
- Click "+ Dodaj wpis" → otwiera `ServiceEntryFormDrawer` z `mode="create"`

**Obsługiwana walidacja:** Brak

**Typy:**
- `ServiceEntryDTO[]` (lista wpisów do przekazania do timeline)
- `string` (equipmentId dla formularza)

**Propsy:**
```typescript
interface ServiceHistorySectionProps {
  equipmentId: string;
  entries: ServiceEntryDTO[];
  isLoading: boolean;
  onAddEntry: () => void;
}
```

---

### ServiceEntryTimeline

**Opis:** Timeline wyświetlający wpisy serwisowe chronologicznie (najnowsze na górze). Pokazuje stan pusty jeśli brak wpisów.

**Główne elementy:**
- `EmptyState` (jeśli `entries.length === 0`)
- Lista `ServiceEntryItem` components
- Vertical line (CSS) łącząca wpisy

**Obsługiwane interakcje:**
- Przekazanie event handlers do `ServiceEntryItem` dla edycji/usuwania

**Obsługiwana walidacja:** Brak

**Typy:**
- `ServiceEntryDTO[]`
- `UserRole` (dla conditional rendering akcji)

**Propsy:**
```typescript
interface ServiceEntryTimelineProps {
  entries: ServiceEntryDTO[];
  isOwner: boolean;
  onEditEntry: (entryId: string) => void;
  onDeleteEntry: (entryId: string) => void;
}
```

---

### ServiceEntryItem

**Opis:** Pojedynczy wpis w timeline. Zawiera timestamp, typ operacji z badgem i ikoną, opis (z read more dla długich tekstów), nazwę wykonawcy oraz dropdown z akcjami dla owner.

**Główne elementy:**
- Container `div` z relative positioning dla timeline line
- `DateTimeDisplay` - relatywny/absolutny timestamp z tooltipem
- `ServiceTypeBadge` - badge z ikoną
- `p` - description (z logiką read more dla >200 znaków)
- `span` - performer name
- `ActionsDropdown` (owner only) - dropdown menu z opcjami Edytuj/Usuń

**Obsługiwane interakcje:**
- Click "Read more" → expand description (smooth animation)
- Click "Show less" → collapse description
- Hover timestamp → tooltip z pełną datą
- Click "Edytuj" w dropdown → callback `onEdit(entry.id)`
- Click "Usuń" w dropdown → callback `onDelete(entry.id)`

**Obsługiwana walidacja:** Brak (tylko wyświetlanie)

**Typy:**
- `ServiceEntryDTO` (wszystkie pola)
- `boolean` (isOwner dla conditional rendering)

**Propsy:**
```typescript
interface ServiceEntryItemProps {
  entry: ServiceEntryDTO;
  isOwner: boolean;
  onEdit: (entryId: string) => void;
  onDelete: (entryId: string) => void;
}
```

---

### DateTimeDisplay

**Opis:** Komponent do wyświetlania timestamp w formacie relatywnym (<7 dni) lub absolutnym (≥7 dni) z tooltipem pokazującym pełną datę.

**Główne elementy:**
- `Tooltip` (shadcn/ui) wrapper
- `TooltipTrigger` - span z formatted timestamp
- `TooltipContent` - pełna data i czas

**Obsługiwane interakcje:**
- Hover → pokazuje tooltip z pełną datą

**Obsługiwana walidacja:** Brak

**Typy:**
- `string` (ISO 8601 datetime)

**Propsy:**
```typescript
interface DateTimeDisplayProps {
  timestamp: string;
  showRelative?: boolean; // default true dla <7 dni
}
```

**Logika formatowania:**
- <7 dni: "2 godziny temu", "wczoraj", "3 dni temu"
- ≥7 dni: "19 sty 2024, 14:30" (date + time)
- Tooltip zawsze: "19 stycznia 2024, 14:30:25"

---

### ServiceTypeBadge

**Opis:** Badge z ikoną i labelą typu operacji serwisowej. Kolory i ikony mapowane według typu.

**Główne elementy:**
- `Badge` (shadcn/ui) z custom variant
- Icon component (Lucide React)
- Label tekstowy

**Obsługiwane interakcje:** Brak

**Obsługiwana walidacja:** Brak

**Typy:**
- `ServiceType` (enum z types.ts)

**Propsy:**
```typescript
interface ServiceTypeBadgeProps {
  serviceType: ServiceType;
}
```

**Mapowanie typów:**
- `inspection`: ClipboardCheck icon, blue, "Przegląd"
- `repair`: Wrench icon, orange, "Naprawa"
- `maintenance`: Cog icon, green, "Konserwacja"

---

### ActionsDropdown

**Opis:** Dropdown menu z akcjami dla owner (Edytuj, Usuń). Używa DropdownMenu z shadcn/ui.

**Główne elementy:**
- `DropdownMenu` wrapper
- `DropdownMenuTrigger` - button (three dots icon lub "Akcje")
- `DropdownMenuContent`
  - `DropdownMenuItem` "Edytuj"
  - `DropdownMenuSeparator`
  - `DropdownMenuItem` "Usuń" (destructive styling)

**Obsługiwane interakcje:**
- Click trigger → otwiera menu
- Click "Edytuj" → callback `onEdit()`
- Click "Usuń" → callback `onDelete()`
- Keyboard navigation (Arrow keys, Enter)

**Obsługiwana walidacja:** Brak

**Typy:** Brak specyficznych typów biznesowych

**Propsy:**
```typescript
interface ActionsDropdownProps {
  onEdit: () => void;
  onDelete: () => void;
}
```

---

### EmptyState

**Opis:** Komponent wyświetlany gdy brak wpisów serwisowych. Zawiera ilustrację, komunikat i CTA.

**Główne elementy:**
- Icon lub ilustracja (np. empty box)
- Heading "Brak wpisów serwisowych"
- Description "Dodaj pierwszy wpis, aby rozpocząć śledzenie historii serwisowej"
- Optional `Button` CTA (przekazany przez props)

**Obsługiwane interakcje:**
- Click CTA button → callback (np. otwiera formularz dodawania wpisu)

**Obsługiwana walidacja:** Brak

**Typy:** Brak specyficznych typów biznesowych

**Propsy:**
```typescript
interface EmptyStateProps {
  icon?: React.ComponentType;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

---

### EquipmentFormDialog

**Opis:** Modal dialog do edycji sprzętu. Zawiera formularz z wszystkimi polami sprzętu (poza equipment_id który jest read-only).

**Główne elementy:**
- `Dialog` (shadcn/ui) wrapper
- `DialogContent`
- `DialogHeader` z tytułem "Edytuj sprzęt"
- `Form` (react-hook-form)
  - Inputs dla wszystkich edytowalnych pól
  - `Select` dla kategorii (z ikonami)
  - `DatePicker` dla daty zakupu
- `DialogFooter` z przyciskami Cancel i Save

**Obsługiwane interakcje:**
- Change w inputs → aktualizacja form state
- Click Cancel → zamyka dialog (z confirmation jeśli unsaved changes)
- Click Save → walidacja i submit
- ESC → zamyka dialog (z confirmation jeśli unsaved changes)

**Obsługiwana walidacja:**
- Wszystkie walidacje zgodne z `UpdateEquipmentCommand`:
  - `name`: wymagane, min 1 znak
  - `category`: wymagane, jedno z enum values
  - `manufacturer`: wymagane, min 1 znak
  - `model`: wymagane, min 1 znak
  - `serial_number`: wymagane, min 1 znak, unique (obsługa 409 Conflict)
  - `description`: opcjonalne
  - `location`: opcjonalne
  - `purchase_date`: opcjonalne, valid date

**Typy:**
- `EquipmentDTO` (initial data)
- `UpdateEquipmentCommand` (form submit)
- `EquipmentResponseDTO` (API response)

**Propsy:**
```typescript
interface EquipmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: EquipmentDTO;
  onSuccess: () => void; // callback po pomyślnym zapisie
}
```

---

### ServiceEntryFormDrawer

**Opis:** Drawer (wysuwany panel z prawej) do dodawania/edycji wpisu serwisowego. Zawiera formularz z polami wpisu.

**Główne elementy:**
- `Sheet` (shadcn/ui) drawer wrapper
- `SheetContent`
- `SheetHeader` z tytułem "Dodaj wpis serwisowy" lub "Edytuj wpis"
- `Form` (react-hook-form)
  - `DateTimePicker` dla service_timestamp (edytowalna, domyślnie now)
  - `Select` dla service_type (z ikonami)
  - `Textarea` dla description (min 5 znaków)
  - Read-only input dla performer (auto-filled z zalogowanego użytkownika)
- `SheetFooter` z przyciskami Cancel i Save

**Obsługiwane interakcje:**
- Change w inputs → aktualizacja form state
- Click Cancel → zamyka drawer
- Click Save → walidacja i submit
- ESC → zamyka drawer (z confirmation jeśli unsaved changes)

**Obsługiwana walidacja:**
- Wszystkie walidacje zgodne z `CreateServiceEntryCommand` / `UpdateServiceEntryCommand`:
  - `service_timestamp`: opcjonalne (domyślnie now), ISO 8601 datetime
  - `service_type`: wymagane, jedno z enum values (inspection, repair, maintenance)
  - `description`: wymagane, min 5 znaków

**Typy:**
- `ServiceEntryDTO` (initial data dla mode="edit")
- `CreateServiceEntryCommand` (form submit dla create)
- `UpdateServiceEntryCommand` (form submit dla edit)
- `ServiceEntryResponseDTO` (API response)

**Propsy:**
```typescript
interface ServiceEntryFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentId: string; // dla create mode
  mode: 'create' | 'edit';
  entry?: ServiceEntryDTO; // dla edit mode
  currentUser: UserReference; // dla wyświetlenia performer
  onSuccess: () => void; // callback po pomyślnym zapisie
}
```

---

### DeleteEquipmentAlertDialog

**Opis:** Confirmation dialog przed usunięciem sprzętu. Zawiera ostrzeżenie o cascade delete (usunięcie powiązanych wpisów).

**Główne elementy:**
- `AlertDialog` (shadcn/ui) wrapper
- `AlertDialogContent`
- `AlertDialogHeader` z tytułem "Usunąć sprzęt?"
- `AlertDialogDescription` z komunikatem: "Ta akcja jest nieodwracalna. Sprzęt zostanie usunięty wraz z X wpisami serwisowymi."
- `AlertDialogFooter`
  - `AlertDialogCancel` "Anuluj" (default focus)
  - `AlertDialogAction` "Usuń" (destructive styling)

**Obsługiwane interakcje:**
- Click "Anuluj" → zamyka dialog
- Click "Usuń" → wywołuje API DELETE, pokazuje loading state
- ESC → zamyka dialog

**Obsługiwana walidacja:** Brak (confirmation only)

**Typy:**
- `string` (equipmentId)
- `number` (entriesCount dla komunikatu)

**Propsy:**
```typescript
interface DeleteEquipmentAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentId: string;
  equipmentName: string;
  entriesCount: number;
  onConfirm: () => Promise<void>; // async callback wywołujący API
}
```

---

### DeleteServiceEntryAlertDialog

**Opis:** Confirmation dialog przed usunięciem wpisu serwisowego.

**Główne elementy:**
- `AlertDialog` (shadcn/ui) wrapper
- `AlertDialogContent`
- `AlertDialogHeader` z tytułem "Usunąć wpis serwisowy?"
- `AlertDialogDescription` z komunikatem: "Ta akcja jest nieodwracalna."
- `AlertDialogFooter`
  - `AlertDialogCancel` "Anuluj" (default focus)
  - `AlertDialogAction` "Usuń" (destructive styling)

**Obsługiwane interakcje:**
- Click "Anuluj" → zamyka dialog
- Click "Usuń" → wywołuje API DELETE, pokazuje loading state
- ESC → zamyka dialog

**Obsługiwana walidacja:** Brak (confirmation only)

**Typy:**
- `string` (entryId)

**Propsy:**
```typescript
interface DeleteServiceEntryAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entryId: string;
  onConfirm: () => Promise<void>; // async callback wywołujący API
}
```

---

## 5. Typy

### Istniejące typy z `src/types.ts`

```typescript
// Typ dla szczegółów sprzętu (z extended metadata)
interface EquipmentDTO {
  id: string;
  equipment_id: string;
  name: string;
  category: EquipmentCategory;
  manufacturer: string;
  model: string;
  serial_number: string;
  description: string | null;
  location: string | null;
  purchase_date: string | null; // ISO 8601 date
  created_at: string; // ISO 8601 datetime
  created_by: UserReference;
  updated_at: string; // ISO 8601 datetime
  updated_by: UserReference;
}

// Typ dla wpisu serwisowego (z nested user references)
interface ServiceEntryDTO {
  id: string;
  equipment_id: string;
  service_timestamp: string; // ISO 8601 datetime
  service_type: ServiceType;
  description: string;
  performer: UserReference;
  created_at: string;
  created_by: UserReference;
  updated_at: string;
  updated_by: UserReference;
}

// Referencja użytkownika (minimal info)
interface UserReference {
  id: string;
  name: string;
}

// Enums
type EquipmentCategory = 
  | "computer"
  | "printer"
  | "monitor"
  | "network_device"
  | "phone"
  | "tablet"
  | "peripheral"
  | "other";

type ServiceType = "inspection" | "repair" | "maintenance";

type UserRole = "owner" | "worker";

// Command models dla mutations
interface UpdateEquipmentCommand {
  name?: string;
  category?: EquipmentCategory;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  description?: string | null;
  location?: string | null;
  purchase_date?: string | null;
}

interface CreateServiceEntryCommand {
  service_timestamp?: string; // ISO 8601, defaults to now
  service_type: ServiceType;
  description: string; // min 5 chars
}

interface UpdateServiceEntryCommand {
  service_timestamp?: string;
  service_type?: ServiceType;
  description?: string; // min 5 chars if provided
}

// Response types (z UUID zamiast UserReference)
interface EquipmentResponseDTO {
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
  created_by: string; // UUID
  updated_at: string;
  updated_by: string; // UUID
}

interface ServiceEntryResponseDTO {
  id: string;
  equipment_id: string;
  service_timestamp: string;
  service_type: ServiceType;
  description: string;
  performer_id: string; // UUID
  created_at: string;
  created_by: string; // UUID
  updated_at: string;
  updated_by: string; // UUID
}

// Pagination
interface PaginationParams {
  page?: number;
  limit?: number;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

type ServiceEntryListResponse = PaginatedResponse<ServiceEntryDTO>;

// Error responses
interface ErrorResponse {
  error: string;
  details?: Record<string, string[]> | Record<string, unknown>;
}

interface DeleteResponse {
  message: string;
}
```

### Nowe typy ViewModel (do utworzenia w komponencie lub osobnym pliku)

```typescript
// ViewModel dla Equipment Details Page
interface EquipmentDetailsViewModel {
  equipment: EquipmentDTO;
  entries: ServiceEntryDTO[];
  entriesPagination: PaginationMeta;
  isOwner: boolean;
  currentUser: UserReference;
}

// State dla dialogów i drawerów (local component state)
interface DialogState {
  equipmentFormOpen: boolean;
  serviceEntryDrawerOpen: boolean;
  serviceEntryDrawerMode: 'create' | 'edit';
  serviceEntryEditData?: ServiceEntryDTO;
  deleteEquipmentDialogOpen: boolean;
  deleteEntryDialogOpen: boolean;
  deleteEntryId?: string;
}

// Props dla Astro page (server-side props)
interface EquipmentDetailsPageProps {
  id: string; // z route params
}
```

### Typy pomocnicze dla komponentów

```typescript
// Mapowanie kategorii do ikon i kolorów
type CategoryIconMapping = {
  [K in EquipmentCategory]: {
    icon: LucideIcon;
    color: string; // Tailwind class
  };
};

// Mapowanie service type do ikon, kolorów i labelów
type ServiceTypeMapping = {
  [K in ServiceType]: {
    icon: LucideIcon;
    color: string;
    label: string;
  };
};

// Format daty dla DateTimeDisplay
type DateTimeFormat = 'relative' | 'absolute';
```

## 6. Zarządzanie stanem

### 6.1 Server State (TanStack Query)

Zarządzanie danymi pobieranymi z API z wykorzystaniem TanStack Query dla caching, refetching i optimistic updates.

**Query Keys:**
```typescript
// Szczegóły sprzętu
['equipment', 'detail', equipmentId]

// Lista wpisów serwisowych dla sprzętu
['service-entries', 'list', { equipmentId, page, limit }]

// Pojedynczy wpis serwisowy (dla edit)
['service-entries', 'detail', entryId]
```

**Queries:**

```typescript
// useEquipmentDetails - pobiera szczegóły sprzętu
const useEquipmentDetails = (equipmentId: string) => {
  return useQuery({
    queryKey: ['equipment', 'detail', equipmentId],
    queryFn: () => fetch(`/api/equipment/${equipmentId}`).then(res => res.json()),
    staleTime: 60000, // 60s
    retry: 1,
  });
};

// useServiceEntries - pobiera wpisy serwisowe z paginacją
const useServiceEntries = (equipmentId: string, params: PaginationParams) => {
  return useQuery({
    queryKey: ['service-entries', 'list', { equipmentId, ...params }],
    queryFn: () => 
      fetch(`/api/equipment/${equipmentId}/service-entries?page=${params.page}&limit=${params.limit}`)
        .then(res => res.json()),
    staleTime: 30000, // 30s
    retry: 1,
  });
};

// useServiceEntryDetail - pobiera szczegóły wpisu (dla edit)
const useServiceEntryDetail = (entryId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ['service-entries', 'detail', entryId],
    queryFn: () => fetch(`/api/service-entries/${entryId}`).then(res => res.json()),
    enabled, // tylko gdy drawer w edit mode
    staleTime: 60000,
  });
};
```

**Mutations:**

```typescript
// useUpdateEquipment - aktualizacja sprzętu
const useUpdateEquipment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { id: string; command: UpdateEquipmentCommand }) =>
      fetch(`/api/equipment/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.command),
      }).then(res => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      }),
    onSuccess: (data, variables) => {
      // Invalidate equipment detail query
      queryClient.invalidateQueries({
        queryKey: ['equipment', 'detail', variables.id]
      });
      // Invalidate equipment list (jeśli user wraca do listy)
      queryClient.invalidateQueries({
        queryKey: ['equipment', 'list']
      });
    },
  });
};

// useDeleteEquipment - usuwanie sprzętu
const useDeleteEquipment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (equipmentId: string) =>
      fetch(`/api/equipment/${equipmentId}`, {
        method: 'DELETE',
      }).then(res => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      }),
    onSuccess: () => {
      // Invalidate equipment list
      queryClient.invalidateQueries({
        queryKey: ['equipment', 'list']
      });
      // Redirect to equipment list handled by component
    },
  });
};

// useCreateServiceEntry - dodawanie wpisu
const useCreateServiceEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { equipmentId: string; command: CreateServiceEntryCommand }) =>
      fetch(`/api/equipment/${data.equipmentId}/service-entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.command),
      }).then(res => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      }),
    // Optimistic update dla lepszego UX
    onMutate: async (data) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['service-entries', 'list', { equipmentId: data.equipmentId }]
      });
      
      // Snapshot previous value
      const previousEntries = queryClient.getQueryData(
        ['service-entries', 'list', { equipmentId: data.equipmentId, page: 1, limit: 10 }]
      );
      
      // Optimistically update (dodaj wpis na górę listy z temporary ID)
      // Implementacja zależy od struktury danych
      
      return { previousEntries };
    },
    onError: (err, variables, context) => {
      // Revert optimistic update on error
      if (context?.previousEntries) {
        queryClient.setQueryData(
          ['service-entries', 'list', { equipmentId: variables.equipmentId, page: 1, limit: 10 }],
          context.previousEntries
        );
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate service entries list
      queryClient.invalidateQueries({
        queryKey: ['service-entries', 'list', { equipmentId: variables.equipmentId }]
      });
    },
  });
};

// useUpdateServiceEntry - aktualizacja wpisu
const useUpdateServiceEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { entryId: string; command: UpdateServiceEntryCommand }) =>
      fetch(`/api/service-entries/${data.entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.command),
      }).then(res => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      }),
    onSuccess: (data) => {
      // Invalidate entry detail query
      queryClient.invalidateQueries({
        queryKey: ['service-entries', 'detail', data.id]
      });
      // Invalidate entries list (zawiera ten wpis)
      queryClient.invalidateQueries({
        queryKey: ['service-entries', 'list', { equipmentId: data.equipment_id }]
      });
    },
  });
};

// useDeleteServiceEntry - usuwanie wpisu
const useDeleteServiceEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { entryId: string; equipmentId: string }) =>
      fetch(`/api/service-entries/${data.entryId}`, {
        method: 'DELETE',
      }).then(res => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      }),
    onSuccess: (data, variables) => {
      // Invalidate entries list
      queryClient.invalidateQueries({
        queryKey: ['service-entries', 'list', { equipmentId: variables.equipmentId }]
      });
    },
  });
};
```

### 6.2 Local UI State (React useState)

State dla dialogów, drawerów i innych elementów UI zarządzanych lokalnie w komponencie.

```typescript
// W głównym komponencie Equipment Details (React island)
const [dialogState, setDialogState] = useState<DialogState>({
  equipmentFormOpen: false,
  serviceEntryDrawerOpen: false,
  serviceEntryDrawerMode: 'create',
  serviceEntryEditData: undefined,
  deleteEquipmentDialogOpen: false,
  deleteEntryDialogOpen: false,
  deleteEntryId: undefined,
});

// Helper functions do zarządzania state
const openEquipmentForm = () => {
  setDialogState(prev => ({ ...prev, equipmentFormOpen: true }));
};

const closeEquipmentForm = () => {
  setDialogState(prev => ({ ...prev, equipmentFormOpen: false }));
};

const openServiceEntryDrawer = (mode: 'create' | 'edit', entry?: ServiceEntryDTO) => {
  setDialogState(prev => ({
    ...prev,
    serviceEntryDrawerOpen: true,
    serviceEntryDrawerMode: mode,
    serviceEntryEditData: entry,
  }));
};

const closeServiceEntryDrawer = () => {
  setDialogState(prev => ({
    ...prev,
    serviceEntryDrawerOpen: false,
    serviceEntryEditData: undefined,
  }));
};

const openDeleteEquipmentDialog = () => {
  setDialogState(prev => ({ ...prev, deleteEquipmentDialogOpen: true }));
};

const closeDeleteEquipmentDialog = () => {
  setDialogState(prev => ({ ...prev, deleteEquipmentDialogOpen: false }));
};

const openDeleteEntryDialog = (entryId: string) => {
  setDialogState(prev => ({
    ...prev,
    deleteEntryDialogOpen: true,
    deleteEntryId: entryId,
  }));
};

const closeDeleteEntryDialog = () => {
  setDialogState(prev => ({
    ...prev,
    deleteEntryDialogOpen: false,
    deleteEntryId: undefined,
  }));
};
```

### 6.3 User Context (dla roli użytkownika)

Wykorzystanie istniejącego `UserContext` do sprawdzania roli użytkownika dla conditional rendering.

```typescript
// Hook do użycia w komponentach
const useUserRole = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUserRole must be used within UserProvider');
  return context;
};

// W komponencie
const { isOwner, user } = useUserRole();

// Conditional rendering
{isOwner && <Button onClick={openDeleteDialog}>Usuń</Button>}
```

### 6.4 Custom Hook `useEquipmentDetailsPage`

Dedykowany hook agregujący całą logikę strony dla lepszej organizacji.

```typescript
const useEquipmentDetailsPage = (equipmentId: string) => {
  const { isOwner, user } = useUserRole();
  const [page, setPage] = useState(1);
  const [dialogState, setDialogState] = useState<DialogState>({...});
  
  // Queries
  const equipmentQuery = useEquipmentDetails(equipmentId);
  const entriesQuery = useServiceEntries(equipmentId, { page, limit: 10 });
  
  // Mutations
  const updateEquipmentMutation = useUpdateEquipment();
  const deleteEquipmentMutation = useDeleteEquipment();
  const createEntryMutation = useCreateServiceEntry();
  const updateEntryMutation = useUpdateServiceEntry();
  const deleteEntryMutation = useDeleteServiceEntry();
  
  // Handlers
  const handleUpdateEquipment = async (command: UpdateEquipmentCommand) => {
    await updateEquipmentMutation.mutateAsync({ id: equipmentId, command });
    closeEquipmentForm();
    toast.success('Sprzęt zaktualizowany pomyślnie');
  };
  
  const handleDeleteEquipment = async () => {
    await deleteEquipmentMutation.mutateAsync(equipmentId);
    closeDeleteEquipmentDialog();
    toast.success('Sprzęt usunięty pomyślnie');
    // Redirect to /equipment (w komponencie)
  };
  
  const handleCreateEntry = async (command: CreateServiceEntryCommand) => {
    await createEntryMutation.mutateAsync({ equipmentId, command });
    closeServiceEntryDrawer();
    toast.success('Wpis dodany pomyślnie');
  };
  
  const handleUpdateEntry = async (entryId: string, command: UpdateServiceEntryCommand) => {
    await updateEntryMutation.mutateAsync({ entryId, command });
    closeServiceEntryDrawer();
    toast.success('Wpis zaktualizowany pomyślnie');
  };
  
  const handleDeleteEntry = async (entryId: string) => {
    await deleteEntryMutation.mutateAsync({ entryId, equipmentId });
    closeDeleteEntryDialog();
    toast.success('Wpis usunięty pomyślnie');
  };
  
  return {
    // Data
    equipment: equipmentQuery.data,
    entries: entriesQuery.data?.data ?? [],
    pagination: entriesQuery.data?.pagination,
    isOwner,
    user,
    
    // Loading states
    isLoadingEquipment: equipmentQuery.isLoading,
    isLoadingEntries: entriesQuery.isLoading,
    
    // Dialog state
    dialogState,
    openEquipmentForm,
    closeEquipmentForm,
    openServiceEntryDrawer,
    closeServiceEntryDrawer,
    openDeleteEquipmentDialog,
    closeDeleteEquipmentDialog,
    openDeleteEntryDialog,
    closeDeleteEntryDialog,
    
    // Handlers
    handleUpdateEquipment,
    handleDeleteEquipment,
    handleCreateEntry,
    handleUpdateEntry,
    handleDeleteEntry,
    
    // Pagination
    page,
    setPage,
  };
};
```

## 7. Integracja API

### 7.1 Pobieranie szczegółów sprzętu

**Endpoint:** `GET /api/equipment/{id}`

**Request:**
- Method: GET
- Path param: `id` (UUID sprzętu)
- Headers: Cookie (session)

**Response Type:** `EquipmentDTO`

**Obsługa błędów:**
- `400 Bad Request` → Toast "Nieprawidłowy identyfikator sprzętu"
- `401 Unauthorized` → Redirect do `/login`
- `404 Not Found` → Toast "Sprzęt nie został znaleziony" + redirect do `/equipment`
- `500 Internal Server Error` → Toast "Wystąpił błąd serwera"

**Wykorzystanie w komponencie:**
```typescript
const { data: equipment, isLoading, error } = useEquipmentDetails(equipmentId);

if (error) {
  // Handle error based on status code
  // Redirect or show error message
}
```

### 7.2 Pobieranie wpisów serwisowych

**Endpoint:** `GET /api/equipment/{equipmentId}/service-entries`

**Request:**
- Method: GET
- Path param: `equipmentId` (UUID sprzętu)
- Query params: `page` (default 1), `limit: 10)
- Headers: Cookie (session)

**Response Type:** `ServiceEntryListResponse`

```typescript
{
  data: ServiceEntryDTO[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

**Obsługa błędów:**
- `400 Bad Request` → Toast "Nieprawidłowe parametry żądania"
- `401 Unauthorized` → Redirect do `/login`
- `404 Not Found` → Toast "Sprzęt nie został znaleziony"
- `500 Internal Server Error` → Toast "Wystąpił błąd serwera"

**Wykorzystanie w komponencie:**
```typescript
const { data, isLoading, error } = useServiceEntries(equipmentId, { page, limit: 10 });
const entries = data?.data ?? [];
const pagination = data?.pagination;
```

### 7.3 Aktualizacja sprzętu

**Endpoint:** `PATCH /api/equipment/{id}`

**Request:**
- Method: PATCH
- Path param: `id` (UUID sprzętu)
- Headers: Cookie (session), Content-Type: application/json
- Body: `UpdateEquipmentCommand` (wszystkie pola opcjonalne)

**Response Type:** `EquipmentResponseDTO`

**Obsługa błędów:**
- `400 Bad Request` → Inline errors w formularzu
- `401 Unauthorized` → Redirect do `/login`
- `404 Not Found` → Toast "Sprzęt nie został znaleziony" + close dialog
- `409 Conflict` → Toast "Sprzęt o tym numerze seryjnym już istnieje"
- `500 Internal Server Error` → Toast "Wystąpił błąd serwera"

**Wykorzystanie:**
```typescript
const mutation = useUpdateEquipment();

const onSubmit = async (data: UpdateEquipmentCommand) => {
  try {
    await mutation.mutateAsync({ id: equipmentId, command: data });
    toast.success('Sprzęt zaktualizowany pomyślnie');
    closeDialog();
  } catch (error) {
    // Error handling
  }
};
```

### 7.4 Usuwanie sprzętu (owner only)

**Endpoint:** `DELETE /api/equipment/{id}`

**Request:**
- Method: DELETE
- Path param: `id` (UUID sprzętu)
- Headers: Cookie (session)

**Response Type:** `DeleteResponse`

```typescript
{
  message: "Equipment deleted successfully"
}
```

**Obsługa błędów:**
- `401 Unauthorized` → Redirect do `/login`
- `403 Forbidden` → Toast "Brak uprawnień do wykonania tej akcji"
- `404 Not Found` → Toast "Sprzęt nie został znaleziony"
- `500 Internal Server Error` → Toast "Wystąpił błąd serwera"

**Wykorzystanie:**
```typescript
const mutation = useDeleteEquipment();
const navigate = useNavigate(); // lub window.location dla Astro

const onConfirmDelete = async () => {
  try {
    await mutation.mutateAsync(equipmentId);
    toast.success('Sprzęt usunięty pomyślnie');
    navigate('/equipment'); // Redirect do listy
  } catch (error) {
    // Error handling
  }
};
```

### 7.5 Dodawanie wpisu serwisowego

**Endpoint:** `POST /api/equipment/{equipmentId}/service-entries`

**Request:**
- Method: POST
- Path param: `equipmentId` (UUID sprzętu)
- Headers: Cookie (session), Content-Type: application/json
- Body: `CreateServiceEntryCommand`

**Response Type:** `ServiceEntryResponseDTO`

**Obsługa błędów:**
- `400 Bad Request` → Inline errors w formularzu
- `401 Unauthorized` → Redirect do `/login`
- `404 Not Found` → Toast "Sprzęt nie został znaleziony" + close drawer
- `500 Internal Server Error` → Toast "Wystąpił błąd serwera"

**Wykorzystanie:**
```typescript
const mutation = useCreateServiceEntry();

const onSubmit = async (data: CreateServiceEntryCommand) => {
  try {
    await mutation.mutateAsync({ equipmentId, command: data });
    toast.success('Wpis dodany pomyślnie');
    closeDrawer();
    // Scroll to top of timeline (newest entry)
  } catch (error) {
    // Error handling
  }
};
```

### 7.6 Pobieranie szczegółów wpisu (dla edit)

**Endpoint:** `GET /api/service-entries/{id}`

**Request:**
- Method: GET
- Path param: `id` (UUID wpisu)
- Headers: Cookie (session)

**Response Type:** `ServiceEntryDTO`

**Obsługa błędów:**
- `400 Bad Request` → Toast "Nieprawidłowy identyfikator wpisu"
- `401 Unauthorized` → Redirect do `/login`
- `404 Not Found` → Toast "Wpis nie został znaleziony"
- `500 Internal Server Error` → Toast "Wystąpił błąd serwera"

**Wykorzystanie:**
```typescript
// Enabled tylko gdy drawer w edit mode
const { data: entry, isLoading } = useServiceEntryDetail(
  entryId,
  dialogState.serviceEntryDrawerMode === 'edit'
);
```

### 7.7 Aktualizacja wpisu serwisowego

**Endpoint:** `PATCH /api/service-entries/{id}`

**Request:**
- Method: PATCH
- Path param: `id` (UUID wpisu)
- Headers: Cookie (session), Content-Type: application/json
- Body: `UpdateServiceEntryCommand` (wszystkie pola opcjonalne)

**Response Type:** `ServiceEntryResponseDTO`

**Obsługa błędów:**
- `400 Bad Request` → Inline errors w formularzu
- `401 Unauthorized` → Redirect do `/login`
- `404 Not Found` → Toast "Wpis nie został znaleziony" + close drawer
- `500 Internal Server Error` → Toast "Wystąpił błąd serwera"

**Wykorzystanie:**
```typescript
const mutation = useUpdateServiceEntry();

const onSubmit = async (data: UpdateServiceEntryCommand) => {
  try {
    await mutation.mutateAsync({ entryId, command: data });
    toast.success('Wpis zaktualizowany pomyślnie');
    closeDrawer();
  } catch (error) {
    // Error handling
  }
};
```

### 7.8 Usuwanie wpisu serwisowego (owner only)

**Endpoint:** `DELETE /api/service-entries/{id}`

**Request:**
- Method: DELETE
- Path param: `id` (UUID wpisu)
- Headers: Cookie (session)

**Response Type:** `DeleteResponse`

```typescript
{
  message: "Service entry deleted successfully"
}
```

**Obsługa błędów:**
- `401 Unauthorized` → Redirect do `/login`
- `403 Forbidden` → Toast "Brak uprawnień do wykonania tej akcji"
- `404 Not Found` → Toast "Wpis nie został znaleziony"
- `500 Internal Server Error` → Toast "Wystąpił błąd serwera"

**Wykorzystanie:**
```typescript
const mutation = useDeleteServiceEntry();

const onConfirmDelete = async () => {
  try {
    await mutation.mutateAsync({ entryId, equipmentId });
    toast.success('Wpis usunięty pomyślnie');
    closeDialog();
  } catch (error) {
    // Error handling
  }
};
```

## 8. Interakcje użytkownika

### 8.1 Przeglądanie szczegółów sprzętu

**Scenariusz:**
1. Użytkownik nawiguje do `/equipment/[id]` (kliknięcie z listy sprzętu lub z wyszukiwania)
2. Strona renderuje się z skeleton loaderami
3. API call `GET /api/equipment/{id}` pobiera szczegóły
4. API call `GET /api/equipment/{id}/service-entries` pobiera pierwszą stronę wpisów
5. Strona wyświetla pełne dane sprzętu i timeline

**Oczekiwany wynik:** Użytkownik widzi kompletne informacje o sprzęcie w karcie danych oraz chronologiczną historię serwisową w timeline.

### 8.2 Edycja sprzętu (wszystkie role)

**Scenariusz:**
1. Użytkownik klika przycisk "Edytuj" w PageHeader
2. Otwiera się `EquipmentFormDialog` z wypełnionymi danymi
3. Użytkownik modyfikuje pola (np. zmienia lokalizację)
4. Klika "Zapisz"
5. Frontend waliduje dane (Zod schema)
6. API call `PATCH /api/equipment/{id}` wysyła zmiany
7. Loading state na przycisku "Zapisz" (disabled + spinner)
8. Sukces: Dialog się zamyka, toast "Sprzęt zaktualizowany pomyślnie", dane w karcie odświeżają się
9. Błąd 409 (duplicate serial_number): Toast "Sprzęt o tym numerze seryjnym już istnieje", dialog pozostaje otwarty

**Oczekiwany wynik:** Zaktualizowane dane widoczne w karcie sprzętu, użytkownik otrzymuje potwierdzenie operacji.

### 8.3 Usuwanie sprzętu (owner only)

**Scenariusz:**
1. Owner klika przycisk "Usuń" w PageHeader
2. Otwiera się `DeleteEquipmentAlertDialog` z ostrzeżeniem o cascade delete: "Ta akcja usunie również X wpisów serwisowych"
3. Owner klika "Usuń"
4. API call `DELETE /api/equipment/{id}`
5. Loading state na przycisku (disabled + spinner)
6. Sukces: Dialog się zamyka, toast "Sprzęt usunięty pomyślnie", redirect do `/equipment`
7. Błąd: Toast z odpowiednim komunikatem, dialog pozostaje otwarty

**Oczekiwany wynik:** Sprzęt i wszystkie powiązane wpisy usunięte z bazy, użytkownik przekierowany do listy sprzętu.

**Note:** Worker nie widzi przycisku "Usuń" (całkowicie ukryty, nie tylko disabled).

### 8.4 Dodawanie wpisu serwisowego (wszystkie role)

**Scenariusz:**
1. Użytkownik klika "+ Dodaj wpis" w ServiceHistorySection
2. Otwiera się `ServiceEntryFormDrawer` z prawej strony
3. Formularz pokazuje:
   - DateTime picker z domyślną wartością "teraz" (edytowalna)
   - Select typu operacji (inspection/repair/maintenance)
   - Textarea opisu (min 5 znaków)
   - Read-only pole wykonawcy (auto-filled z zalogowanego użytkownika)
4. Użytkownik wypełnia formularz
5. Klika "Zapisz"
6. Frontend waliduje dane (Zod: opis min 5 znaków)
7. Optimistic update: Wpis dodany do timeline natychmiast (z loading indicator)
8. API call `POST /api/equipment/{id}/service-entries`
9. Loading state na przycisku "Zapisz"
10. Sukces: Drawer się zamyka, toast "Wpis dodany pomyślnie", timeline odświeża się z realnym wpisem, scroll do góry timeline
11. Błąd: Optimistic update cofnięty, toast z komunikatem błędu, drawer pozostaje otwarty

**Oczekiwany wynik:** Nowy wpis widoczny na górze timeline, użytkownik otrzymuje potwierdzenie operacji.

### 8.5 Edycja wpisu serwisowego (wszystkie role)

**Scenariusz:**
1. Użytkownik klika "Edytuj" w ActionsDropdown przy wpisie
2. Otwiera się `ServiceEntryFormDrawer` z wypełnionymi danymi
3. Użytkownik modyfikuje pola (np. zmienia opis lub typ operacji)
4. Klika "Zapisz"
5. Frontend waliduje dane
6. API call `PATCH /api/service-entries/{id}`
7. Loading state na przycisku
8. Sukces: Drawer się zamyka, toast "Wpis zaktualizowany pomyślnie", timeline odświeża się
9. Błąd: Toast z komunikatem błędu, drawer pozostaje otwarty

**Oczekiwany wynik:** Zaktualizowany wpis widoczny w timeline z nowymi danymi.

**Note:** Pole "wykonawca" pozostaje niezmienione (read-only).

### 8.6 Usuwanie wpisu serwisowego (owner only)

**Scenariusz:**
1. Owner klika "Usuń" w ActionsDropdown przy wpisie
2. Otwiera się `DeleteServiceEntryAlertDialog` z ostrzeżeniem "Ta akcja jest nieodwracalna"
3. Owner klika "Usuń"
4. API call `DELETE /api/service-entries/{id}`
5. Loading state na przycisku
6. Sukces: Dialog się zamyka, toast "Wpis usunięty pomyślnie", wpis znika z timeline
7. Błąd: Toast z komunikatem błędu, dialog pozostaje otwarty

**Oczekiwany wynik:** Wpis usunięty z timeline, użytkownik otrzymuje potwierdzenie operacji.

**Note:** Worker nie widzi opcji "Usuń" w ActionsDropdown (całkowicie ukryta).

### 8.7 Paginacja wpisów serwisowych

**Scenariusz:**
1. Użytkownik widzi timeline z 50 wpisami (domyślny limit)
2. Na dole timeline znajdują się kontrolki paginacji (Previous, 1, 2, 3, Next)
3. Użytkownik klika "Next" lub konkretny numer strony
4. Loading spinner na paginacji
5. API call `GET /api/equipment/{id}/service-entries?page=X&limit: 10`
6. Timeline odświeża się z nowymi wpisami

**Oczekiwany wynik:** Użytkownik widzi następną stronę wpisów, dane wcześniejszych wpisów pozostają w cache (TanStack Query).

### 8.8 Rozwinięcie długiego opisu (Read more)

**Scenariusz:**
1. Użytkownik widzi wpis z opisem dłuższym niż 200 znaków
2. Opis jest skrócony z tekstem "... Read more" na końcu
3. Użytkownik klika "Read more"
4. Opis rozwija się z smooth animation, pokazując pełną treść
5. Na dole opisu pojawia się "Show less"
6. Użytkownik klika "Show less"
7. Opis zwija się z powrotem

**Oczekiwany wynik:** Opis rozwija i zwija się płynnie, bez scrollowania całej strony.

### 8.9 Tooltip z pełnym timestampem

**Scenariusz:**
1. Użytkownik widzi wpis z relatywnym timestampem (np. "2 godziny temu")
2. Użytkownik najeżdża kursorem na timestamp
3. Tooltip pokazuje pełną datę i czas (np. "19 stycznia 2024, 14:30:25")
4. Użytkownik odsuwa kursor
5. Tooltip znika

**Oczekiwany wynik:** Użytkownik widzi dokładny timestamp w tooltipie.

### 8.10 Obsługa błędów nawigacji (404)

**Scenariusz:**
1. Użytkownik próbuje dostać się do `/equipment/invalid-uuid`
2. API call `GET /api/equipment/invalid-uuid` zwraca 404
3. Toast "Sprzęt nie został znaleziony"
4. Redirect do `/equipment` (lista sprzętu)

**Oczekiwany wynik:** Użytkownik widzi toast z błędem i zostaje przekierowany do listy sprzętu.

### 8.11 Keyboard navigation

**Scenariusz:**
1. Użytkownik używa klawisza Tab do nawigacji przez elementy strony
2. Focus widoczny na wszystkich interaktywnych elementach (buttons, links, dropdown triggers)
3. Enter aktywuje button/link
4. Escape zamyka otwarty dialog/drawer (z confirmation jeśli unsaved changes)
5. Arrow keys w ActionsDropdown nawigują przez opcje menu

**Oczekiwany wynik:** Pełna funkcjonalność dostępna z klawiatury, focus visible, intuicyjna nawigacja.

## 9. Warunki i walidacja

### 9.1 Warunki autoryzacji

**Weryfikacja:** Server-side w middleware Astro + client-side conditional rendering

**Komponenty dotknięte:** `PageHeader`, `ServiceEntryItem`, `ActionsDropdown`

**Warunki:**

#### Owner only actions:
- **Przycisk "Usuń" sprzęt** (PageHeader):
  - Warunek: `isOwner === true`
  - Jeśli `false`: Przycisk całkowicie ukryty (nie renderowany)
  - Server-side check: Middleware sprawdza rolę przed renderowaniem strony
  - API check: `DELETE /api/equipment/{id}` zwraca 403 jeśli nie-owner

- **Opcja "Usuń wpis"** (ActionsDropdown):
  - Warunek: `isOwner === true`
  - Jeśli `false`: Opcja całkowicie ukryta (nie renderowana w menu)
  - API check: `DELETE /api/service-entries/{id}` zwraca 403 jeśli nie-owner

#### All authenticated users:
- **Przycisk "Edytuj" sprzęt**: Widoczny dla wszystkich (owner + worker)
- **Przycisk "+ Dodaj wpis"**: Widoczny dla wszystkich
- **Opcja "Edytuj wpis"**: Widoczna dla wszystkich
- Przeglądanie szczegółów: Dostępne dla wszystkich

**Wpływ na stan UI:**
- Worker widzi tylko akcje edycji i dodawania
- Owner widzi wszystkie akcje (edycja, dodawanie, usuwanie)

### 9.2 Walidacja formularza edycji sprzętu

**Komponenty dotknięte:** `EquipmentFormDialog`

**Warunki walidacji:**

1. **Nazwa (name)**:
   - Wymagane: TAK
   - Min length: 1 znak
   - Komunikat błędu: "Nazwa jest wymagana"

2. **Kategoria (category)**:
   - Wymagane: TAK
   - Wartości: enum EquipmentCategory
   - Komunikat błędu: "Wybierz kategorię"

3. **Producent (manufacturer)**:
   - Wymagane: TAK
   - Min length: 1 znak
   - Komunikat błędu: "Producent jest wymagany"

4. **Model (model)**:
   - Wymagane: TAK
   - Min length: 1 znak
   - Komunikat błędu: "Model jest wymagany"

5. **Numer seryjny (serial_number)**:
   - Wymagane: TAK
   - Min length: 1 znak
   - Unique: TAK (API sprawdza, zwraca 409 przy duplikacie)
   - Komunikat błędu walidacji: "Numer seryjny jest wymagany"
   - Komunikat błędu 409: Toast "Sprzęt o tym numerze seryjnym już istnieje"

6. **Opis (description)**:
   - Wymagane: NIE
   - Komunikat: Brak (opcjonalne)

7. **Lokalizacja (location)**:
   - Wymagane: NIE
   - Komunikat: Brak (opcjonalne)

8. **Data zakupu (purchase_date)**:
   - Wymagane: NIE
   - Format: ISO 8601 date (YYYY-MM-DD)
   - Walidacja: Valid date
   - Komunikat błędu: "Nieprawidłowy format daty"

**Implementacja walidacji:**
```typescript
import { z } from 'zod';

const updateEquipmentSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana").optional(),
  category: z.enum([...], { errorMap: () => ({ message: "Wybierz kategorię" }) }).optional(),
  manufacturer: z.string().min(1, "Producent jest wymagany").optional(),
  model: z.string().min(1, "Model jest wymagany").optional(),
  serial_number: z.string().min(1, "Numer seryjny jest wymagany").optional(),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  purchase_date: z.string().date("Nieprawidłowy format daty").optional().nullable(),
});
```

**Moment walidacji:**
- Client-side: On blur dla każdego pola, on submit dla całego formularza
- Server-side: W API endpoint przed zapisem do bazy

**Wpływ na stan UI:**
- Inline error messages pod konkretnymi polami
- Focus na pierwsze pole z błędem po failed submit
- Submit button disabled podczas walidacji i API call

### 9.3 Walidacja formularza wpisu serwisowego

**Komponenty dotknięte:** `ServiceEntryFormDrawer`

**Warunki walidacji:**

1. **Data i godzina serwisu (service_timestamp)**:
   - Wymagane: NIE (domyślnie now)
   - Format: ISO 8601 datetime
   - Walidacja: Valid datetime
   - Komunikat błędu: "Nieprawidłowy format daty i czasu"

2. **Typ operacji (service_type)**:
   - Wymagane: TAK
   - Wartości: enum ServiceType (inspection, repair, maintenance)
   - Komunikat błędu: "Wybierz typ operacji"

3. **Opis (description)**:
   - Wymagane: TAK
   - Min length: 5 znaków
   - Komunikat błędu: "Opis musi zawierać co najmniej 5 znaków"

4. **Wykonawca (performer)**:
   - Wymagane: TAK (auto-filled)
   - Read-only: TAK (nie można edytować)
   - Wartość: ID zalogowanego użytkownika

**Implementacja walidacji:**
```typescript
const createServiceEntrySchema = z.object({
  service_timestamp: z.string().datetime("Nieprawidłowy format daty i czasu").optional(),
  service_type: z.enum(['inspection', 'repair', 'maintenance'], {
    errorMap: () => ({ message: "Wybierz typ operacji" })
  }),
  description: z.string().min(5, "Opis musi zawierać co najmniej 5 znaków"),
});

const updateServiceEntrySchema = createServiceEntrySchema.partial();
```

**Moment walidacji:**
- Client-side: On blur dla description, on submit dla całego formularza
- Server-side: W API endpoint przed zapisem do bazy

**Wpływ na stan UI:**
- Inline error messages pod konkretnymi polami
- Submit button disabled podczas walidacji i API call
- Performer field disabled (grayed out)

### 9.4 Warunki wyświetlania elementów UI

**Timeline Empty State:**
- Warunek: `entries.length === 0`
- Wyświetlane: `EmptyState` z komunikatem "Brak wpisów serwisowych. Dodaj pierwszy wpis."
- Jeśli `entries.length > 0`: Wyświetlana lista `ServiceEntryItem`

**Read more/Show less:**
- Warunek: `description.length > 200`
- Jeśli `true`: Opis skrócony do 200 znaków + "... Read more"
- Po kliknięciu "Read more": Pełny opis + "Show less"
- Jeśli `false`: Pełny opis bez przycisków

**Relatywny vs absolutny timestamp:**
- Warunek: `dayjs(timestamp).diff(dayjs(), 'day') < 7`
- Jeśli `true`: Format relatywny ("2 godziny temu", "wczoraj", "3 dni temu")
- Jeśli `false`: Format absolutny ("19 sty 2024, 14:30")
- Tooltip zawsze pokazuje pełny timestamp

**Pagination controls:**
- Previous button disabled: `page === 1`
- Next button disabled: `page === totalPages` lub `entries.length < limit`
- Page numbers: Pokazane maksymalnie 5 (current +/- 2), reszta z "..."

**Breadcrumbs current page:**
- Ostatni item w breadcrumbs bez linku (tylko text)
- Wyróżniony wizualnie (np. bold lub inny kolor)

## 10. Obsługa błędów

### 10.1 Błędy API - Equipment Details

**GET /api/equipment/{id}**

| Kod | Scenariusz | Komunikat | Akcja UI |
|-----|-----------|-----------|----------|
| 400 | Nieprawidłowy format UUID | "Nieprawidłowy identyfikator sprzętu" | Toast + redirect do `/equipment` |
| 401 | Brak sesji / sesja wygasła | "Sesja wygasła, zaloguj się ponownie" | Toast + redirect do `/login` |
| 404 | Sprzęt nie istnieje | "Sprzęt nie został znaleziony" | Toast + redirect do `/equipment` |
| 500 | Błąd serwera | "Wystąpił błąd serwera. Spróbuj ponownie." | Toast z retry button |
| Network | Brak połączenia | "Brak połączenia z serwerem. Sprawdź połączenie internetowe." | Toast z retry button |

**GET /api/equipment/{equipmentId}/service-entries**

| Kod | Scenariusz | Komunikat | Akcja UI |
|-----|-----------|-----------|----------|
| 400 | Nieprawidłowe parametry | "Nieprawidłowe parametry żądania" | Toast |
| 401 | Brak sesji | "Sesja wygasła, zaloguj się ponownie" | Toast + redirect do `/login` |
| 404 | Sprzęt nie istnieje | "Sprzęt nie został znaleziony" | Toast (entries section ukryta) |
| 500 | Błąd serwera | "Wystąpił błąd serwera" | Toast z retry button |

**PATCH /api/equipment/{id}**

| Kod | Scenariusz | Komunikat | Akcja UI |
|-----|-----------|-----------|----------|
| 400 | Błąd walidacji | Inline errors w formularzu | Komunikaty pod polami z błędami |
| 401 | Brak sesji | "Sesja wygasła, zaloguj się ponownie" | Toast + redirect do `/login` |
| 404 | Sprzęt nie istnieje | "Sprzęt nie został znaleziony" | Toast + close dialog |
| 409 | Duplikat serial_number | "Sprzęt o tym numerze seryjnym już istnieje" | Toast, dialog pozostaje otwarty |
| 500 | Błąd serwera | "Wystąpił błąd serwera" | Toast z retry button |

**DELETE /api/equipment/{id}**

| Kod | Scenariusz | Komunikat | Akcja UI |
|-----|-----------|-----------|----------|
| 401 | Brak sesji | "Sesja wygasła, zaloguj się ponownie" | Toast + redirect do `/login` |
| 403 | Użytkownik nie jest owner | "Brak uprawnień do wykonania tej akcji" | Toast, dialog zamknięty |
| 404 | Sprzęt nie istnieje | "Sprzęt nie został znaleziony" | Toast, redirect do `/equipment` |
| 500 | Błąd serwera | "Wystąpił błąd serwera" | Toast z retry button |

### 10.2 Błędy API - Service Entries

**POST /api/equipment/{equipmentId}/service-entries**

| Kod | Scenariusz | Komunikat | Akcja UI |
|-----|-----------|-----------|----------|
| 400 | Błąd walidacji | Inline errors w formularzu | Komunikaty pod polami z błędami |
| 401 | Brak sesji | "Sesja wygasła, zaloguj się ponownie" | Toast + redirect do `/login` |
| 404 | Sprzęt nie istnieje | "Sprzęt nie został znaleziony" | Toast + close drawer + redirect do `/equipment` |
| 500 | Błąd serwera | "Wystąpił błąd serwera" | Toast, optimistic update cofnięty |

**GET /api/service-entries/{id}**

| Kod | Scenariusz | Komunikat | Akcja UI |
|-----|-----------|-----------|----------|
| 400 | Nieprawidłowy UUID | "Nieprawidłowy identyfikator wpisu" | Toast, drawer nie otwiera się |
| 401 | Brak sesji | "Sesja wygasła, zaloguj się ponownie" | Toast + redirect do `/login` |
| 404 | Wpis nie istnieje | "Wpis nie został znaleziony" | Toast, drawer zamknięty |
| 500 | Błąd serwera | "Wystąpił błąd serwera" | Toast z retry button |

**PATCH /api/service-entries/{id}**

| Kod | Scenariusz | Komunikat | Akcja UI |
|-----|-----------|-----------|----------|
| 400 | Błąd walidacji | Inline errors w formularzu | Komunikaty pod polami z błędami |
| 401 | Brak sesji | "Sesja wygasła, zaloguj się ponownie" | Toast + redirect do `/login` |
| 404 | Wpis nie istnieje | "Wpis nie został znaleziony" | Toast + close drawer |
| 500 | Błąd serwera | "Wystąpił błąd serwera" | Toast z retry button |

**DELETE /api/service-entries/{id}**

| Kod | Scenariusz | Komunikat | Akcja UI |
|-----|-----------|-----------|----------|
| 401 | Brak sesji | "Sesja wygasła, zaloguj się ponownie" | Toast + redirect do `/login` |
| 403 | Użytkownik nie jest owner | "Brak uprawnień do wykonania tej akcji" | Toast, dialog zamknięty |
| 404 | Wpis nie istnieje | "Wpis nie został znaleziony" | Toast, wpis już usunięty z UI |
| 500 | Błąd serwera | "Wystąpił błąd serwera" | Toast z retry button |

### 10.3 Błędy walidacji formularzy

**Equipment Form:**
- Puste wymagane pole: "To pole jest wymagane"
- Nieprawidłowy format daty: "Nieprawidłowy format daty"
- Za krótka wartość: "Wartość musi zawierać co najmniej X znaków"

**Service Entry Form:**
- Opis < 5 znaków: "Opis musi zawierać co najmniej 5 znaków"
- Nieprawidłowy datetime: "Nieprawidłowy format daty i czasu"
- Brak typu operacji: "Wybierz typ operacji"

**Wyświetlanie błędów:**
- Inline pod konkretnym polem (red text)
- Icon alert obok pola z błędem
- Border pola zmienia kolor na red
- Focus na pierwsze pole z błędem po submit

### 10.4 Błędy sieciowe

**Offline / Network Error:**
- Toast: "Brak połączenia z serwerem. Sprawdź połączenie internetowe."
- Retry button w toast
- Dane w cache (TanStack Query) pozostają dostępne
- Mutations w kolejce (opcjonalnie, post-MVP)

**Timeout:**
- Toast: "Żądanie trwa zbyt długo. Spróbuj ponownie."
- Retry button w toast
- Timeout ustawiony na 30s (configurable)

### 10.5 Edge cases

**Jednoczesna edycja (MVP):**
- Last-write-wins (brak conflict detection)
- Post-MVP: Optimistic locking z wersjonowaniem (updated_at comparison)

**Usunięcie przez innego użytkownika:**
- User A otwiera szczegóły sprzętu
- User B (owner) usuwa sprzęt
- User A klika "Edytuj" → API zwraca 404
- Toast "Sprzęt nie został znaleziony" + redirect do `/equipment`

**Zmiana roli użytkownika podczas sesji:**
- Owner zostaje degradowany do worker przez innego ownera
- Akcje owner (delete) nadal widoczne w UI (role cached w UserContext)
- API zwraca 403 przy próbie użycia
- Toast "Brak uprawnień do wykonania tej akcji"
- Refresh strony aktualizuje rolę w UserContext

**Pusta lista wpisów:**
- EmptyState: "Brak wpisów serwisowych. Dodaj pierwszy wpis."
- CTA button "+ Dodaj wpis" otwiera drawer

**Bardzo długi opis (>200 znaków):**
- Skrócony do 200 znaków + "... Read more"
- Smooth expand/collapse animation
- Brak scrollowania strony podczas expand

**Brak połączenia podczas submit:**
- Toast z komunikatem o braku połączenia
- Form state zachowany (użytkownik nie traci danych)
- Retry button w toast

## 11. Kroki implementacji

### Krok 1: Utworzenie struktury plików i routing

1. **Utworzenie Astro page:**
   - Plik: `src/pages/equipment/[id].astro`
   - Konfiguracja: `export const prerender = false;` (SSR dla protected route)
   - Middleware: Sprawdzenie sesji w `src/middleware/index.ts`

2. **Utworzenie katalogu komponentów:**
   ```
   src/components/equipment/
   ├── EquipmentDataCard.tsx
   ├── CategoryBadge.tsx
   ├── DataField.tsx
   ├── EquipmentFormDialog.tsx
   └── equipment-details/
       ├── ServiceHistorySection.tsx
       ├── ServiceEntryTimeline.tsx
       ├── ServiceEntryItem.tsx
       ├── ServiceTypeBadge.tsx
       ├── DateTimeDisplay.tsx
       ├── ActionsDropdown.tsx
       ├── ServiceEntryFormDrawer.tsx
       ├── DeleteEquipmentAlertDialog.tsx
       └── DeleteServiceEntryAlertDialog.tsx
   ```

3. **Utworzenie shared components:**
   ```
   src/components/shared/
   ├── PageHeader.tsx
   ├── Breadcrumbs.tsx
   └── EmptyState.tsx
   ```

### Krok 2: Implementacja typów i hooków

1. **Rozszerzenie `src/types.ts`:**
   - Dodanie ViewModel types (jeśli potrzebne)
   - Export wszystkich istniejących typów używanych w widoku

2. **Utworzenie custom hooków:**
   - Plik: `src/hooks/useEquipmentDetails.ts`
     - `useEquipmentDetails(id)` - query
     - `useServiceEntries(equipmentId, params)` - query
     - `useServiceEntryDetail(entryId, enabled)` - query
   - Plik: `src/hooks/useEquipmentMutations.ts`
     - `useUpdateEquipment()` - mutation
     - `useDeleteEquipment()` - mutation
   - Plik: `src/hooks/useServiceEntryMutations.ts`
     - `useCreateServiceEntry()` - mutation
     - `useUpdateServiceEntry()` - mutation
     - `useDeleteServiceEntry()` - mutation
   - Plik: `src/hooks/useEquipmentDetailsPage.ts`
     - `useEquipmentDetailsPage(equipmentId)` - agregujący hook

3. **Wykorzystanie istniejącego `useUserRole()` hook:**
   - Import z `src/contexts/UserContext.tsx`

### Krok 3: Implementacja podstawowych komponentów UI

1. **Breadcrumbs:**
   - Component z mapowaniem path do labels
   - Styled z Tailwind
   - Last item bez linku (current page)

2. **PageHeader:**
   - Sticky positioning (Tailwind: `sticky top-0 z-10`)
   - Layout: Breadcrumbs + Title (Equipment ID + Name) + Actions
   - Conditional rendering dla przycisku "Usuń" (owner only)

3. **EmptyState:**
   - Generic component dla różnych kontekstów
   - Props: icon, title, description, optional action button

4. **DataField:**
   - Simple Label + Value layout
   - Handling null/undefined values (display "-")

### Krok 4: Implementacja komponentów danych sprzętu

1. **CategoryBadge:**
   - Mapowanie kategorii do ikon (Lucide React)
   - Mapowanie kategorii do kolorów (Tailwind variants)
   - Badge component z shadcn/ui

2. **EquipmentDataCard:**
   - Card component z shadcn/ui
   - Grid layout (2 columns desktop, 1 mobile)
   - Multiple DataField instances
   - CategoryBadge integration
   - Metadata section (created_by, updated_by, timestamps)

3. **DateTimeDisplay:**
   - Logika relatywnego vs absolutnego timestamp
   - dayjs dla date formatting
   - Tooltip z shadcn/ui dla pełnej daty
   - Format: "X godzin temu" (<7 dni), "DD MMM YYYY, HH:mm" (≥7 dni)

### Krok 5: Implementacja komponentów timeline

1. **ServiceTypeBadge:**
   - Mapowanie service_type do ikon, kolorów i labelów
   - Badge component z shadcn/ui

2. **ActionsDropdown:**
   - DropdownMenu z shadcn/ui
   - Trigger: Three dots icon lub "Akcje" button
   - Items: "Edytuj", separator, "Usuń" (destructive)
   - Conditional rendering dla owner tylko opcji "Usuń"

3. **ServiceEntryItem:**
   - Layout: timeline dot + content
   - DateTimeDisplay dla timestamp
   - ServiceTypeBadge
   - Description z logikąread more/show less (useState dla expanded state)
   - Performer name
   - ActionsDropdown (tylko dla owner)

4. **ServiceEntryTimeline:**
   - Vertical line CSS (before pseudo-element)
   - List of ServiceEntryItem
   - EmptyState jeśli brak wpisów

5. **ServiceHistorySection:**
   - Header z tytułem i button "+ Dodaj wpis"
   - ServiceEntryTimeline
   - Loading skeleton podczas fetch

### Krok 6: Implementacja formularzy (Dialogs/Drawers)

1. **EquipmentFormDialog:**
   - Dialog z shadcn/ui
   - react-hook-form + Zod resolver
   - Fields: wszystkie z EquipmentDTO (poza equipment_id)
   - Category select z ikonami
   - DatePicker dla purchase_date
   - Inline validation errors
   - Loading state na submit button
   - Confirmation przy ESC z unsaved changes (opcjonalnie, post-MVP)

2. **ServiceEntryFormDrawer:**
   - Sheet (drawer) z shadcn/ui
   - react-hook-form + Zod resolver
   - Fields: service_timestamp (DateTimePicker), service_type (Select z ikonami), description (Textarea)
   - Read-only performer field (disabled input)
   - Mode prop: 'create' | 'edit'
   - Conditional data loading dla edit mode
   - Inline validation errors
   - Loading state na submit button

3. **DeleteEquipmentAlertDialog:**
   - AlertDialog z shadcn/ui
   - Props: equipmentId, equipmentName, entriesCount
   - Message: "Ta akcja usunie również X wpisów serwisowych"
   - Cancel (default focus) + Delete (destructive)
   - Loading state na Delete button

4. **DeleteServiceEntryAlertDialog:**
   - AlertDialog z shadcn/ui
   - Props: entryId
   - Message: "Ta akcja jest nieodwracalna"
   - Cancel (default focus) + Delete (destructive)
   - Loading state na Delete button

### Krok 7: Integracja TanStack Query i mutations

1. **Konfiguracja QueryClient:**
   - Plik: `src/lib/queryClient.ts`
   - Konfiguracja staleTime, cacheTime, retry

2. **Implementacja queries w hookach:**
   - useEquipmentDetails
   - useServiceEntries
   - useServiceEntryDetail

3. **Implementacja mutations w hookach:**
   - useUpdateEquipment z onSuccess (invalidate queries)
   - useDeleteEquipment z onSuccess (invalidate + redirect)
   - useCreateServiceEntry z optimistic update
   - useUpdateServiceEntry z onSuccess (invalidate)
   - useDeleteServiceEntry z onSuccess (invalidate)

4. **Error handling w mutations:**
   - try/catch w submit handlers
   - Toast notifications dla success/error
   - Inline errors dla validation errors (400)

### Krok 8: Implementacja głównego komponentu strony

1. **EquipmentDetailsPage component (React island):**
   - Import wszystkich subkomponentów
   - useEquipmentDetailsPage hook dla state i handlers
   - Skeleton loaders podczas isLoading
   - Error handling dla failed queries
   - Layout: PageHeader + EquipmentDataCard + Separator + ServiceHistorySection
   - Dialogs/Drawers w Portal (conditional rendering based on state)

2. **Integracja w Astro page:**
   - SSR fetch dla initial data (opcjonalnie, dla SEO i performance)
   - Hydration dyrektywy (`client:load` lub `client:visible`)
   - Provider wrapping (QueryClientProvider, UserContextProvider)

### Krok 9: Styling i responsywność

1. **Desktop layout (>1024px):**
   - Sticky header
   - Equipment data card: 2 columns grid
   - Timeline: full width, entries po lewej vertical line
   - Dialogs: centered modal
   - Drawer: right side panel

2. **Tablet layout (768px-1024px):**
   - Similar do desktop, możliwe collapsed labels
   - Equipment data card: adaptive (może pozostać 2 columns)

3. **Mobile layout (<768px):**
   - Sticky header z dropdown dla actions
   - Equipment data card: 1 column
   - Timeline: compact layout, mniejsze spacing
   - Drawer: full-screen lub bottom sheet

4. **Dark mode (opcjonalnie, post-MVP):**
   - CSS variables dla kolorów
   - Toggle w user menu

### Krok 10: Accessibility improvements

1. **Keyboard navigation:**
   - Tab przez wszystkie interaktywne elementy
   - Focus visible styles (outline)
   - Focus trap w modals/drawers
   - Escape zamyka dialogi

2. **ARIA attributes:**
   - aria-label dla icon buttons
   - aria-expanded dla collapsible sections (read more)
   - aria-live dla toast notifications
   - role="navigation" dla breadcrumbs
   - role="list" dla timeline

3. **Screen reader support:**
   - Semantic HTML (nav, main, article, section)
   - Labels powiązane z inputs (for/id)
   - Error messages w aria-describedby

### Krok 11: Testing

1. **Manual testing:**
   - Wszystkie interakcje użytkownika (US-009, US-010, US-011, US-012)
   - Wszystkie scenariusze błędów
   - Responsywność (mobile, tablet, desktop)
   - Keyboard navigation
   - Screen reader (NVDA/JAWS)

2. **E2E tests (Playwright):**
   - Test flow: Login → Equipment details → Add service entry → Verify in timeline
   - Test edit equipment
   - Test edit service entry
   - Test delete equipment (owner)
   - Test delete service entry (owner)
   - Test worker nie widzi delete buttons

3. **Linter checks:**
   - ESLint dla TypeScript/React
   - Prettier dla formatowania
   - Accessibility linter (eslint-plugin-jsx-a11y)

### Krok 12: Optimization i finalne poprawki

1. **Performance:**
   - Code splitting dla heavy components (DatePicker, RichTextEditor jeśli używany)
   - Lazy loading dla images (jeśli są)
   - Prefetching następnej strony pagination
   - Memoization dla expensive computations (useMemo)

2. **Error boundaries:**
   - React Error Boundary dla catch runtime errors
   - Fallback UI z retry button

3. **Loading states:**
   - Skeleton dla wszystkich async data
   - Spinner dla buttons w loading state
   - Disabled states dla form fields podczas submit

4. **Polish:**
   - Smooth animations (transitions)
   - Hover states dla interaktywnych elementów
   - Consistent spacing i typography
   - Toast auto-dismiss timing (3-5s dla success, manual dla errors)

### Krok 13: Documentation i deployment

1. **Code documentation:**
   - JSDoc comments dla komponentów i hooków
   - Props interfaces dokumentowane
   - README dla komponentów (jeśli potrzebne)

2. **Testing documentation:**
   - Test scenarios w README lub docs
   - Known issues i limitations

3. **Deployment checklist:**
   - Build passes bez errors/warnings
   - All E2E tests pass
   - Manual testing completed
   - Accessibility checklist verified
   - Performance metrics acceptable

---

**Koniec planu implementacji**
