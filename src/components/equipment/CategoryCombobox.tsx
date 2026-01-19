/**
 * CategoryCombobox Component
 * Combobox for selecting equipment category with search functionality
 */

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { EQUIPMENT_CATEGORY_CONFIG, getCategoryOptions } from "@/lib/constants/equipment-categories";
import type { EquipmentCategory } from "@/types";

interface CategoryComboboxProps {
  value: EquipmentCategory | null;
  onChange: (value: EquipmentCategory | null) => void;
}

/**
 * Combobox for selecting equipment category
 */
export function CategoryCombobox({ value, onChange }: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const categories = getCategoryOptions();

  const selectedCategory = value ? EQUIPMENT_CATEGORY_CONFIG[value] : null;
  const SelectedIcon = selectedCategory?.icon;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-[240px] justify-between">
          {selectedCategory ? (
            <span className="flex items-center gap-2">
              {SelectedIcon && <SelectedIcon className="h-4 w-4" />}
              {selectedCategory.label}
            </span>
          ) : (
            <span className="text-muted-foreground">Wybierz kategorię...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0">
        <Command>
          <CommandInput placeholder="Szukaj kategorii..." />
          <CommandList>
            <CommandEmpty>Nie znaleziono kategorii.</CommandEmpty>
            <CommandGroup>
              {value && (
                <CommandItem
                  value="clear"
                  onSelect={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                  className="text-muted-foreground"
                >
                  <Check className={cn("mr-2 h-4 w-4", "opacity-0")} />
                  Wyczyść wybór
                </CommandItem>
              )}
              {categories.map((category) => {
                const config = EQUIPMENT_CATEGORY_CONFIG[category.value];
                const Icon = config.icon;
                const isSelected = value === category.value;

                return (
                  <CommandItem
                    key={category.value}
                    value={category.value}
                    onSelect={() => {
                      onChange(category.value);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                    <Icon className="mr-2 h-4 w-4" />
                    {category.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
