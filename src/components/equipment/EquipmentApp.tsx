/**
 * Equipment App Wrapper
 * Wraps EquipmentListPage with necessary providers
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EquipmentListPage } from "./EquipmentListPage";
import { Toaster } from "@/components/ui/sonner";

// Create QueryClient outside component to avoid recreating on each render
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 3,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

export default function EquipmentApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <EquipmentListPage />
      <Toaster />
    </QueryClientProvider>
  );
}
