import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/analytics";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkEmailMessage, setCheckEmailMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setCheckEmailMessage("");

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password || !confirmPassword) {
      toast({
        title: "Missing fields",
        description: "Fill in email, password, and confirm password.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Make sure both password fields are the same.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    track("signup_started");
    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });

      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      track("signup_completed");

      if (!data.session) {
        setCheckEmailMessage(
          "Check your email to confirm your account before signing in.",
        );
        toast({
          title: "Confirm your email",
          description: "We sent a confirmation link to your inbox.",
        });
        return;
      }

      navigate("/setup");
    } catch (error) {
      toast({
        title: "Sign up failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <p className="text-eyebrow mb-2">
              MOGG
            </p>
          </Link>
          <h1 className="text-page-title text-foreground">Join the arena</h1>
        </div>

        <Card className="border-border bg-card shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle>Create account</CardTitle>
            <CardDescription className="font-body">
              Sign up with email and password to get started.
            </CardDescription>
          </CardHeader>

          {checkEmailMessage ? (
            <CardContent className="space-y-4">
              <p className="text-sm text-foreground font-body leading-relaxed">{checkEmailMessage}</p>
              <p className="text-sm text-muted-foreground font-body text-center">
                Already confirmed?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-body">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    disabled={isSubmitting}
                    required
                    className="font-body"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="font-body">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    disabled={isSubmitting}
                    required
                    className="font-body"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="font-body">
                    Confirm password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    disabled={isSubmitting}
                    required
                    className="font-body"
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      Creating account...
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    </>
                  ) : (
                    "Create account"
                  )}
                </Button>

                <p className="text-sm text-muted-foreground font-body text-center">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </main>
  );
};

export default Signup;
