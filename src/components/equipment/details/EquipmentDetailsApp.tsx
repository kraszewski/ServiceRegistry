/**
 * EquipmentDetailsApp Component
 * Main React component for equipment details page
 */

import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useUser } from "@/components/hooks/useUser";
import { useEquipmentDetails } from "@/components/hooks/useEquipmentDetails";
import { useServiceEntries } from "@/components/hooks/useServiceEntries";
import { useDeleteEquipment } from "@/components/hooks/useDeleteEquipment";
import {
  useCreateServiceEntry,
  useUpdateServiceEntry,
  useDeleteServiceEntry,
} from "@/components/hooks/useServiceEntryMutations";
import { EquipmentDetailsPageHeader } from "./EquipmentDetailsPageHeader";
import { EquipmentDataCard } from "./EquipmentDataCard";
import { ServiceHistorySection } from "./ServiceHistorySection";
import { ServiceEntryFormDrawer } from "./ServiceEntryFormDrawer";
import { DeleteEquipmentAlertDialog } from "./DeleteEquipmentAlertDialog";
import { DeleteServiceEntryAlertDialog } from "./DeleteServiceEntryAlertDialog";
import { EquipmentFormDialog } from "@/components/equipment/EquipmentFormDialog";
import type { CreateServiceEntryCommand, ServiceEntryDTO } from "@/types";

interface EquipmentDetailsAppProps {
  equipmentId: string;
}

/**
 * Main equipment details application component
 */
export function EquipmentDetailsApp({ equipmentId }: EquipmentDetailsAppProps) {
  const { user, isOwner, isLoading: isLoadingUser } = useUser();
  const [page] = useState(1);

  // Queries
  const { data: equipment, isLoading: isLoadingEquipment, error: equipmentError } = useEquipmentDetails(equipmentId);

  const { data: entriesData, isLoading: isLoadingEntries } = useServiceEntries(equipmentId, { page, limit: 50 });

  const entries = entriesData?.data ?? [];

  // Mutations
  const deleteEquipmentMutation = useDeleteEquipment();
  const createEntryMutation = useCreateServiceEntry();
  const updateEntryMutation = useUpdateServiceEntry();
  const deleteEntryMutation = useDeleteServiceEntry();

  // Dialog state
  const [dialogState, setDialogState] = useState({
    equipmentFormOpen: false,
    serviceEntryDrawerOpen: false,
    serviceEntryDrawerMode: "create" as "create" | "edit",
    serviceEntryEditData: undefined as ServiceEntryDTO | undefined,
    deleteEquipmentDialogOpen: false,
    deleteEntryDialogOpen: false,
    deleteEntryId: undefined as string | undefined,
  });

  // Handlers for equipment
  const handleEdit = () => {
    setDialogState((prev) => ({ ...prev, equipmentFormOpen: true }));
  };

  const handleDelete = () => {
    setDialogState((prev) => ({ ...prev, deleteEquipmentDialogOpen: true }));
  };

  const handleConfirmDeleteEquipment = async () => {
    try {
      await deleteEquipmentMutation.mutateAsync(equipmentId);
      toast.success("Sprzęt usunięty pomyślnie");
      setDialogState((prev) => ({ ...prev, deleteEquipmentDialogOpen: false }));
      // Redirect to equipment list
      window.location.href = "/equipment";
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "error" in error ? String(error.error) : "Nie udało się usunąć sprzętu";
      toast.error(errorMessage);
    }
  };

  // Handlers for service entries
  const handleAddEntry = () => {
    setDialogState((prev) => ({
      ...prev,
      serviceEntryDrawerOpen: true,
      serviceEntryDrawerMode: "create",
      serviceEntryEditData: undefined,
    }));
  };

  const handleEditEntry = (entryId: string) => {
    const entry = entries.find((e) => e.id === entryId);
    if (entry) {
      setDialogState((prev) => ({
        ...prev,
        serviceEntryDrawerOpen: true,
        serviceEntryDrawerMode: "edit",
        serviceEntryEditData: entry,
      }));
    }
  };

  const handleDeleteEntry = (entryId: string) => {
    setDialogState((prev) => ({
      ...prev,
      deleteEntryDialogOpen: true,
      deleteEntryId: entryId,
    }));
  };

  const handleSubmitServiceEntry = async (data: CreateServiceEntryCommand) => {
    try {
      if (dialogState.serviceEntryDrawerMode === "create") {
        await createEntryMutation.mutateAsync({ equipmentId, command: data });
        toast.success("Wpis dodany pomyślnie");
      } else if (dialogState.serviceEntryEditData) {
        await updateEntryMutation.mutateAsync({
          entryId: dialogState.serviceEntryEditData.id,
          equipmentId,
          command: data,
        });
        toast.success("Wpis zaktualizowany pomyślnie");
      }
      setDialogState((prev) => ({
        ...prev,
        serviceEntryDrawerOpen: false,
        serviceEntryEditData: undefined,
      }));
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "error" in error ? String(error.error) : "Nie udało się zapisać wpisu";
      toast.error(errorMessage);
    }
  };

  const handleConfirmDeleteEntry = async () => {
    if (!dialogState.deleteEntryId) return;

    try {
      await deleteEntryMutation.mutateAsync({
        entryId: dialogState.deleteEntryId,
        equipmentId,
      });
      toast.success("Wpis usunięty pomyślnie");
      setDialogState((prev) => ({
        ...prev,
        deleteEntryDialogOpen: false,
        deleteEntryId: undefined,
      }));
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "error" in error ? String(error.error) : "Nie udało się usunąć wpisu";
      toast.error(errorMessage);
    }
  };

  // Handle errors
  if (equipmentError) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-destructive mb-2">Błąd ładowania</h2>
          <p className="text-muted-foreground">
            {equipmentError.error || "Nie udało się załadować szczegółów sprzętu"}
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoadingEquipment || isLoadingUser) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // No data
  if (!equipment || !user) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nie znaleziono sprzętu</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <EquipmentDetailsPageHeader equipment={equipment} isOwner={isOwner} onEdit={handleEdit} onDelete={handleDelete} />

      <div className="space-y-8">
        <EquipmentDataCard equipment={equipment} />

        <Separator />

        <ServiceHistorySection
          equipmentId={equipmentId}
          entries={entries}
          isLoading={isLoadingEntries}
          isOwner={isOwner}
          onAddEntry={handleAddEntry}
          onEditEntry={handleEditEntry}
          onDeleteEntry={handleDeleteEntry}
        />
      </div>

      {/* Dialogs and Drawers */}
      <EquipmentFormDialog
        open={dialogState.equipmentFormOpen}
        onOpenChange={(open) => setDialogState((prev) => ({ ...prev, equipmentFormOpen: open }))}
        mode="edit"
        equipment={equipment}
        onSuccess={() => {
          toast.success("Sprzęt zaktualizowany pomyślnie");
          setDialogState((prev) => ({ ...prev, equipmentFormOpen: false }));
          // Refresh equipment data
          window.location.reload();
        }}
      />

      <ServiceEntryFormDrawer
        open={dialogState.serviceEntryDrawerOpen}
        onOpenChange={(open) =>
          setDialogState((prev) => ({
            ...prev,
            serviceEntryDrawerOpen: open,
            serviceEntryEditData: open ? prev.serviceEntryEditData : undefined,
          }))
        }
        equipmentId={equipmentId}
        mode={dialogState.serviceEntryDrawerMode}
        entry={dialogState.serviceEntryEditData}
        currentUser={{ id: user.id, name: user.name || user.email }}
        onSubmit={handleSubmitServiceEntry}
        isSubmitting={createEntryMutation.isPending || updateEntryMutation.isPending}
      />

      <DeleteEquipmentAlertDialog
        open={dialogState.deleteEquipmentDialogOpen}
        onOpenChange={(open) => setDialogState((prev) => ({ ...prev, deleteEquipmentDialogOpen: open }))}
        equipmentName={equipment.name}
        entriesCount={entries.length}
        onConfirm={handleConfirmDeleteEquipment}
        isDeleting={deleteEquipmentMutation.isPending}
      />

      <DeleteServiceEntryAlertDialog
        open={dialogState.deleteEntryDialogOpen}
        onOpenChange={(open) => setDialogState((prev) => ({ ...prev, deleteEntryDialogOpen: open }))}
        onConfirm={handleConfirmDeleteEntry}
        isDeleting={deleteEntryMutation.isPending}
      />
    </div>
  );
}
