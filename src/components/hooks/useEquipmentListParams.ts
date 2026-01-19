/**
 * Custom hook for managing equipment list query parameters from URL
 * Synchronizes filter/sort/pagination state with URL query string
 */

import { useCallback, useMemo, useState, useEffect } from "react";
import type { EquipmentListParams } from "@/types";

/**
 * Default parameters for equipment list
 */
const DEFAULT_PARAMS: Required<EquipmentListParams> = {
  page: 1,
  limit: 50,
  sort: "created_at",
  order: "desc",
  category: undefined as never,
  search: undefined as never,
};

/**
 * Parse and validate URL search params
 */
function parseParams(searchParams: URLSearchParams): EquipmentListParams {
  const params: EquipmentListParams = { ...DEFAULT_PARAMS };

  // Parse page (must be >= 1)
  const page = parseInt(searchParams.get("page") || "1", 10);
  params.page = page >= 1 ? page : DEFAULT_PARAMS.page;

  // Parse limit (1-100 range)
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  params.limit = limit >= 1 && limit <= 100 ? limit : DEFAULT_PARAMS.limit;

  // Parse sort field
  const sort = searchParams.get("sort");
  if (
    sort === "created_at" ||
    sort === "name" ||
    sort === "equipment_id" ||
    sort === "category" ||
    sort === "manufacturer"
  ) {
    params.sort = sort;
  }

  // Parse order
  const order = searchParams.get("order");
  if (order === "asc" || order === "desc") {
    params.order = order;
  }

  // Parse category filter
  const category = searchParams.get("category");
  if (
    category === "computer" ||
    category === "printer" ||
    category === "monitor" ||
    category === "network_device" ||
    category === "phone" ||
    category === "tablet" ||
    category === "peripheral" ||
    category === "other"
  ) {
    params.category = category;
  }

  // Parse search
  const search = searchParams.get("search");
  if (search) {
    params.search = search;
  }

  return params;
}

/**
 * Hook for managing equipment list URL parameters
 * Provides current params and functions to update them
 */
export function useEquipmentListParams() {
  // State to hold current params
  const [params, setParamsState] = useState<EquipmentListParams>(() => {
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
      setParamsState(prevParams => {
        if (JSON.stringify(prevParams) === JSON.stringify(newParams)) {
          return prevParams; // Return same object to prevent re-render
        }
        return newParams;
      });
    };

    // Listen to both custom event and popstate (browser back/forward)
    window.addEventListener("equipmentParamsChanged", handleUrlChange);
    window.addEventListener("popstate", handleUrlChange);

    return () => {
      window.removeEventListener("equipmentParamsChanged", handleUrlChange);
      window.removeEventListener("popstate", handleUrlChange);
    };
  }, []);

  /**
   * Update URL with new parameters
   */
  const setParams = useCallback((newParams: Partial<EquipmentListParams>) => {
    if (typeof window === "undefined") return;

    const currentParams = new URLSearchParams(window.location.search);
    const updated = { ...parseParams(currentParams), ...newParams };

    const searchParams = new URLSearchParams();

    // Always include page and limit
    searchParams.set("page", String(updated.page));
    searchParams.set("limit", String(updated.limit));

    // Include sort and order if different from defaults
    if (updated.sort !== DEFAULT_PARAMS.sort) {
      searchParams.set("sort", updated.sort!);
    }
    if (updated.order !== DEFAULT_PARAMS.order) {
      searchParams.set("order", updated.order!);
    }

    // Include category if set
    if (updated.category) {
      searchParams.set("category", updated.category);
    }

    // Include search if set
    if (updated.search) {
      searchParams.set("search", updated.search);
    }

    // Update URL without reload
    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.pushState({}, "", newUrl);

    // Trigger custom event to notify components
    window.dispatchEvent(new CustomEvent("equipmentParamsChanged"));
  }, []);

  /**
   * Reset all parameters to defaults
   */
  const resetParams = useCallback(() => {
    if (typeof window === "undefined") return;

    const searchParams = new URLSearchParams();
    searchParams.set("page", "1");
    searchParams.set("limit", "50");

    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.pushState({}, "", newUrl);

    window.dispatchEvent(new CustomEvent("equipmentParamsChanged"));
  }, []);

  return {
    params, // Already stable from useState
    setParams,
    resetParams,
  };
}
