/**
 * EquipmentCardList Component
 * Container for equipment cards in mobile view
 */

import { EquipmentCard } from "./EquipmentCard";
import type { EquipmentListItemDTO } from "@/types";

interface EquipmentCardListProps {
  data: EquipmentListItemDTO[];
  onItemClick: (equipment: EquipmentListItemDTO) => void;
  onEdit: (equipment: EquipmentListItemDTO) => void;
  onDelete: (equipment: EquipmentListItemDTO) => void;
  isOwner: boolean;
}

/**
 * List container for equipment cards
 */
export function EquipmentCardList({ data, onItemClick, onEdit, onDelete, isOwner }: EquipmentCardListProps) {
  if (data.length === 0) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">Brak wyników</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {data.map((equipment) => (
        <EquipmentCard
          key={equipment.id}
          equipment={equipment}
          onClick={onItemClick}
          onEdit={onEdit}
          onDelete={onDelete}
          isOwner={isOwner}
        />
      ))}
    </div>
  );
}
