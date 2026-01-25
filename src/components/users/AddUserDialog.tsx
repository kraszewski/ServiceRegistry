/**
 * AddUserDialog Component
 * Modal dialog for adding new worker users
 */

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { createUserFormSchema, type CreateUserFormInput } from "@/lib/schemas/user-form.schema";
import { useCreateUser } from "@/components/hooks/useCreateUser";
import { toast } from "sonner";
import type { ErrorResponse } from "@/types";

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/**
 * Dialog for adding new worker user
 */
export function AddUserDialog({ open, onOpenChange, onSuccess }: AddUserDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const createMutation = useCreateUser();

  const form = useForm<CreateUserFormInput>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        email: "",
        password: "",
        name: "",
      });
      setShowPassword(false);
    }
  }, [open, form]);

  // Handle form submission
  const onSubmit = async (data: CreateUserFormInput) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success("Pracownik dodany pomyślnie");
      onOpenChange(false);
      onSuccess();
    } catch (error: unknown) {
      console.error("Failed to create user:", error);

      // Handle API errors
      if (error && typeof error === "object" && "status" in error) {
        const apiError = error as { status: number; data: ErrorResponse };

        if (apiError.status === 409) {
          // Duplicate email
          form.setError("email", {
            type: "manual",
            message: "Użytkownik o tym adresie email już istnieje",
          });
        } else if (apiError.status === 400 && apiError.data.details) {
          // Validation errors from server
          const details = apiError.data.details as Record<string, string[]>;
          Object.entries(details).forEach(([field, messages]) => {
            form.setError(field as keyof CreateUserFormInput, {
              type: "manual",
              message: messages[0],
            });
          });
        } else {
          toast.error("Wystąpił błąd serwera. Spróbuj ponownie.");
        }
      } else {
        toast.error("Wystąpił nieoczekiwany błąd. Spróbuj ponownie.");
      }
    }
  };

  const isSubmitting = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Dodaj Pracownika</DialogTitle>
          <DialogDescription>Utwórz nowe konto pracownika. Wszystkie pola są wymagane.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Email field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      autoComplete="email"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hasło</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimum 8 znaków"
                        autoComplete="new-password"
                        disabled={isSubmitting}
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                        aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Name field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imię i nazwisko</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Jan Kowalski"
                      autoComplete="name"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Anuluj
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Dodawanie..." : "Dodaj"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
