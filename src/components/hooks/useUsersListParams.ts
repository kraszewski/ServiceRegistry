/**
 * Custom hook for managing users list query parameters from URL
 * Synchronizes pagination state with URL query string
 */

import { useCallback, useState, useEffect } from "react";
import type { PaginationParams } from "@/types";

/**
 * Default parameters for users list
 */
const DEFAULT_PARAMS: Required<PaginationParams> = {
  page: 1,
  limit: 50,
};

/**
 * Parse and validate URL search params
 */
function parseParams(searchParams: URLSearchParams): PaginationParams {
  const params: PaginationParams = { ...DEFAULT_PARAMS };

  // Parse page (must be >= 1)
  const page = parseInt(searchParams.get("page") || "1", 10);
  params.page = page >= 1 ? page : DEFAULT_PARAMS.page;

  // Parse limit (1-100 range)
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  params.limit = limit >= 1 && limit <= 100 ? limit : DEFAULT_PARAMS.limit;

  return params;
}

/**
 * Hook for managing users list URL parameters
 * Provides current params and functions to update them
 */
export function useUsersListParams() {
  // State to hold current params
  const [params, setParamsState] = useState<PaginationParams>(() => {
    if (typeof window === "undefined") return DEFAULT_PARAMS;
    const searchParams = new URLSearchParams(window.location.search);
    return parseParams(searchParams);
  });

  // Listen to URL changes and update params
  useEffect(() => {
    const handleUrlChange = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const newParams = parseParams(searchParams);

      // Only update if params actually changed (deep comparison via JSON)
      setParamsState((prevParams) => {
        if (JSON.stringify(prevParams) === JSON.stringify(newParams)) {
          return prevParams; // Return same object to prevent re-render
        }
        return newParams;
      });
    };

    // Listen to both custom event and popstate (browser back/forward)
    window.addEventListener("usersParamsChanged", handleUrlChange);
    window.addEventListener("popstate", handleUrlChange);

    return () => {
      window.removeEventListener("usersParamsChanged", handleUrlChange);
      window.removeEventListener("popstate", handleUrlChange);
    };
  }, []);

  /**
   * Update URL with new parameters
   */
  const setParams = useCallback((newParams: Partial<PaginationParams>) => {
    if (typeof window === "undefined") return;

    const currentParams = new URLSearchParams(window.location.search);
    const updated = { ...parseParams(currentParams), ...newParams };

    const searchParams = new URLSearchParams();

    // Only include non-default values
    if (updated.page > 1) {
      searchParams.set("page", String(updated.page));
    }
    if (updated.limit !== DEFAULT_PARAMS.limit) {
      searchParams.set("limit", String(updated.limit));
    }

    // Update URL without reload
    const queryString = searchParams.toString();
    const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
    window.history.pushState({}, "", newUrl);

    // Trigger custom event to notify components
    window.dispatchEvent(new CustomEvent("usersParamsChanged"));
  }, []);

  /**
   * Reset all parameters to defaults
   */
  const resetParams = useCallback(() => {
    if (typeof window === "undefined") return;

    const newUrl = window.location.pathname;
    window.history.pushState({}, "", newUrl);

    window.dispatchEvent(new CustomEvent("usersParamsChanged"));
  }, []);

  return {
    params, // Already stable from useState
    setParams,
    resetParams,
  };
}
