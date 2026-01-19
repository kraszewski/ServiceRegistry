/**
 * DeleteEquipmentDialog Component
 * Confirmation dialog for equipment deletion with cascade warning
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { EquipmentListItemDTO } from "@/types";

interface DeleteEquipmentDialogProps {
  equipment: EquipmentListItemDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

/**
 * Confirmation dialog for deleting equipment
 */
export function DeleteEquipmentDialog({
  equipment,
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: DeleteEquipmentDialogProps) {
  if (!equipment) {
    return null;
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Usunąć sprzęt?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Ta akcja jest nieodwracalna. Sprzęt{" "}
              <strong className="font-semibold text-foreground">
                {equipment.equipment_id} - {equipment.name}
              </strong>{" "}
              oraz wszystkie powiązane wpisy serwisowe zostaną trwale usunięte.
            </p>
            <p className="text-destructive font-medium">
              Uwaga: Wszystkie wpisy serwisowe powiązane z tym sprzętem również zostaną usunięte!
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Usuwanie..." : "Usuń"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
