/**
 * FilterBar Component
 * Container for filters and active filter badges
 */

import { Search, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CategoryCombobox } from "./CategoryCombobox";
import { ActiveFiltersBadges, buildActiveFilters } from "./ActiveFiltersBadges";
import type { EquipmentCategory } from "@/types";

interface FilterBarProps {
  selectedCategory: EquipmentCategory | null;
  searchQuery: string;
  onCategoryChange: (category: EquipmentCategory | null) => void;
  onSearchChange: (search: string) => void;
  onClearAllFilters: () => void;
}

/**
 * Filter bar with category selection, search input, and active filters display
 */
export function FilterBar({
  selectedCategory,
  searchQuery,
  onCategoryChange,
  onSearchChange,
  onClearAllFilters,
}: FilterBarProps) {
  // Local state for immediate input display (before debounce)
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Sync local state with prop when external change occurs
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Debounce search - wait 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        onSearchChange(localSearch);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, onSearchChange]);

  const activeFilters = buildActiveFilters(selectedCategory, searchQuery);

  const handleRemoveFilter = (filter: { type: string }) => {
    if (filter.type === "category") {
      onCategoryChange(null);
    } else if (filter.type === "search") {
      setLocalSearch("");
      onSearchChange("");
    }
  };

  const handleSearchClear = () => {
    setLocalSearch("");
    onSearchChange("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <CategoryCombobox value={selectedCategory} onChange={onCategoryChange} />

        <div className="relative w-full sm:w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Szukaj po ID sprzętu..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {localSearch && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={handleSearchClear}
              aria-label="Wyczyść wyszukiwanie"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <ActiveFiltersBadges filters={activeFilters} onRemoveFilter={handleRemoveFilter} onClearAll={onClearAllFilters} />
    </div>
  );
}
