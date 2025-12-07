/**
 * Login Page
 * 
 * Provides email/password login and social login options.
 * Includes links to registration and password reset.
 */

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Loader2, Mail, Lock, AlertCircle, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { SocialLoginButtons } from "@/components/social-login-buttons";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

// OAuth error messages
const oauthErrorMessages: Record<string, string> = {
  google_not_configured: "Google login is not configured. Please use email/password.",
  twitter_not_configured: "Twitter login is not configured. Please use email/password.",
  facebook_not_configured: "Facebook login is not configured. Please use email/password.",
  invalid_state: "Authentication failed. Please try again.",
  missing_code: "Authentication failed. Please try again.",
  no_email: "Could not retrieve email from provider. Please use email/password.",
  auth_failed: "Authentication failed. Please try again.",
  session_error: "Session error. Please try again.",
  google_auth_failed: "Google authentication failed. Please try again.",
  twitter_auth_failed: "Twitter authentication failed. Please try again.",
  facebook_auth_failed: "Facebook authentication failed. Please try again.",
  token_error: "Token exchange failed. Please try again.",
  user_fetch_failed: "Could not retrieve user info. Please try again.",
};

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  // Check for OAuth errors in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("error");
    if (oauthError) {
      setError(oauthErrorMessages[oauthError] || "Authentication failed. Please try again.");
      // Clean up URL
      window.history.replaceState({}, "", "/login");
    }
  }, []);
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      return apiRequest<{ message: string; user: any }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      // Invalidate the user query to refetch auth state
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      // Redirect to home or the page they were trying to access
      const redirectTo = new URLSearchParams(window.location.search).get("redirect") || "/";
      setLocation(redirectTo);
    },
    onError: (error: Error) => {
      setError(error.message.replace(/^\d+:\s*/, ""));
    },
  });
  
  const onSubmit = (data: LoginFormData) => {
    setError(null);
    loginMutation.mutate(data);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/5 to-transparent rounded-full blur-3xl" />
      </div>
      
      <Card className="w-full max-w-md relative backdrop-blur-sm bg-white/90 shadow-2xl border-0 animate-fade-in">
        <CardHeader className="space-y-1 text-center pb-2">
          <Link href="/">
            <div className="inline-flex items-center justify-center gap-2.5 cursor-pointer mb-6 group">
              <div className="w-11 h-11 bg-gradient-to-br from-[#1a56db] to-[#2ba89c] rounded-xl flex items-center justify-center text-white shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all">
                <svg width="26" height="26" viewBox="0 0 32 32" fill="none" className="text-white">
                  <path d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12c4.125 0 7.763-2.085 9.924-5.256" 
                        stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none"/>
                  <circle cx="23" cy="9" r="2.5" fill="currentColor"/>
                  <circle cx="26.5" cy="16" r="2.5" fill="currentColor"/>
                  <circle cx="23" cy="23" r="2.5" fill="currentColor"/>
                </svg>
              </div>
              <div className="flex flex-col leading-tight text-left">
                <span className="text-xl font-bold text-foreground">Commerzio</span>
                <span className="text-xs font-medium text-primary -mt-0.5">Services</span>
              </div>
            </div>
          </Link>
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Social Login Buttons */}
          <SocialLoginButtons />
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>
          
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="animate-in fade-in-50 slide-in-from-top-1">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Login Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password">
                  <span className="text-sm text-primary hover:underline cursor-pointer">
                    Forgot password?
                  </span>
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
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
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-lg"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4 pt-0">
          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register">
              <span className="text-primary font-medium hover:underline cursor-pointer">
                Create one
              </span>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

