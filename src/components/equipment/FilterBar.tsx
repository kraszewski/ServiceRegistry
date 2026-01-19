/**
 * FilterBar Component
 * Container for filters and active filter badges
 */

import { CategoryCombobox } from "./CategoryCombobox";
import { ActiveFiltersBadges, buildActiveFilters } from "./ActiveFiltersBadges";
import type { EquipmentCategory } from "@/types";

interface FilterBarProps {
  selectedCategory: EquipmentCategory | null;
  onCategoryChange: (category: EquipmentCategory | null) => void;
  onClearAllFilters: () => void;
}

/**
 * Filter bar with category selection and active filters display
 */
export function FilterBar({ selectedCategory, onCategoryChange, onClearAllFilters }: FilterBarProps) {
  const activeFilters = buildActiveFilters(selectedCategory);

  const handleRemoveFilter = () => {
    // Currently only category filter exists, so remove it
    onCategoryChange(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <CategoryCombobox value={selectedCategory} onChange={onCategoryChange} />
      </div>

      <ActiveFiltersBadges filters={activeFilters} onRemoveFilter={handleRemoveFilter} onClearAll={onClearAllFilters} />
    </div>
  );
}
