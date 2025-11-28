/**
 * Forgot Password Page
 * 
 * Allows users to request a password reset link via email.
 */

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, AlertCircle, ArrowLeft, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/api";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });
  
  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordFormData) => {
      return apiRequest<{ message: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      setSuccess(true);
    },
    onError: (error: Error) => {
      setError(error.message.replace(/^\d+:\s*/, ""));
    },
  });
  
  const onSubmit = (data: ForgotPasswordFormData) => {
    setError(null);
    forgotPasswordMutation.mutate(data);
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
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription className="text-base">
              If an account exists with that email, we've sent password reset instructions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The link will expire in 1 hour for security reasons.
            </p>
            <Alert>
              <AlertDescription>
                Didn't receive the email? Check your spam folder or try again with a different email address.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button variant="outline" className="w-full" onClick={() => setSuccess(false)}>
              Try another email
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setLocation("/login")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
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
          <CardTitle className="text-2xl font-bold">Forgot password?</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password.
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
          
          {/* Forgot Password Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  {...form.register("email")}
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-lg"
              disabled={forgotPasswordMutation.isPending}
            >
              {forgotPasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send reset link"
              )}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4 pt-0">
          <Button variant="ghost" className="w-full" onClick={() => setLocation("/login")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

