/**
 * ActiveFiltersBadges Component
 * Displays active filters as removable badges
 */

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCategoryLabel } from "@/lib/constants/equipment-categories";
import type { EquipmentCategory } from "@/types";

export interface ActiveFilter {
  type: "category";
  value: string;
  label: string;
}

interface ActiveFiltersBadgesProps {
  filters: ActiveFilter[];
  onRemoveFilter: (filter: ActiveFilter) => void;
  onClearAll: () => void;
}

/**
 * Display active filters with remove buttons
 */
export function ActiveFiltersBadges({ filters, onRemoveFilter, onClearAll }: ActiveFiltersBadgesProps) {
  if (filters.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground">Aktywne filtry:</span>

      {filters.map((filter) => (
        <Badge key={`${filter.type}-${filter.value}`} variant="secondary" className="gap-1 pr-1">
          {filter.label}
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={() => onRemoveFilter(filter)}
            aria-label={`Usuń filtr ${filter.label}`}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}

      {filters.length > 1 && (
        <Button variant="ghost" size="sm" onClick={onClearAll} className="h-6 text-xs">
          Wyczyść wszystkie
        </Button>
      )}
    </div>
  );
}

/**
 * Helper to build active filters array from current params
 */
export function buildActiveFilters(category: EquipmentCategory | null | undefined): ActiveFilter[] {
  const filters: ActiveFilter[] = [];

  if (category) {
    filters.push({
      type: "category",
      value: category,
      label: getCategoryLabel(category),
    });
  }

  return filters;
}
