/**
 * DateTimeDisplay Component
 * Displays timestamp in relative or absolute format with tooltip
 */

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DateTimeDisplayProps {
  timestamp: string;
  showRelative?: boolean;
  className?: string;
}

/**
 * Component for displaying timestamps with tooltip showing full date
 */
export function DateTimeDisplay({ timestamp, showRelative = true, className }: DateTimeDisplayProps) {
  const date = new Date(timestamp);
  const now = new Date();

  // Calculate days difference
  const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  // Format relative time
  const getRelativeTime = () => {
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "przed chwilą";
    if (minutes < 60) return `${minutes} ${minutes === 1 ? "minutę" : "minut"} temu`;
    if (hours < 24) return `${hours} ${hours === 1 ? "godzinę" : hours < 5 ? "godziny" : "godzin"} temu`;
    if (days === 1) return "wczoraj";
    if (days < 7) return `${days} ${days < 5 ? "dni" : "dni"} temu`;

    return null; // Fall back to absolute
  };

  // Format absolute time
  const getAbsoluteTime = () => {
    return date.toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format full time for tooltip
  const getFullTime = () => {
    return date.toLocaleString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Determine display format
  const relativeTime = showRelative && daysDiff < 7 ? getRelativeTime() : null;
  const displayTime = relativeTime || getAbsoluteTime();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <time dateTime={timestamp} className={className}>
            {displayTime}
          </time>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getFullTime()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
