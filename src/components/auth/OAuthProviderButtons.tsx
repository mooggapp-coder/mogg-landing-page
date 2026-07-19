import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OAuthProvider = "google" | "apple";

type OAuthProviderButtonsProps = {
  disabled?: boolean;
  className?: string;
};

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 12.76c-.02-2.15 1.76-3.18 1.84-3.23-1-1.47-2.57-1.67-3.12-1.69-1.33-.14-2.6.79-3.27.79-.68 0-1.72-.77-2.83-.75-1.46.02-2.8.85-3.55 2.16-1.52 2.63-.39 6.53 1.09 8.67.72 1.05 1.58 2.22 2.71 2.18 1.09-.04 1.5-.7 2.81-.7 1.31 0 1.68.7 2.83.68 1.17-.02 1.91-1.06 2.62-2.12.83-1.2 1.17-2.37 1.19-2.43-.03-.01-2.28-.87-2.32-3.46zM14.7 6.37c.6-.73 1-1.74.89-2.75-.86.03-1.9.57-2.52 1.3-.55.64-1.04 1.67-.91 2.65 1.02.08 2-.52 2.54-1.2z" />
    </svg>
  );
}

/** Google + Apple OAuth buttons for Login / Signup. */
export function OAuthProviderButtons({ disabled, className }: OAuthProviderButtonsProps) {
  const { toast } = useToast();
  const [activeProvider, setActiveProvider] = useState<OAuthProvider | null>(null);

  const handleOAuth = async (provider: OAuthProvider) => {
    if (disabled || activeProvider) return;

    setActiveProvider(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
        setActiveProvider(null);
      }
      // On success Supabase redirects away — keep the spinner visible.
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setActiveProvider(null);
    }
  };

  const busy = Boolean(disabled || activeProvider);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <Button
        type="button"
        variant="secondary"
        disabled={busy}
        onClick={() => void handleOAuth("google")}
        className="h-btn-primary min-h-btn-primary w-full justify-center font-body"
      >
        {activeProvider === "google" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon className="mr-2 h-4 w-4 shrink-0" />
        )}
        Continue with Google
      </Button>

      <Button
        type="button"
        variant="secondary"
        disabled={busy}
        onClick={() => void handleOAuth("apple")}
        className="h-btn-primary min-h-btn-primary w-full justify-center font-body"
      >
        {activeProvider === "apple" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <AppleIcon className="mr-2 h-4 w-4 shrink-0" />
        )}
        Continue with Apple
      </Button>
    </div>
  );
}
