/**
 * DeleteEquipmentAlertDialog Component
 * Confirmation dialog for deleting equipment with cascade warning
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

interface DeleteEquipmentAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentName: string;
  entriesCount: number;
  onConfirm: () => void | Promise<void>;
  isDeleting?: boolean;
}

/**
 * Alert dialog for confirming equipment deletion
 */
export function DeleteEquipmentAlertDialog({
  open,
  onOpenChange,
  equipmentName,
  entriesCount,
  onConfirm,
  isDeleting = false,
}: DeleteEquipmentAlertDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Usunąć sprzęt?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Ta akcja jest <strong>nieodwracalna</strong>. Sprzęt <strong>{equipmentName}</strong> zostanie trwale
              usunięty z bazy danych.
            </p>
            {entriesCount > 0 && (
              <p className="text-destructive font-medium">
                Uwaga: Usunięcie sprzętu spowoduje również usunięcie{" "}
                <strong>
                  {entriesCount} {entriesCount === 1 ? "wpisu" : entriesCount < 5 ? "wpisów" : "wpisów"} serwisowego
                  {entriesCount === 1 ? "" : "wych"}
                </strong>
                .
              </p>
            )}
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
