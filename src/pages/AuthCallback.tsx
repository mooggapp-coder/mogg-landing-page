import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// App tables are not in the marketing Database types — cast for these queries.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const SESSION_TIMEOUT_MS = 10_000;

function hasCompletedSetup(row: { gender?: unknown; photo_urls?: unknown } | null): boolean {
  if (!row) return false;
  const gender =
    typeof row.gender === "string" ? row.gender.trim().toLowerCase() : "";
  const hasGender = gender === "male" || gender === "female";
  const photos = Array.isArray(row.photo_urls)
    ? row.photo_urls.filter((url): url is string => typeof url === "string" && url.length > 0)
    : [];
  return hasGender && photos.length > 0;
}

const AuthCallback = () => {
  const navigate = useNavigate();
  const [timedOut, setTimedOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let settled = false;
    let cancelled = false;

    const resolveDestination = async (session: Session) => {
      if (settled || cancelled) return;
      settled = true;

      try {
        const { data, error } = await db
          .from("users")
          .select("gender, photo_urls")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (error) throw error;

        if (cancelled) return;

        if (hasCompletedSetup(data)) {
          navigate("/arena", { replace: true });
        } else {
          navigate("/setup", { replace: true });
        }
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(
          error instanceof Error ? error.message : "Could not finish signing you in.",
        );
      }
    };

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        void resolveDestination(data.session);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        void resolveDestination(session);
      }
    });

    const timeoutId = window.setTimeout(() => {
      if (!settled && !cancelled) {
        settled = true;
        setTimedOut(true);
      }
    }, SESSION_TIMEOUT_MS);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.clearTimeout(timeoutId);
    };
  }, [navigate]);

  const showError = timedOut || Boolean(errorMessage);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <p className="text-eyebrow mb-2">MOGG</p>
          </Link>
          <h1 className="text-page-title text-foreground">Signing you in</h1>
        </div>

        <Card className="border-border bg-card shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle>{showError ? "Sign in incomplete" : "Almost there"}</CardTitle>
            <CardDescription className="font-body">
              {showError
                ? "We could not complete sign-in from your provider."
                : "Finishing your sign-in. This only takes a moment."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {showError ? (
              <>
                <p className="text-sm text-foreground font-body leading-relaxed">
                  {errorMessage ??
                    "No session appeared within 10 seconds. Please try signing in again."}
                </p>
                <Button asChild variant="secondary" className="w-full font-body">
                  <Link to="/login">Back to sign in</Link>
                </Button>
              </>
            ) : (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default AuthCallback;
