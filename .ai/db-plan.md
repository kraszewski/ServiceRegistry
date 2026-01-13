# Schemat bazy danych PostgreSQL - ServiceRegistry

## 1. Typy ENUM

### user_role
```sql
CREATE TYPE user_role AS ENUM ('owner', 'worker');
```

### equipment_category
```sql
CREATE TYPE equipment_category AS ENUM (
  'computer',
  'printer', 
  'monitor',
  'network_device',
  'phone',
  'tablet',
  'peripheral',
  'other'
);
```

### service_type
```sql
CREATE TYPE service_type AS ENUM (
  'inspection',
  'repair',
  'maintenance'
);
```

---

## 2. Tabele

### 2.1 profiles

Tabela profili użytkowników powiązana z `auth.users` przez relację 1:1.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE | Identyfikator powiązany z auth.users |
| name | VARCHAR(100) | NOT NULL, CHECK (length(name) >= 1) | Imię/nazwa użytkownika |
| role | user_role | NOT NULL DEFAULT 'worker' | Rola użytkownika |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Data utworzenia |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Data ostatniej modyfikacji |

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL CHECK (length(name) >= 1),
  role user_role NOT NULL DEFAULT 'worker',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.2 equipment_counter

Tabela licznika do generowania unikalnych ID sprzętu. Ukryta przed użytkownikami przez RLS.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| year | INTEGER | PRIMARY KEY | Rok dla licznika |
| counter | INTEGER | NOT NULL DEFAULT 0 | Aktualny numer w danym roku |

```sql
CREATE TABLE equipment_counter (
  year INTEGER PRIMARY KEY,
  counter INTEGER NOT NULL DEFAULT 0
);
```

### 2.3 equipment

Główna tabela sprzętu z pełnym audytem.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Wewnętrzny identyfikator |
| equipment_id | VARCHAR(15) | UNIQUE NOT NULL | Unikalny ID w formacie EQ-YYYY-NNNNN |
| name | VARCHAR(100) | NOT NULL, CHECK (length(name) >= 1) | Nazwa sprzętu |
| category | equipment_category | NOT NULL | Kategoria sprzętu |
| manufacturer | VARCHAR(100) | NOT NULL | Producent |
| model | VARCHAR(100) | NOT NULL | Model |
| serial_number | VARCHAR(100) | UNIQUE NOT NULL | Numer seryjny |
| description | TEXT | NULL | Opcjonalny opis |
| location | VARCHAR(200) | NULL | Opcjonalna lokalizacja |
| purchase_date | DATE | NULL | Opcjonalna data zakupu |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Data utworzenia |
| created_by | UUID | NOT NULL REFERENCES profiles(id) | Kto utworzył |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Data ostatniej modyfikacji |
| updated_by | UUID | NOT NULL REFERENCES profiles(id) | Kto ostatnio modyfikował |

```sql
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id VARCHAR(15) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL CHECK (length(name) >= 1),
  category equipment_category NOT NULL,
  manufacturer VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  serial_number VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  location VARCHAR(200),
  purchase_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID NOT NULL REFERENCES profiles(id)
);
```

### 2.4 service_entries

Tabela wpisów serwisowych powiązana z equipment.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Identyfikator wpisu |
| equipment_id | UUID | NOT NULL REFERENCES equipment(id) ON DELETE CASCADE | Powiązany sprzęt |
| service_timestamp | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Data i godzina serwisu |
| service_type | service_type | NOT NULL | Typ operacji serwisowej |
| description | TEXT | NOT NULL, CHECK (length(description) >= 5) | Opis wykonanych prac |
| performer_id | UUID | NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT | Wykonawca serwisu |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Data utworzenia wpisu |
| created_by | UUID | NOT NULL REFERENCES profiles(id) | Kto utworzył |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Data ostatniej modyfikacji |
| updated_by | UUID | NOT NULL REFERENCES profiles(id) | Kto ostatnio modyfikował |

```sql
CREATE TABLE service_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  service_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  service_type service_type NOT NULL,
  description TEXT NOT NULL CHECK (length(description) >= 5),
  performer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID NOT NULL REFERENCES profiles(id)
);
```

---

## 3. Relacje między tabelami

### Diagram relacji

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   auth.users    │       │    profiles     │       │   equipment     │
│─────────────────│       │─────────────────│       │─────────────────│
│ id (UUID) PK    │◄──────│ id (UUID) PK/FK │       │ id (UUID) PK    │
│ email           │  1:1  │ name            │       │ equipment_id UK │
│ ...             │       │ role (enum)     │       │ name            │
└─────────────────┘       │ created_at      │       │ category (enum) │
                          │ updated_at      │       │ manufacturer    │
                          └────────┬────────┘       │ model           │
                                   │                │ serial_number UK│
                    ┌──────────────┼──────────────┐ │ description     │
                    │              │              │ │ location        │
                    ▼              ▼              ▼ │ purchase_date   │
         ┌─────────────────┐    created_by    ┌────│ created_at/by   │
         │ service_entries │    updated_by    │    │ updated_at/by   │
         │─────────────────│                  │    └────────┬────────┘
         │ id (UUID) PK    │                  │             │
         │ equipment_id FK │◄─────────────────┼─────────────┘
         │ service_timestamp│       1:N       │    CASCADE
         │ service_type     │                 │
         │ description      │                 │
         │ performer_id FK  │◄────────────────┘
         │ created_at/by    │       1:N RESTRICT
         │ updated_at/by    │
         └─────────────────┘

┌─────────────────┐
│equipment_counter│  (ukryta, dostęp przez funkcję SECURITY DEFINER)
│─────────────────│
│ year (INT) PK   │
│ counter (INT)   │
└─────────────────┘
```

### Opis relacji

| Relacja | Kardynalność | Klucz obcy | On Delete | Opis |
|---------|--------------|------------|-----------|------|
| auth.users → profiles | 1:1 | profiles.id | CASCADE | Profil automatycznie usuwany z użytkownikiem |
| profiles → equipment (created_by) | 1:N | equipment.created_by | - | Kto utworzył sprzęt |
| profiles → equipment (updated_by) | 1:N | equipment.updated_by | - | Kto ostatnio modyfikował sprzęt |
| equipment → service_entries | 1:N | service_entries.equipment_id | CASCADE | Wpisy usuwane ze sprzętem |
| profiles → service_entries (performer_id) | 1:N | service_entries.performer_id | RESTRICT | Nie można usunąć użytkownika z wpisami |
| profiles → service_entries (created_by) | 1:N | service_entries.created_by | - | Kto utworzył wpis |
| profiles → service_entries (updated_by) | 1:N | service_entries.updated_by | - | Kto ostatnio modyfikował wpis |

---

## 4. Indeksy

```sql
-- Indeks UNIQUE na equipment_id (automatycznie tworzony przez UNIQUE constraint)
-- equipment.equipment_id UNIQUE

-- Indeks UNIQUE na serial_number (automatycznie tworzony przez UNIQUE constraint)
-- equipment.serial_number UNIQUE

-- Indeks B-tree na created_at dla sortowania listy sprzętu
CREATE INDEX idx_equipment_created_at ON equipment(created_at DESC);

-- Złożony indeks dla wydajnego pobierania wpisów serwisowych
CREATE INDEX idx_service_entries_equipment_timestamp 
  ON service_entries(equipment_id, service_timestamp DESC);

-- Indeks na performer_id dla zapytań o wpisy danego użytkownika
CREATE INDEX idx_service_entries_performer ON service_entries(performer_id);
```

---

## 5. Funkcje pomocnicze

### 5.1 get_current_user_role()

Pobiera rolę aktualnie zalogowanego użytkownika.

```sql
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;
```

### 5.2 is_owner()

Sprawdza czy aktualnie zalogowany użytkownik ma rolę owner.

```sql
CREATE OR REPLACE FUNCTION is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'owner'
  );
$$;
```

### 5.3 generate_equipment_id()

Generuje unikalny ID sprzętu w formacie EQ-YYYY-NNNNN.

```sql
CREATE OR REPLACE FUNCTION generate_equipment_id()
RETURNS VARCHAR(15)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year INTEGER;
  next_counter INTEGER;
  new_equipment_id VARCHAR(15);
BEGIN
  current_year := EXTRACT(YEAR FROM NOW());
  
  -- Upsert: wstaw rok jeśli nie istnieje lub zwiększ licznik
  INSERT INTO equipment_counter (year, counter)
  VALUES (current_year, 1)
  ON CONFLICT (year) DO UPDATE 
  SET counter = equipment_counter.counter + 1
  RETURNING counter INTO next_counter;
  
  -- Formatuj ID: EQ-YYYY-NNNNN (5 cyfr z zerami wiodącymi)
  new_equipment_id := 'EQ-' || current_year || '-' || LPAD(next_counter::TEXT, 5, '0');
  
  RETURN new_equipment_id;
END;
$$;
```

### 5.4 update_updated_at_column()

Funkcja triggera do automatycznej aktualizacji pola updated_at.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
```

### 5.5 set_equipment_id()

Funkcja triggera do automatycznego ustawiania equipment_id przed INSERT.

```sql
CREATE OR REPLACE FUNCTION set_equipment_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.equipment_id IS NULL THEN
    NEW.equipment_id := generate_equipment_id();
  END IF;
  RETURN NEW;
END;
$$;
```

### 5.6 create_profile_for_new_user()

Funkcja triggera do automatycznego tworzenia profilu po rejestracji użytkownika.

```sql
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Nowy użytkownik'),
    'worker'
  );
  RETURN NEW;
END;
$$;
```

---

## 6. Triggery

```sql
-- Automatyczna aktualizacja updated_at dla profiles
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Automatyczna aktualizacja updated_at dla equipment
CREATE TRIGGER trigger_equipment_updated_at
  BEFORE UPDATE ON equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Automatyczne generowanie equipment_id przed INSERT
CREATE TRIGGER trigger_set_equipment_id
  BEFORE INSERT ON equipment
  FOR EACH ROW
  EXECUTE FUNCTION set_equipment_id();

-- Automatyczna aktualizacja updated_at dla service_entries
CREATE TRIGGER trigger_service_entries_updated_at
  BEFORE UPDATE ON service_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Automatyczne tworzenie profilu po rejestracji użytkownika
CREATE TRIGGER trigger_create_profile_after_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_new_user();
```

---

## 7. Polityki Row Level Security (RLS)

### 7.1 Włączenie RLS na tabelach

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_counter ENABLE ROW LEVEL SECURITY;
```

### 7.2 Polityki dla tabeli profiles

```sql
-- Owner ma pełny dostęp do wszystkich profili
CREATE POLICY "Owner can do everything with profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING (is_owner())
  WITH CHECK (is_owner());

-- Użytkownicy mogą czytać własny profil
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Użytkownicy mogą aktualizować własne dane (bez zmiany roli)
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM profiles WHERE id = auth.uid()));
```

### 7.3 Polityki dla tabeli equipment

```sql
-- Zalogowani użytkownicy mogą czytać sprzęt
CREATE POLICY "Authenticated users can read equipment"
  ON equipment
  FOR SELECT
  TO authenticated
  USING (true);

-- Zalogowani użytkownicy mogą dodawać sprzęt
CREATE POLICY "Authenticated users can insert equipment"
  ON equipment
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Zalogowani użytkownicy mogą aktualizować sprzęt
CREATE POLICY "Authenticated users can update equipment"
  ON equipment
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tylko owner może usuwać sprzęt
CREATE POLICY "Only owner can delete equipment"
  ON equipment
  FOR DELETE
  TO authenticated
  USING (is_owner());
```

### 7.4 Polityki dla tabeli service_entries

```sql
-- Zalogowani użytkownicy mogą czytać wpisy serwisowe
CREATE POLICY "Authenticated users can read service entries"
  ON service_entries
  FOR SELECT
  TO authenticated
  USING (true);

-- Zalogowani użytkownicy mogą dodawać wpisy serwisowe
CREATE POLICY "Authenticated users can insert service entries"
  ON service_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Zalogowani użytkownicy mogą aktualizować wpisy serwisowe
CREATE POLICY "Authenticated users can update service entries"
  ON service_entries
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tylko owner może usuwać wpisy serwisowe
CREATE POLICY "Only owner can delete service entries"
  ON service_entries
  FOR DELETE
  TO authenticated
  USING (is_owner());
```

### 7.5 Polityki dla tabeli equipment_counter

```sql
-- Tabela ukryta - żaden użytkownik nie ma bezpośredniego dostępu
CREATE POLICY "No direct access to equipment_counter"
  ON equipment_counter
  FOR ALL
  TO authenticated
  USING (false);
```

---

## 8. Seed danych początkowych

Plik `supabase/seed.sql` do tworzenia konta właściciela:

```sql
-- Seed wymaga zmiennej środowiskowej OWNER_INITIAL_PASSWORD
-- Uruchom: OWNER_INITIAL_PASSWORD='haslo' supabase db reset

-- Uwaga: W Supabase seed.sql jest wykonywany po migracjach
-- Konto owner tworzymy przez Supabase Auth API, nie bezpośrednio SQL

-- Po utworzeniu użytkownika przez Auth API, zaktualizuj rolę:
-- UPDATE profiles SET role = 'owner' WHERE id = '<owner-user-id>';
```

---

## 9. Struktura migracji

```
supabase/
├── migrations/
│   ├── 00001_create_enums.sql
│   ├── 00002_create_profiles.sql
│   ├── 00003_create_equipment_counter.sql
│   ├── 00004_create_equipment.sql
│   ├── 00005_create_service_entries.sql
│   ├── 00006_create_functions.sql
│   ├── 00007_create_triggers.sql
│   └── 00008_create_rls_policies.sql
└── seed.sql
```

---

## 10. Dodatkowe uwagi i decyzje projektowe

### 10.1 Normalizacja
- Schemat jest w 3NF (trzeciej postaci normalnej)
- Email użytkownika pobierany jest przez JOIN z auth.users, nie jest duplikowany w profiles
- Brak denormalizacji - dla MVP z <1000 rekordów nie jest potrzebna

### 10.2 UUID vs auto-increment
- UUID jako klucze główne dla bezpieczeństwa i rozproszenia
- equipment_id (EQ-YYYY-NNNNN) jako osobne pole UNIQUE dla użytkowników

### 10.3 Przechowywanie czasu
- Wszystkie timestampy w UTC (TIMESTAMPTZ)
- Konwersja do lokalnej strefy czasowej w warstwie frontend

### 10.4 Kaskadowe usuwanie
- equipment → service_entries: CASCADE (usunięcie sprzętu usuwa wpisy)
- profiles → service_entries.performer_id: RESTRICT (nie można usunąć użytkownika z wpisami)
- auth.users → profiles: CASCADE (usunięcie konta usuwa profil)

### 10.5 Bezpieczeństwo
- Wszystkie funkcje pomocnicze jako SECURITY DEFINER z SET search_path = public
- equipment_counter całkowicie ukryta przez RLS (USING false)
- Ogólne komunikaty błędów RLS dla użytkowników, szczegóły w logach

### 10.6 Wydajność
- Offset-based pagination dla MVP (wystarczające dla małych zbiorów)
- Indeksy na najczęściej używane kolumny do sortowania i filtrowania
- Brak partycjonowania (możliwe do dodania w przyszłości)

### 10.7 Konwencje nazewnictwa
- snake_case dla wszystkich obiektów bazy danych
- Prefiks `trigger_` dla triggerów
- Prefiks `idx_` dla indeksów
- Funkcje nazywane opisowo (np. `is_owner()`, `generate_equipment_id()`)

### 10.8 Ograniczenia MVP
- Brak pola `status` w tabeli equipment
- Brak Full Text Search (wyszukiwanie tylko po equipment_id)
- Brak dedykowanych widoków
- Brak audit trail dla operacji DELETE
- Brak ograniczenia na datę w przyszłości dla service_timestamp
