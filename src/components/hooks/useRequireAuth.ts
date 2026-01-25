/**
 * Custom hook for protected routes
 * Redirects to /login if user is not authenticated
 */

import { useEffect } from "react";
import { useUser } from "./useUser";

/**
 * Hook that ensures user is authenticated
 * Redirects to /login if not authenticated
 * Shows loading state while checking authentication
 */
export function useRequireAuth() {
  const { user, isLoading } = useUser();

  useEffect(() => {
    // Only redirect when loading is complete and user is null
    if (!isLoading && !user) {
      window.location.href = "/login";
    }
  }, [user, isLoading]);

  return { user, isLoading };
}
