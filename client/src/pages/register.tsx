/**
 * Registration Page
 * 
 * Provides email/password registration and social login options.
 * Includes password strength validation and email verification flow.
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
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Eye, EyeOff, Loader2, Mail, Lock, User, AlertCircle, CheckCircle, Check, X } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { SocialLoginButtons } from "@/components/social-login-buttons";

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

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

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
    },
  });
  
  const password = form.watch("password");
  
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const { confirmPassword, ...registerData } = data;
      return apiRequest<{ message: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(registerData),
      });
    },
    onSuccess: () => {
      setSuccess(true);
    },
    onError: (error: Error) => {
      setError(error.message.replace(/^\d+:\s*/, ""));
    },
  });
  
  const onSubmit = (data: RegisterFormData) => {
    setError(null);
    registerMutation.mutate(data);
  };
  
  // Success state - show verification message
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription className="text-base">
              We've sent a verification link to <strong>{form.getValues("email")}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Click the link in the email to verify your account and start using ServeMkt.
            </p>
            <Alert>
              <AlertDescription>
                Didn't receive the email? Check your spam folder or{" "}
                <button
                  onClick={() => {
                    apiRequest("/api/auth/resend-verification", {
                      method: "POST",
                      body: JSON.stringify({ email: form.getValues("email") }),
                    });
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  resend it
                </button>
                .
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => setLocation("/login")}>
              Back to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4 py-8">
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
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>Get started with ServeMkt today</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Social Login Buttons */}
          <SocialLoginButtons />
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">Or register with email</span>
            </div>
          </div>
          
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="animate-in fade-in-50 slide-in-from-top-1">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Registration Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="firstName"
                    placeholder="John"
                    className="pl-10"
                    {...form.register("firstName")}
                  />
                </div>
                {form.formState.errors.firstName && (
                  <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  {...form.register("lastName")}
                />
                {form.formState.errors.lastName && (
                  <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
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
              <Label htmlFor="confirmPassword">Confirm password</Label>
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
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              By creating an account, you agree to our{" "}
              <Link href="/terms">
                <span className="text-primary hover:underline cursor-pointer">Terms of Service</span>
              </Link>{" "}
              and{" "}
              <Link href="/privacy">
                <span className="text-primary hover:underline cursor-pointer">Privacy Policy</span>
              </Link>
              .
            </p>
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4 pt-0">
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login">
              <span className="text-primary font-medium hover:underline cursor-pointer">
                Sign in
              </span>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

