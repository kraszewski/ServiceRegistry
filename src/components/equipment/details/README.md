# Equipment Details View - Component Documentation

## Overview

This directory contains all components for the Equipment Details view (`/equipment/[id]`). The view displays comprehensive equipment information and service history with timeline visualization.

## Component Hierarchy

```
EquipmentDetailsAppWrapper (with QueryProvider)
└── EquipmentDetailsApp
    ├── EquipmentDetailsPageHeader
    │   └── Breadcrumbs
    ├── EquipmentDataCard
    │   ├── DataField (multiple instances)
    │   └── CategoryBadge
    ├── ServiceHistorySection
    │   └── ServiceEntryTimeline
    │       ├── EmptyState (when no entries)
    │       └── ServiceEntryItem (multiple instances)
    │           ├── DateTimeDisplay
    │           ├── ServiceTypeBadge
    │           └── ActionsDropdown
    ├── EquipmentFormDialog (for edit)
    ├── ServiceEntryFormDrawer (for create/edit)
    ├── DeleteEquipmentAlertDialog
    └── DeleteServiceEntryAlertDialog
```

## Main Components

### EquipmentDetailsAppWrapper
- **Purpose**: Provides React Query context
- **Props**: `equipmentId: string`
- **Features**: Wraps app with QueryProvider

### EquipmentDetailsApp
- **Purpose**: Main application component
- **Props**: `equipmentId: string`
- **Features**:
  - Manages all state and mutations
  - Handles API calls
  - Coordinates dialogs and drawers
  - Error handling and loading states

### EquipmentDetailsPageHeader
- **Purpose**: Sticky page header with navigation and actions
- **Props**: `equipment`, `isOwner`, `onEdit`, `onDelete`
- **Features**:
  - Breadcrumb navigation
  - Equipment ID and name display
  - Edit and Delete buttons (Delete only for owners)

### EquipmentDataCard
- **Purpose**: Display all equipment information
- **Props**: `equipment: EquipmentDTO`
- **Features**:
  - 2-column grid layout (responsive)
  - Category badge with icon
  - Metadata section
  - Formatted dates

## Timeline Components

### ServiceHistorySection
- **Purpose**: Section header and timeline container
- **Props**: `equipmentId`, `entries`, `isLoading`, `isOwner`, callbacks
- **Features**:
  - Add entry button
  - Loading skeleton
  - Timeline integration

### ServiceEntryTimeline
- **Purpose**: Timeline visualization of service entries
- **Props**: `entries`, `isOwner`, callbacks
- **Features**:
  - Chronological ordering (newest first)
  - Empty state when no entries
  - Vertical line CSS

### ServiceEntryItem
- **Purpose**: Single entry in timeline
- **Props**: `entry`, `isOwner`, `onEdit`, `onDelete`
- **Features**:
  - Expandable description (read more/less)
  - Service type badge
  - DateTime with tooltip
  - Actions dropdown (owner controls delete visibility)

### ServiceTypeBadge
- **Purpose**: Display service type with icon and color
- **Props**: `serviceType: ServiceType`, `size?: "sm" | "md"`
- **Features**:
  - Icon mapping (inspection, repair, maintenance)
  - Color coding
  - Size variants

### DateTimeDisplay
- **Purpose**: Timestamp with relative/absolute formatting
- **Props**: `timestamp: string`, `showRelative?: boolean`
- **Features**:
  - Relative time (<7 days): "2 hours ago"
  - Absolute time (≥7 days): "19 Jan 2024, 14:30"
  - Tooltip with full datetime

### ActionsDropdown
- **Purpose**: Dropdown menu with actions
- **Props**: `onEdit`, `onDelete`, `showDelete?: boolean`
- **Features**:
  - Edit option for all users
  - Delete option conditionally shown (owner only)
  - Keyboard navigation

## Form Components

### ServiceEntryFormDrawer
- **Purpose**: Drawer for creating/editing service entries
- **Props**: `open`, `onOpenChange`, `equipmentId`, `mode`, `entry?`, `currentUser`, `onSubmit`, `isSubmitting`
- **Features**:
  - DateTime picker (editable, defaults to now)
  - Service type select with icons
  - Description textarea (5-2000 chars)
  - Read-only performer field
  - Form validation with Zod

### DeleteEquipmentAlertDialog
- **Purpose**: Confirmation dialog for equipment deletion
- **Props**: `open`, `onOpenChange`, `equipmentName`, `entriesCount`, `onConfirm`, `isDeleting`
- **Features**:
  - Cascade warning (shows count of entries to be deleted)
  - Destructive styling
  - Loading state

### DeleteServiceEntryAlertDialog
- **Purpose**: Confirmation dialog for entry deletion
- **Props**: `open`, `onOpenChange`, `onConfirm`, `isDeleting`
- **Features**:
  - Simple confirmation
  - Destructive styling
  - Loading state

## Hooks Used

### Queries
- `useEquipmentDetails(equipmentId)` - Fetch equipment details
- `useServiceEntries(equipmentId, params)` - Fetch service entries (paginated)
- `useServiceEntryDetail(entryId, enabled)` - Fetch single entry (for edit)

### Mutations
- `useDeleteEquipment()` - Delete equipment
- `useCreateServiceEntry()` - Create service entry
- `useUpdateServiceEntry()` - Update service entry
- `useDeleteServiceEntry()` - Delete service entry

### Other
- `useUser()` - Get current user and role
- `useUpdateEquipment()` - Update equipment (via EquipmentFormDialog)

## State Management

### Local State
- Dialog/drawer open states
- Edit mode and data
- Delete confirmation IDs

### Server State (TanStack Query)
- Equipment details (60s stale time)
- Service entries list (30s stale time)
- Automatic invalidation on mutations

## Authorization

### Owner-only Features
- Delete equipment button
- Delete service entry option in dropdown
- Both hidden completely (not just disabled) for non-owners

### All Authenticated Users
- View details
- Edit equipment
- Add/edit service entries

## Styling

### Layout
- Container with responsive padding
- Sticky header (z-10)
- Grid layouts (1/2 columns responsive)
- Vertical timeline with CSS pseudo-elements

### Colors
- Service types: blue (inspection), orange (repair), green (maintenance)
- Destructive actions: red
- Muted colors for metadata

### Responsive
- Mobile: 1 column, compact spacing, icon-only buttons
- Desktop: 2 columns, full labels

## Error Handling

### API Errors
- Toast notifications for user-facing errors
- Inline validation errors in forms
- 404: Redirect to equipment list
- 401: Redirect to login
- 409: Duplicate serial number warning

### Loading States
- Skeleton loaders for initial data
- Disabled buttons during mutations
- Loading text on submit buttons

## Performance

### Optimizations
- React Query caching and stale time
- Memoization not needed (simple components)
- Lazy loading for heavy components (future)

### Bundle Size
- Equipment Details bundle: ~24KB gzipped
- Shared dependencies: ~410KB (EquipmentFormDialog)

## Future Enhancements

### Planned (Post-MVP)
- Pagination for service entries
- Filtering and search in timeline
- Optimistic locking for concurrent edits
- Export service history to PDF
- Attachments for service entries
- Dark mode support

## Testing

### Manual Testing Checklist
- [ ] View equipment details as owner
- [ ] View equipment details as worker
- [ ] Edit equipment (all users)
- [ ] Delete equipment (owner only)
- [ ] Add service entry
- [ ] Edit service entry
- [ ] Delete service entry (owner only)
- [ ] Expand/collapse long descriptions
- [ ] View timestamps tooltips
- [ ] Keyboard navigation
- [ ] Mobile responsive
- [ ] Error handling (404, API errors)

### E2E Tests (Future)
- Equipment details flow
- Service entry CRUD operations
- Authorization checks
- Error scenarios

## Related Files

- `/src/pages/equipment/[id].astro` - Page entry point
- `/src/lib/constants/service-types.ts` - Service type configuration
- `/src/lib/schemas/service-entry.schema.ts` - Validation schemas
- `/src/types.ts` - Type definitions
