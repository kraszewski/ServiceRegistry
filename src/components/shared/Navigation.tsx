/**
 * Navigation Component
 * Top navigation bar with links to main views
 * Shows DEMO MODE indicator when enabled
 */

import { Package, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEMO_MODE } from "@/config";

interface NavigationProps {
  currentPage?: "equipment" | "users";
}

/**
 * Navigation bar component
 */
export function Navigation({ currentPage }: NavigationProps) {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 py-3 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant={currentPage === "equipment" ? "default" : "ghost"}
              size="sm"
              asChild
            >
              <a href="/equipment" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Sprzęt</span>
              </a>
            </Button>

            <Button
              variant={currentPage === "users" ? "default" : "ghost"}
              size="sm"
              asChild
            >
              <a href="/users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Użytkownicy</span>
              </a>
            </Button>
          </div>

          {DEMO_MODE && (
            <div className="flex items-center gap-2">
              <div className="text-xs sm:text-sm text-muted-foreground bg-amber-500/10 border border-amber-500/20 rounded-md px-2 py-1">
                <span className="hidden sm:inline">🎭 DEMO MODE</span>
                <span className="sm:hidden">🎭 DEMO</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
