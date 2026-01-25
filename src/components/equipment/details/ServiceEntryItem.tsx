/**
 * ServiceEntryItem Component
 * Single service entry in timeline with expandable description
 */

import { useState } from "react";
import { ServiceTypeBadge } from "./ServiceTypeBadge";
import { DateTimeDisplay } from "./DateTimeDisplay";
import { ActionsDropdown } from "./ActionsDropdown";
import type { ServiceEntryDTO } from "@/types";
import { Button } from "@/components/ui/button";

interface ServiceEntryItemProps {
  entry: ServiceEntryDTO;
  isOwner: boolean;
  onEdit: (entryId: string) => void;
  onDelete: (entryId: string) => void;
}

const DESCRIPTION_TRUNCATE_LENGTH = 200;

/**
 * Single service entry item in timeline
 */
export function ServiceEntryItem({ entry, isOwner, onEdit, onDelete }: ServiceEntryItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const shouldTruncate = entry.description.length > DESCRIPTION_TRUNCATE_LENGTH;
  const displayDescription =
    shouldTruncate && !isExpanded ? entry.description.slice(0, DESCRIPTION_TRUNCATE_LENGTH) + "..." : entry.description;

  return (
    <div className="relative pl-8 pb-8 last:pb-0">
      {/* Timeline dot */}
      <div className="absolute left-0 top-2 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />

      {/* Vertical line */}
      <div className="absolute left-[5px] top-5 bottom-0 w-0.5 bg-border" />

      {/* Content */}
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <DateTimeDisplay timestamp={entry.service_timestamp} className="text-sm text-muted-foreground" />
              <ServiceTypeBadge serviceType={entry.service_type} size="sm" />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <p className="text-sm text-foreground whitespace-pre-wrap break-words">{displayDescription}</p>

              {shouldTruncate && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-auto p-0 text-xs"
                >
                  {isExpanded ? "Pokaż mniej" : "Czytaj więcej"}
                </Button>
              )}
            </div>

            {/* Performer */}
            <p className="text-xs text-muted-foreground">
              Wykonawca: <span className="font-medium">{entry.performer.name}</span>
            </p>
          </div>

          {/* Actions - only visible if conditions met */}
          <div className="flex-shrink-0">
            <ActionsDropdown onEdit={() => onEdit(entry.id)} onDelete={() => onDelete(entry.id)} showDelete={isOwner} />
          </div>
        </div>
      </div>
    </div>
  );
}
