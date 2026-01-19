/**
 * EquipmentTable Component
 * Desktop table view with sortable columns and row actions
 */

import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "./CategoryBadge";
import { EquipmentRowActions } from "./EquipmentRowActions";
import type { EquipmentListItemDTO } from "@/types";

export interface SortConfig {
  field: "created_at" | "name" | "equipment_id" | "category" | "manufacturer";
  order: "asc" | "desc";
}

interface EquipmentTableProps {
  data: EquipmentListItemDTO[];
  sortConfig: SortConfig;
  onSort: (field: SortConfig["field"]) => void;
  onRowClick: (equipment: EquipmentListItemDTO) => void;
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
 * Sort header button with icon
 */
function SortButton({
  children,
  field,
  currentSort,
  onSort,
}: {
  children: React.ReactNode;
  field: SortConfig["field"];
  currentSort: SortConfig;
  onSort: (field: SortConfig["field"]) => void;
}) {
  const isActive = currentSort.field === field;
  const Icon = isActive ? (currentSort.order === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <Button variant="ghost" size="sm" onClick={() => onSort(field)} className="-ml-3 h-8 data-[state=open]:bg-accent">
      {children}
      <Icon className="ml-2 h-4 w-4" />
    </Button>
  );
}

/**
 * Equipment table for desktop view
 */
export function EquipmentTable({
  data,
  sortConfig,
  onSort,
  onRowClick,
  onEdit,
  onDelete,
  isOwner,
}: EquipmentTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortButton field="equipment_id" currentSort={sortConfig} onSort={onSort}>
                Equipment ID
              </SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="name" currentSort={sortConfig} onSort={onSort}>
                Nazwa
              </SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="manufacturer" currentSort={sortConfig} onSort={onSort}>
                Producent
              </SortButton>
            </TableHead>
            <TableHead>Model</TableHead>
            <TableHead>
              <SortButton field="category" currentSort={sortConfig} onSort={onSort}>
                Kategoria
              </SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="created_at" currentSort={sortConfig} onSort={onSort}>
                Data dodania
              </SortButton>
            </TableHead>
            <TableHead className="text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                Brak wyników
              </TableCell>
            </TableRow>
          ) : (
            data.map((equipment) => (
              <TableRow
                key={equipment.id}
                onClick={() => onRowClick(equipment)}
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onRowClick(equipment);
                  }
                }}
              >
                <TableCell className="font-mono text-sm">{equipment.equipment_id}</TableCell>
                <TableCell className="font-medium">{equipment.name}</TableCell>
                <TableCell>{equipment.manufacturer}</TableCell>
                <TableCell>{equipment.model}</TableCell>
                <TableCell>
                  <CategoryBadge category={equipment.category} size="sm" />
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(equipment.created_at)}</TableCell>
                <TableCell>
                  <EquipmentRowActions equipment={equipment} onEdit={onEdit} onDelete={onDelete} isOwner={isOwner} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
