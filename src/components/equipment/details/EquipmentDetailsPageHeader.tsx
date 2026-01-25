/**
 * EquipmentDetailsPageHeader Component
 * Sticky header with breadcrumbs, title, and action buttons
 */

import { Button } from "@/components/ui/button";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/shared/Breadcrumbs";
import { Pencil, Trash2 } from "lucide-react";
import type { EquipmentDTO } from "@/types";

interface EquipmentDetailsPageHeaderProps {
  equipment: EquipmentDTO;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Page header for equipment details with breadcrumbs and actions
 */
export function EquipmentDetailsPageHeader({
  equipment,
  isOwner,
  onEdit,
  onDelete,
}: EquipmentDetailsPageHeaderProps) {
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Sprzęt", href: "/equipment" },
    { label: equipment.name },
  ];

  return (
    <header className="sticky top-0 z-10 bg-background border-b mb-6 -mx-4 px-4 py-4 sm:-mx-6 sm:px-6">
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{equipment.equipment_id}</h1>
            <p className="text-muted-foreground">{equipment.name}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={onEdit} size="default" variant="outline">
              <Pencil className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Edytuj</span>
            </Button>

            {isOwner && (
              <Button onClick={onDelete} size="default" variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Usuń</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
