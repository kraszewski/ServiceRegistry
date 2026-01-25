/**
 * ServiceEntryFormDrawer Component
 * Drawer for creating and editing service entries
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SERVICE_TYPE_CONFIG } from "@/lib/constants/service-types";
import type { CreateServiceEntryCommand, ServiceEntryDTO, UserReference, ServiceType } from "@/types";

// Form schema for service entry
const serviceEntryFormSchema = z.object({
  service_timestamp: z.string().optional(),
  service_type: z.enum(["inspection", "repair", "maintenance"], {
    required_error: "Wybierz typ operacji",
  }),
  description: z
    .string()
    .min(5, "Opis musi zawierać co najmniej 5 znaków")
    .max(2000, "Opis może zawierać maksymalnie 2000 znaków"),
});

type ServiceEntryFormValues = z.infer<typeof serviceEntryFormSchema>;

interface ServiceEntryFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentId: string;
  mode: "create" | "edit";
  entry?: ServiceEntryDTO;
  currentUser: UserReference;
  onSubmit: (data: CreateServiceEntryCommand) => void | Promise<void>;
  isSubmitting?: boolean;
}

/**
 * Drawer component for service entry form
 */
export function ServiceEntryFormDrawer({
  open,
  onOpenChange,
  equipmentId,
  mode,
  entry,
  currentUser,
  onSubmit,
  isSubmitting = false,
}: ServiceEntryFormDrawerProps) {
  const form = useForm<ServiceEntryFormValues>({
    resolver: zodResolver(serviceEntryFormSchema),
    defaultValues: {
      service_timestamp: "",
      service_type: "inspection",
      description: "",
    },
  });

  // Reset form when entry changes or mode changes
  useEffect(() => {
    if (mode === "edit" && entry) {
      // Convert ISO 8601 to datetime-local format (YYYY-MM-DDTHH:MM)
      const timestamp = new Date(entry.service_timestamp).toISOString().slice(0, 16);
      form.reset({
        service_timestamp: timestamp,
        service_type: entry.service_type,
        description: entry.description,
      });
    } else {
      // For create mode, set current datetime in datetime-local format
      const now = new Date().toISOString().slice(0, 16);
      form.reset({
        service_timestamp: now,
        service_type: "inspection",
        description: "",
      });
    }
  }, [mode, entry, form]);

  const handleSubmit = async (data: ServiceEntryFormValues) => {
    // Convert datetime-local format to ISO 8601 if timestamp is provided
    const command: CreateServiceEntryCommand = {
      ...data,
      service_timestamp: data.service_timestamp 
        ? new Date(data.service_timestamp).toISOString()
        : undefined,
    };
    await onSubmit(command);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "Dodaj wpis serwisowy" : "Edytuj wpis serwisowy"}</SheetTitle>
          <SheetDescription>
            {mode === "create"
              ? "Wprowadź informacje o wykonanej operacji serwisowej."
              : "Zaktualizuj informacje o wpisie serwisowym."}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 p-4">
            {/* Service Timestamp */}
            <FormField
              control={form.control}
              name="service_timestamp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data i godzina serwisu</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Service Type */}
            <FormField
              control={form.control}
              name="service_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Typ operacji *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz typ operacji" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.keys(SERVICE_TYPE_CONFIG) as ServiceType[]).map((type) => {
                        const config = SERVICE_TYPE_CONFIG[type];
                        const Icon = config.icon;
                        return (
                          <SelectItem key={type} value={type}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span>{config.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opis *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Opisz wykonane czynności..."
                      className="min-h-[120px] resize-none"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    {field.value?.length || 0} / 2000 znaków
                  </p>
                </FormItem>
              )}
            />

            {/* Performer (read-only) */}
            <FormItem>
              <FormLabel>Wykonawca</FormLabel>
              <FormControl>
                <Input
                  value={mode === "edit" && entry ? entry.performer.name : currentUser.name}
                  disabled
                  className="bg-muted"
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Pole automatycznie wypełniane na podstawie zalogowanego użytkownika
              </p>
            </FormItem>

            <SheetFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Anuluj
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Zapisywanie..." : "Zapisz"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
