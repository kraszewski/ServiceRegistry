/**
 * Navigation Component
 * Top navigation bar with links to main views
 * Only shows Users link to owner role
 * Shows user info and logout button when authenticated
 */

import { Package, Users, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/components/hooks/useUser";
import { useState, useCallback } from "react";
import { toast } from "sonner";

interface NavigationProps {
  currentPage?: "equipment" | "users";
  isAuthenticated?: boolean;
  userEmail?: string;
}

/**
 * Navigation bar component
 */
export function Navigation({ currentPage, isAuthenticated: initialAuth, userEmail }: NavigationProps) {
  const { user, isOwner, isLoading } = useUser();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isAuthenticated = initialAuth || Boolean(user);

  const handleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);

      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      toast.success("Wylogowano pomyślnie");

      // Redirect to login page after successful logout
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Nie udało się wylogować");
    } finally {
      setIsLoggingOut(false);
    }
  }, []);

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 py-3 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button variant={currentPage === "equipment" ? "default" : "ghost"} size="sm" asChild>
              <a href="/equipment" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Sprzęt</span>
              </a>
            </Button>

            {isOwner && (
              <Button variant={currentPage === "users" ? "default" : "ghost"} size="sm" asChild>
                <a href="/users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Użytkownicy</span>
                </a>
              </Button>
            )}
          </div>

          {isAuthenticated && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{user?.email || userEmail}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut || isLoading}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{isLoggingOut ? "Wylogowywanie..." : "Wyloguj"}</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
