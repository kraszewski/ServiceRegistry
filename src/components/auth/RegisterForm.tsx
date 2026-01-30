/**
 * RegisterForm Component
 * Form for user registration with email, password, and name
 * Integrates with Supabase Auth via /api/auth/register
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { registerFormSchema, type RegisterFormInput } from "@/lib/schemas/register-form.schema";

interface RegisterFormProps {
  /** Callback called when registration is successful */
  onSuccess?: () => void;
  /** Callback called when registration fails */
  onError?: (error: string) => void;
}

/**
 * Registration form component with email/password/name fields
 * First registered user automatically becomes owner
 * After successful registration, user is automatically logged in
 */
export function RegisterForm({ onSuccess, onError }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegisterFormInput>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: RegisterFormInput) => {
    setIsSubmitting(true);

    try {
      // Call register endpoint
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: data.name,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Handle error response
        const errorMessage = responseData.error || "Wystąpił błąd podczas rejestracji";

        form.setError("root", {
          type: "manual",
          message: errorMessage,
        });

        onError?.(errorMessage);
        return;
      }

      // Success - user is now logged in, redirect to equipment page
      onSuccess?.();
      window.location.href = "/equipment";
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Registration error:", error);
      const errorMessage = error instanceof Error ? error.message : "Wystąpił błąd podczas rejestracji";

      form.setError("root", {
        type: "manual",
        message: errorMessage,
      });

      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Rejestracja</CardTitle>
        <CardDescription>Utwórz nowe konto, aby korzystać z systemu</CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        disabled={isSubmitting}
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

            {/* Confirm Password field */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Potwierdź hasło</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Powtórz hasło"
                        autoComplete="new-password"
                        disabled={isSubmitting}
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        tabIndex={-1}
                        aria-label={showConfirmPassword ? "Ukryj hasło" : "Pokaż hasło"}
                        disabled={isSubmitting}
                      >
                        {showConfirmPassword ? (
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

            {/* Root error message */}
            {form.formState.errors.root && (
              <div className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</div>
            )}

            {/* Submit button */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>Rejestrowanie...</>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Zarejestruj się
                </>
              )}
            </Button>

            {/* Link to login */}
            <div className="text-center text-sm text-muted-foreground">
              Masz już konto?{" "}
              <a href="/login" className="text-primary hover:underline font-medium">
                Zaloguj się
              </a>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
