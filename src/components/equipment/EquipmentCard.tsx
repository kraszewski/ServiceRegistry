/**
 * EquipmentCard Component
 * Card view for mobile devices with equipment details and actions
 */

import { Calendar, Building2, Hash, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CategoryBadge } from "./CategoryBadge";
import type { EquipmentListItemDTO } from "@/types";

interface EquipmentCardProps {
  equipment: EquipmentListItemDTO;
  onClick: (equipment: EquipmentListItemDTO) => void;
  onEdit: (equipment: EquipmentListItemDTO) => void;
  onDelete: (equipment: EquipmentListItemDTO) => void;
  isOwner: boolean;
}

/**
 * Format date to Polish locale
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * Equipment card for mobile view
 */
export function EquipmentCard({ equipment, onClick, onEdit, onDelete, isOwner }: EquipmentCardProps) {
  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={() => onClick(equipment)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(equipment);
        }
      }}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg leading-tight mb-1 truncate">{equipment.name}</h3>
            <p className="text-sm text-muted-foreground font-mono">{equipment.equipment_id}</p>
          </div>

          <div className="flex items-center gap-2">
            <CategoryBadge category={equipment.category} size="sm" />

            {/* Actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Akcje">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(equipment);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edytuj
                </DropdownMenuItem>

                {isOwner && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(equipment);
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Usuń
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Producent:</span>
          <span className="font-medium">{equipment.manufacturer}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Model:</span>
          <span className="font-medium">{equipment.model}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Data dodania:</span>
          <span className="font-medium">{formatDate(equipment.created_at)}</span>
        </div>
      </CardContent>

      {equipment.location && (
        <CardFooter className="text-sm text-muted-foreground pt-0">Lokalizacja: {equipment.location}</CardFooter>
      )}
    </Card>
  );
}
