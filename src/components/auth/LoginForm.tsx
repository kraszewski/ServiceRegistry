/**
 * LoginForm Component
 * Form for user authentication with email and password
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { loginFormSchema, type LoginFormInput } from "@/lib/schemas/login-form.schema";

interface LoginFormProps {
  /** Callback called when login is successful */
  onSuccess?: () => void;
  /** Callback called when login fails */
  onError?: (error: string) => void;
}

/**
 * Login form component with email/password authentication
 * Note: This is UI-only component, backend implementation pending
 */
export function LoginForm({ onSuccess, onError }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginFormInput>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: LoginFormInput) => {
    setIsSubmitting(true);

    try {
      // TODO: Backend implementation - POST /api/auth/login
      console.log("Login attempt:", { email: data.email });
      
      // Placeholder - simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TODO: Handle actual authentication
      onSuccess?.();
      
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error instanceof Error ? error.message : "Wystąpił błąd podczas logowania";
      
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
        <CardTitle className="text-2xl">Logowanie</CardTitle>
        <CardDescription>
          Wprowadź swoje dane, aby zalogować się do systemu
        </CardDescription>
      </CardHeader>

      <CardContent>
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
                        placeholder="Wprowadź hasło"
                        autoComplete="current-password"
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

            {/* Root error message */}
            {form.formState.errors.root && (
              <div className="text-sm font-medium text-destructive">
                {form.formState.errors.root.message}
              </div>
            )}

            {/* Submit button */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>Logowanie...</>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Zaloguj się
                </>
              )}
            </Button>

            {/* Link to registration */}
            <div className="text-center text-sm text-muted-foreground">
              Nie masz konta?{" "}
              <a href="/register" className="text-primary hover:underline font-medium">
                Zarejestruj się
              </a>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
