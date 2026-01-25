/**
 * Custom hook for getting current user information and role
 * Uses Supabase session from client
 */

import { useEffect, useState } from "react";
import type { UserRole } from "@/types";

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: UserRole;
}

export interface UseUserResult {
  user: User | null;
  role: UserRole | null;
  isOwner: boolean;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for accessing current user and role information
 * Fetches user profile from API based on session
 * Returns null user when not authenticated (401)
 */
export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchUserProfile = async () => {
      try {
        const response = await fetch("/api/auth/session");

        if (!response.ok) {
          if (response.status === 401) {
            if (mounted) {
              setUser(null);
              setRole(null);
              setIsLoading(false);
            }
            return;
          }
          throw new Error("Failed to fetch user session");
        }

        const data = await response.json();

        if (mounted) {
          setUser(data.user);
          setRole(data.user?.role || null);
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
          setIsLoading(false);
        }
      }
    };

    fetchUserProfile();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    user,
    role,
    isOwner: role === "owner",
    isLoading,
    error,
  };
}
