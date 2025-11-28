/**
 * Reset Password Page
 * 
 * Allows users to set a new password using a reset token from email.
 */

import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Eye, EyeOff, Loader2, Lock, AlertCircle, CheckCircle, Check, X } from "lucide-react";
import { apiRequest } from "@/lib/api";

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function PasswordStrengthIndicator({ password }: { password: string }) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };
  
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const strength = (passedChecks / 3) * 100;
  
  return (
    <div className="space-y-2 mt-2">
      <Progress value={strength} className="h-2" />
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className={`flex items-center gap-1 ${checks.length ? "text-green-600" : "text-muted-foreground"}`}>
          {checks.length ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          8+ characters
        </div>
        <div className={`flex items-center gap-1 ${checks.uppercase ? "text-green-600" : "text-muted-foreground"}`}>
          {checks.uppercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          Uppercase
        </div>
        <div className={`flex items-center gap-1 ${checks.number ? "text-green-600" : "text-muted-foreground"}`}>
          {checks.number ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          Number
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  
  // Get token from URL
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError("Invalid or missing reset token. Please request a new password reset link.");
    }
  }, [searchString]);
  
  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });
  
  const password = form.watch("password");
  
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordFormData) => {
      return apiRequest<{ message: string }>("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });
    },
    onSuccess: () => {
      setSuccess(true);
    },
    onError: (error: Error) => {
      setError(error.message.replace(/^\d+:\s*/, ""));
    },
  });
  
  const onSubmit = (data: ResetPasswordFormData) => {
    if (!token) {
      setError("Invalid reset token");
      return;
    }
    setError(null);
    resetPasswordMutation.mutate(data);
  };
  
  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Password reset successful!</CardTitle>
            <CardDescription className="text-base">
              Your password has been changed successfully.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              You can now sign in with your new password.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => setLocation("/login")}>
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Invalid token state
  if (!token && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
            <CardDescription className="text-base">
              {error}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-2">
            <Button className="w-full" onClick={() => setLocation("/forgot-password")}>
              Request New Reset Link
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setLocation("/login")}>
              Back to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-100 rounded-full blur-3xl opacity-50" />
      </div>
      
      <Card className="w-full max-w-md relative backdrop-blur-sm bg-white/80 shadow-xl border-0">
        <CardHeader className="space-y-1 text-center pb-2">
          <Link href="/">
            <div className="inline-flex items-center justify-center gap-2 text-primary font-bold text-2xl tracking-tight cursor-pointer mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <span className="text-xl">S</span>
              </div>
              <span>ServeMkt</span>
            </div>
          </Link>
          <CardTitle className="text-2xl font-bold">Set new password</CardTitle>
          <CardDescription>
            Create a new password for your account.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="animate-in fade-in-50 slide-in-from-top-1">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Reset Password Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  className="pl-10 pr-10"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && <PasswordStrengthIndicator password={password} />}
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  className="pl-10 pr-10"
                  {...form.register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-lg"
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting password...
                </>
              ) : (
                "Reset password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

