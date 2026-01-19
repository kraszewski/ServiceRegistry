/**
 * PageHeader Component
 * Sticky header with title and action button
 */

import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  onAddClick: () => void;
}

/**
 * Page header with title and add button
 */
export function PageHeader({ title, onAddClick }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-background border-b mb-6 -mx-4 px-4 py-4 sm:-mx-6 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>

        <Button onClick={onAddClick} size="default">
          <span className="hidden sm:inline">+ Dodaj sprzęt</span>
          <span className="sm:hidden">+ Dodaj</span>
        </Button>
      </div>
    </header>
  );
}
