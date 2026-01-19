/**
 * EquipmentFormDialog Component
 * Modal dialog for creating and editing equipment
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SimpleDialog, SimpleDialogHeader, SimpleDialogTitle, SimpleDialogDescription, SimpleDialogContent } from "./SimpleDialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { equipmentFormSchema, type EquipmentFormData } from "@/lib/schemas/equipment-form.schema";
import { getCategoryOptions } from "@/lib/constants/equipment-categories";
import { useCreateEquipment } from "@/components/hooks/useCreateEquipment";
import { useUpdateEquipment } from "@/components/hooks/useUpdateEquipment";
import type { EquipmentListItemDTO, EquipmentResponseDTO } from "@/types";
import { toast } from "sonner";

interface EquipmentFormDialogProps {
  mode: "create" | "edit";
  equipment?: EquipmentListItemDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (equipment: EquipmentResponseDTO) => void;
}

const STORAGE_KEY = "equipment-form-draft";

/**
 * Equipment form dialog for create and edit operations
 */
export function EquipmentFormDialog({ mode, equipment, open, onOpenChange, onSuccess }: EquipmentFormDialogProps) {
  console.log('EquipmentFormDialog called with:', { mode, open, equipment: !!equipment });
  
  const categories = getCategoryOptions();
  const createMutation = useCreateEquipment();
  const updateMutation = useUpdateEquipment();

  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: {
      name: "",
      category: undefined,
      manufacturer: "",
      model: "",
      serial_number: "",
      description: "",
      location: "",
      purchase_date: "",
    },
  });

  // Load draft from localStorage (only in create mode)
  useEffect(() => {
    if (mode === "create" && open) {
      const draft = localStorage.getItem(STORAGE_KEY);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          form.reset(parsed);
        } catch (e) {
          console.error("Failed to parse draft:", e);
        }
      }
    }
  }, [mode, open, form]);

  // Load equipment data (in edit mode)
  useEffect(() => {
    if (mode === "edit" && equipment && open) {
      form.reset({
        name: equipment.name,
        category: equipment.category,
        manufacturer: equipment.manufacturer,
        model: equipment.model,
        serial_number: equipment.serial_number,
        description: equipment.description || "",
        location: equipment.location || "",
        purchase_date: equipment.purchase_date || "",
      });
    }
  }, [mode, equipment, open, form]);

  // Auto-save draft (only in create mode)
  useEffect(() => {
    if (mode !== "create" || !open) return;

    const subscription = form.watch((data) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    });

    return () => subscription.unsubscribe();
  }, [mode, open, form]);

  // Handle form submission
  const onSubmit = async (data: EquipmentFormData) => {
    try {
      if (mode === "create") {
        const result = await createMutation.mutateAsync({
          name: data.name,
          category: data.category,
          manufacturer: data.manufacturer,
          model: data.model,
          serial_number: data.serial_number,
          description: data.description || null,
          location: data.location || null,
          purchase_date: data.purchase_date || null,
        });

        localStorage.removeItem(STORAGE_KEY);
        toast.success("Sprzęt dodany pomyślnie");
        onSuccess(result);
        onOpenChange(false);
        form.reset();
      } else if (mode === "edit" && equipment) {
        const result = await updateMutation.mutateAsync({
          id: equipment.id,
          data: {
            name: data.name,
            category: data.category,
            manufacturer: data.manufacturer,
            model: data.model,
            serial_number: data.serial_number,
            description: data.description || null,
            location: data.location || null,
            purchase_date: data.purchase_date || null,
          },
        });

        toast.success("Sprzęt zaktualizowany pomyślnie");
        onSuccess(result);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Form submission error:", error);

      const apiError = error as { status?: number };

      if (apiError.status === 409) {
        form.setError("serial_number", {
          message: "Sprzęt o tym numerze seryjnym już istnieje",
        });
        toast.error("Sprzęt o tym numerze seryjnym już istnieje");
      } else if (apiError.status === 404) {
        toast.error("Sprzęt nie został znaleziony");
        onOpenChange(false);
      } else if (apiError.status === 400) {
        toast.error("Nieprawidłowe dane formularza");
      } else {
        toast.error("Wystąpił błąd serwera. Spróbuj ponownie.");
      }
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <SimpleDialog open={open} onOpenChange={onOpenChange}>
      <SimpleDialogHeader>
        <SimpleDialogTitle>{mode === "create" ? "Dodaj sprzęt" : "Edytuj sprzęt"}</SimpleDialogTitle>
        <SimpleDialogDescription>
          {mode === "create"
            ? "Wypełnij formularz, aby dodać nowy sprzęt do systemu."
            : "Zaktualizuj informacje o sprzęcie."}
        </SimpleDialogDescription>
      </SimpleDialogHeader>

      <SimpleDialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nazwa *</FormLabel>
                  <FormControl>
                    <Input placeholder="np. Laptop Dell Latitude" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategoria *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz kategorię" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Manufacturer */}
            <FormField
              control={form.control}
              name="manufacturer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Producent *</FormLabel>
                  <FormControl>
                    <Input placeholder="np. Dell" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Model */}
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model *</FormLabel>
                  <FormControl>
                    <Input placeholder="np. Latitude 5520" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Serial Number */}
            <FormField
              control={form.control}
              name="serial_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numer seryjny *</FormLabel>
                  <FormControl>
                    <Input placeholder="np. ABC123XYZ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lokalizacja</FormLabel>
                  <FormControl>
                    <Input placeholder="np. Biuro, piętro 2" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Purchase Date */}
            <FormField
              control={form.control}
              name="purchase_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data zakupu</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? (
                            format(new Date(field.value), "PPP", { locale: pl })
                          ) : (
                            <span>Wybierz datę</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => {
                          field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                        }}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
                  <FormLabel>Opis</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Dodatkowe informacje o sprzęcie..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Anuluj
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Zapisywanie..." : "Zapisz"}
              </Button>
            </div>
          </form>
        </Form>
      </SimpleDialogContent>
    </SimpleDialog>
  );
}
