import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Bug, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const DESCRIPTION_MAX = 500;

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  return String(error);
}

/**
 * Global floating bug report control — available on every route.
 * z-40 keeps it above page content but under dialogs/modals (z-50).
 */
export function ReportBugButton() {
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const trimmed = description.trim();
  const canSubmit = trimmed.length > 0 && !submitting;

  const resetForm = () => {
    setDescription("");
    setSubmitting(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (submitting) return;
    setOpen(next);
    if (!next) resetForm();
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const page = location.pathname || "/";
      const { error } = await db.from("bug_reports").insert({
        reporter_id: user?.id ?? null,
        page,
        description: trimmed.slice(0, DESCRIPTION_MAX),
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      });

      if (error) throw error;

      track("bug_reported", { page });
      setOpen(false);
      resetForm();
      toast({
        title: "Thanks — we'll look into it.",
      });
    } catch (error) {
      toast({
        title: "Could not send report",
        description: getErrorMessage(error),
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Report a bug"
        className={cn(
          "fixed bottom-4 right-4 z-40 h-10 gap-2 rounded-full border border-border bg-secondary/90 px-3 text-muted-foreground shadow-md backdrop-blur-sm",
          "hover:bg-secondary hover:text-foreground",
          "sm:bottom-6 sm:right-6 sm:px-4",
          "pb-[max(0.5rem,env(safe-area-inset-bottom))]",
        )}
      >
        <Bug className="h-4 w-4 shrink-0" aria-hidden />
        <span className="hidden sm:inline font-body text-sm">Report a bug</span>
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display tracking-tight">Report a bug</DialogTitle>
            <DialogDescription className="font-body">
              Tell us what broke so we can fix it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="bug-description" className="text-sm font-medium font-body text-foreground">
                Description
              </label>
              <span className="text-meta tabular-nums">
                {description.length}/{DESCRIPTION_MAX}
              </span>
            </div>
            <Textarea
              id="bug-description"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, DESCRIPTION_MAX))}
              disabled={submitting}
              required
              maxLength={DESCRIPTION_MAX}
              placeholder="What went wrong? Include what you were doing when it happened."
              className="min-h-[120px] resize-none font-body"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => handleOpenChange(false)}
              className="font-body"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!canSubmit}
              onClick={() => void handleSubmit()}
              className="font-body"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                "Send Report"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
