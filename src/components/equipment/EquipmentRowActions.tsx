/**
 * EquipmentRowActions Component
 * Action buttons (edit, delete) displayed in table row
 */

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { EquipmentListItemDTO } from "@/types";

interface EquipmentRowActionsProps {
  equipment: EquipmentListItemDTO;
  onEdit: (equipment: EquipmentListItemDTO) => void;
  onDelete: (equipment: EquipmentListItemDTO) => void;
  isOwner: boolean;
}

/**
 * Action buttons for equipment table row
 */
export function EquipmentRowActions({ equipment, onEdit, onDelete, isOwner }: EquipmentRowActionsProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center justify-end gap-1">
        {/* Edit button - visible for all users */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(equipment);
              }}
              aria-label="Edytuj sprzęt"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Edytuj sprzęt</p>
          </TooltipContent>
        </Tooltip>

        {/* Delete button - visible only for owners */}
        {isOwner && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(equipment);
                }}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                aria-label="Usuń sprzęt"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Usuń sprzęt</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
