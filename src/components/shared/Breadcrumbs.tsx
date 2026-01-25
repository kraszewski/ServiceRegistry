/**
 * Shared Components - Breadcrumbs
 * Navigation breadcrumbs showing page hierarchy
 */

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumbs component for hierarchical navigation
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Nawigacja okruszkowa" className={cn("flex items-center gap-2 text-sm", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}

            {item.href && !isLast ? (
              <a href={item.href} className="text-muted-foreground hover:text-foreground transition-colors">
                {item.label}
              </a>
            ) : (
              <span className={cn(isLast ? "text-foreground font-medium" : "text-muted-foreground")}>{item.label}</span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
