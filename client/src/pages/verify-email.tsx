/**
 * Email Verification Page
 * 
 * Verifies the user's email address using a token from the URL.
 */

import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle, Mail } from "lucide-react";
import { apiRequest } from "@/lib/api";

export default function VerifyEmailPage() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  
  const verifyMutation = useMutation({
    mutationFn: async (token: string) => {
      return apiRequest<{ message: string }>("/api/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
    },
    onSuccess: (data) => {
      setStatus("success");
      setMessage(data.message);
    },
    onError: (error: Error) => {
      setStatus("error");
      setMessage(error.message.replace(/^\d+:\s*/, ""));
    },
  });
  
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const token = params.get("token");
    
    if (token) {
      verifyMutation.mutate(token);
    } else {
      setStatus("error");
      setMessage("Invalid or missing verification token.");
    }
  }, [searchString]);
  
  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
            <CardTitle className="text-2xl">Verifying your email...</CardTitle>
            <CardDescription className="text-base">
              Please wait while we verify your email address.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  // Success state
  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Email verified!</CardTitle>
            <CardDescription className="text-base">
              {message}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Your email has been verified successfully. You now have full access to all features.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-600" 
              onClick={() => setLocation("/login")}
            >
              Continue to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Error state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Verification failed</CardTitle>
          <CardDescription className="text-base">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The verification link may have expired or already been used.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button 
            className="w-full" 
            onClick={() => setLocation("/login")}
          >
            Go to Login
          </Button>
          <p className="text-xs text-muted-foreground">
            Need a new verification link? Log in and request one from your profile.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

