import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, FileText, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = emailSchema.safeParse({ email });
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      setSuccess(true);
    } catch (error: any) {
      setError(error.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Check your email</h2>
            <p className="text-muted-foreground mb-4">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <Link to="/login">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileText className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Forgot password?</CardTitle>
          <CardDescription>Enter your email and we'll send you a reset link</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send reset link"
              )}
            </Button>
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
              <span className="flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" />
                Back to login
              </span>
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
