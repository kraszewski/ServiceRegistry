# Quick Test: US-013 Authorization

## Test jako Worker

### 1. Visual Check - Equipment Details Page

**URL:** `/equipment/[any-id]`

**Expected UI Elements:**
- ✅ Header z breadcrumbs
- ✅ Przycisk "Edytuj" - VISIBLE
- ❌ Przycisk "Usuń" - HIDDEN (nie renderowany w ogóle)

**Service Entry Menu (⋮):**
- ✅ Opcja "Edytuj" - VISIBLE
- ❌ Opcja "Usuń" - HIDDEN (separator też nie pokazany)

### 2. Console Test - API Calls

Otwórz DevTools Console i wykonaj:

```javascript
// Test 1: Try to delete equipment (should fail with 403)
fetch('/api/equipment/YOUR-EQUIPMENT-ID', { method: 'DELETE' })
  .then(r => r.json())
  .then(console.log);
// Expected: { error: "Only owner can delete equipment" }

// Test 2: Try to delete service entry (should fail with 403)
fetch('/api/service-entries/YOUR-ENTRY-ID', { method: 'DELETE' })
  .then(r => r.json())
  .then(console.log);
// Expected: { error: "Only owner can delete service entries" }

// Test 3: Try to access user management (should fail with 403)
fetch('/api/users')
  .then(r => r.json())
  .then(console.log);
// Expected: { error: "Only owner can access user management" }
```

### 3. Network Tab Check

1. Otwórz Network tab w DevTools
2. Odśwież stronę `/equipment/[id]`
3. Sprawdź czy NIE ma żadnych requestów do DELETE endpoints
4. Worker nie powinien nawet próbować wysyłać DELETE requests

---

## Test jako Owner

### 1. Visual Check - Equipment Details Page

**URL:** `/equipment/[any-id]`

**Expected UI Elements:**
- ✅ Header z breadcrumbs
- ✅ Przycisk "Edytuj" - VISIBLE
- ✅ Przycisk "Usuń" - VISIBLE (czerwony, destructive)

**Service Entry Menu (⋮):**
- ✅ Opcja "Edytuj" - VISIBLE
- ✅ Separator
- ✅ Opcja "Usuń" - VISIBLE (czerwony tekst)

### 2. Functional Test - Delete Actions

**Delete Equipment:**
1. Kliknij "Usuń" w headerze
2. Powinien otworzyć się AlertDialog z ostrzeżeniem
3. Powinno pokazać liczbę wpisów do usunięcia (cascade)
4. Kliknij "Usuń" w dialogu
5. Toast: "Sprzęt usunięty pomyślnie"
6. Redirect do `/equipment`

**Delete Service Entry:**
1. Kliknij menu "⋮" przy wpisie
2. Kliknij "Usuń"
3. Powinien otworzyć się AlertDialog z ostrzeżeniem
4. Kliknij "Usuń" w dialogu
5. Toast: "Wpis usunięty pomyślnie"
6. Wpis znika z timeline

### 3. API Success Check

```javascript
// Should succeed with 200 (owner can delete)
fetch('/api/equipment/YOUR-EQUIPMENT-ID', { method: 'DELETE' })
  .then(r => console.log('Status:', r.status, 'Expected: 200'))
  .then(r => r.json())
  .then(console.log);
// Expected: { message: "Equipment deleted successfully" }
```

---

## Quick Pass/Fail Checklist

### Worker
- [ ] Przycisk "Usuń sprzęt" NIEWIDOCZNY w headerze
- [ ] Opcja "Usuń wpis" NIEWIDOCZNA w menu
- [ ] DELETE equipment API zwraca 403
- [ ] DELETE service-entry API zwraca 403
- [ ] GET /api/users zwraca 403

### Owner
- [ ] Przycisk "Usuń sprzęt" WIDOCZNY w headerze
- [ ] Opcja "Usuń wpis" WIDOCZNA w menu
- [ ] DELETE equipment działa (200)
- [ ] DELETE service-entry działa (200)
- [ ] Cascade delete działa (usunięcie sprzętu usuwa wpisy)
- [ ] Confirmation dialogs się pokazują
- [ ] Toast notifications działają

---

## Debug Tips

### Jak sprawdzić swoją rolę?
```javascript
// W konsoli:
fetch('/api/auth/session')
  .then(r => r.json())
  .then(data => console.log('Your role:', data.user?.role));
```

### Inspect Element
- Prawym na przycisk → Inspect
- Sprawdź czy element w ogóle istnieje w DOM
- Worker: element nie powinien być w DOM (nie tylko display:none)

### Check Network 403s
- Filtruj Network tab po statusie: `status-code:403`
- Worker powinien NIE mieć prób DELETE (bo UI ukryty)
- Tylko jeśli ktoś próbuje przez console/API client

---

## Result

**PASS** = Wszystkie checklisty spełnione  
**FAIL** = Jakikolwiek punkt nie działa

If FAIL: Sprawdź:
1. `useUser()` hook zwraca poprawną rolę
2. `isOwner` jest prawidłowo przekazywany do komponentów
3. API endpoints mają `is_owner()` check
4. Conditional rendering używa `{isOwner && ...}` nie `disabled={!isOwner}`
