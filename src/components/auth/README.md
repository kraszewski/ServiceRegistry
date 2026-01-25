# Auth Components

Komponenty związane z procesem uwierzytelniania (logowanie i rejestracja).

## Struktura

```
auth/
├── LoginForm.tsx         - Formularz logowania
├── RegisterForm.tsx      - Formularz rejestracji
├── index.ts             - Publiczne eksporty
└── README.md            - Ten plik
```

## Komponenty

### LoginForm

Formularz logowania użytkownika z polami:
- Email (wymagany, walidacja formatu email)
- Hasło (wymagane, minimum 8 znaków)
- Przycisk pokaż/ukryj hasło
- Link do strony rejestracji

**Props:**
- `onSuccess?: () => void` - callback wywoływany po udanym logowaniu
- `onError?: (error: string) => void` - callback wywoływany w przypadku błędu

**Przykład użycia:**
```tsx
<LoginForm 
  onSuccess={() => console.log('Logged in')}
  onError={(error) => console.error(error)}
/>
```

**Uwaga:** Backend nie jest jeszcze zaimplementowany. Komponent obecnie loguje dane do konsoli.

### RegisterForm

Formularz rejestracji nowego użytkownika z polami:
- Imię i nazwisko (wymagane, maksymalnie 100 znaków)
- Email (wymagany, walidacja formatu email)
- Hasło (wymagane, minimum 8 znaków)
- Potwierdzenie hasła (wymagane, musi być identyczne z hasłem)
- Przyciski pokaż/ukryj hasło dla obu pól hasła
- Link do strony logowania

**Props:**
- `onSuccess?: () => void` - callback wywoływany po udanej rejestracji
- `onError?: (error: string) => void` - callback wywoływany w przypadku błędu

**Przykład użycia:**
```tsx
<RegisterForm 
  onSuccess={() => console.log('Registered')}
  onError={(error) => console.error(error)}
/>
```

**Uwaga:** Backend nie jest jeszcze zaimplementowany. Komponent obecnie loguje dane do konsoli.

## Walidacja

Oba formularze używają React Hook Form z walidacją Zod:

- **LoginForm** - `loginFormSchema` (src/lib/schemas/login-form.schema.ts)
- **RegisterForm** - `registerFormSchema` (src/lib/schemas/register-form.schema.ts)

## Strony

Komponenty są używane na stronach Astro:

- `/login` - `src/pages/login.astro`
- `/register` - `src/pages/register.astro`

Obie strony wykorzystują:
- Layout z nawigacją
- Centrowane formularze na tle z gradientem
- Animację fade-in przy ładowaniu

## Stylowanie

Komponenty używają:
- Shadcn/ui components (Card, Form, Input, Button)
- Tailwind CSS dla stylowania
- Lucide React dla ikon (LogIn, UserPlus, Eye, EyeOff)

## TODO - Backend

Następujące endpointy API wymagają implementacji:

### POST /api/auth/login
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Jan Kowalski",
    "role": "owner" | "worker"
  }
}
```

**Errors:**
- `400` - Błąd walidacji
- `401` - Nieprawidłowe dane logowania
- `500` - Błąd serwera

### POST /api/auth/register
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Jan Kowalski"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Jan Kowalski",
    "role": "worker"
  }
}
```

**Errors:**
- `400` - Błąd walidacji
- `409` - Email już istnieje
- `500` - Błąd serwera

### POST /api/auth/logout
**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

## Bezpieczeństwo

- Hasła są walidowane po stronie klienta (minimum 8 znaków)
- Walidacja formatu email
- Input type="password" dla pól hasła
- Autocomplete attributes dla lepszego UX i bezpieczeństwa
- Przyciski pokaż/ukryj hasło z odpowiednimi aria-labels

## Dostępność

- Wszystkie pola mają odpowiednie labels
- Komunikaty błędów są wyświetlane pod polami
- Przyciski pokaż/ukryj hasło mają aria-labels
- Formularze są responsywne (max-width: 28rem)
