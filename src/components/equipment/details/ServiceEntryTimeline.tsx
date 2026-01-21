/**
 * ServiceEntryTimeline Component
 * Timeline displaying service entries chronologically
 */

import { ServiceEntryItem } from "./ServiceEntryItem";
import { EmptyState } from "@/components/equipment/EmptyState";
import type { ServiceEntryDTO } from "@/types";

interface ServiceEntryTimelineProps {
  entries: ServiceEntryDTO[];
  isOwner: boolean;
  onEditEntry: (entryId: string) => void;
  onDeleteEntry: (entryId: string) => void;
  onAddEntry?: () => void;
}

/**
 * Timeline component for displaying service entries
 */
export function ServiceEntryTimeline({
  entries,
  isOwner,
  onEditEntry,
  onDeleteEntry,
  onAddEntry,
}: ServiceEntryTimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="py-8">
        <EmptyState variant="no-service-entries" onAction={onAddEntry} />
      </div>
    );
  }

  // Sort entries by timestamp (newest first)
  const sortedEntries = [...entries].sort((a, b) => {
    return new Date(b.service_timestamp).getTime() - new Date(a.service_timestamp).getTime();
  });

  return (
    <div className="relative space-y-0">
      {sortedEntries.map((entry) => (
        <ServiceEntryItem
          key={entry.id}
          entry={entry}
          isOwner={isOwner}
          onEdit={onEditEntry}
          onDelete={onDeleteEntry}
        />
      ))}
    </div>
  );
}
