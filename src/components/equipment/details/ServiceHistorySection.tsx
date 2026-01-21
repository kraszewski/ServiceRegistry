/**
 * ServiceHistorySection Component
 * Section containing service history timeline with add button
 */

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { ServiceEntryTimeline } from "./ServiceEntryTimeline";
import type { ServiceEntryDTO } from "@/types";

interface ServiceHistorySectionProps {
  equipmentId: string;
  entries: ServiceEntryDTO[];
  isLoading: boolean;
  isOwner: boolean;
  onAddEntry: () => void;
  onEditEntry: (entryId: string) => void;
  onDeleteEntry: (entryId: string) => void;
}

/**
 * Section displaying service history with timeline
 */
export function ServiceHistorySection({
  equipmentId,
  entries,
  isLoading,
  isOwner,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
}: ServiceHistorySectionProps) {
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Historia Serwisowa</h2>

        <Button onClick={onAddEntry} size="default">
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Dodaj wpis</span>
          <span className="sm:hidden">Dodaj</span>
        </Button>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <ServiceEntryTimeline
          entries={entries}
          isOwner={isOwner}
          onEditEntry={onEditEntry}
          onDeleteEntry={onDeleteEntry}
          onAddEntry={onAddEntry}
        />
      )}
    </div>
  );
}
