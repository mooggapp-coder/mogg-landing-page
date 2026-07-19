import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Flag, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { track } from "@/lib/analytics";
import {
  formatTagCountsLine,
  topTagCounts,
  type PslFeedbackAuthor,
  type PslFeedbackRow,
} from "@/lib/psl-feedback";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  return String(error);
}

function getAuthorAvatar(author: PslFeedbackAuthor | undefined): string | null {
  if (!author || !Array.isArray(author.photo_urls)) return null;
  const first = author.photo_urls.find(
    (url): url is string => typeof url === "string" && url.length > 0,
  );
  return first ?? null;
}

function getAuthorDisplayName(author: PslFeedbackAuthor | undefined): string {
  return author?.name?.trim() || author?.username?.trim() || "Competitor";
}

type ProfileFeedbackSectionProps = {
  userId: string;
};

/**
 * Own-profile only: aggregate strengths / work-ons + attributed notes from psl_feedback.
 */
export function ProfileFeedbackSection({ userId }: ProfileFeedbackSectionProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PslFeedbackRow[]>([]);
  const [authorsById, setAuthorsById] = useState<Record<string, PslFeedbackAuthor>>({});
  const [reportingId, setReportingId] = useState<string | null>(null);

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await db
        .from("psl_feedback")
        .select("id, author_id, strongest, needs_work, comment, created_at, is_hidden")
        .eq("target_user_id", userId)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const feedbackRows = (data as PslFeedbackRow[] | null) ?? [];
      setRows(feedbackRows);

      const authorIds = Array.from(
        new Set(
          feedbackRows
            .map((row) => row.author_id)
            .filter((id): id is string => typeof id === "string" && id.length > 0),
        ),
      );

      if (authorIds.length === 0) {
        setAuthorsById({});
        return;
      }

      const { data: authorsData, error: authorsError } = await db
        .from("users")
        .select("user_id, username, name, photo_urls")
        .in("user_id", authorIds);

      if (authorsError) throw authorsError;

      const map: Record<string, PslFeedbackAuthor> = {};
      for (const author of (authorsData as PslFeedbackAuthor[] | null) ?? []) {
        map[author.user_id] = author;
      }
      setAuthorsById(map);
    } catch (error) {
      toast({
        title: "Could not load feedback",
        description: getErrorMessage(error),
        variant: "destructive",
      });
      setRows([]);
      setAuthorsById({});
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    void loadFeedback();
  }, [loadFeedback]);

  const strengths = useMemo(
    () => topTagCounts(rows.map((row) => ({ value: row.strongest }))),
    [rows],
  );
  const workOns = useMemo(
    () => topTagCounts(rows.map((row) => ({ value: row.needs_work }))),
    [rows],
  );
  const notes = useMemo(
    () =>
      rows.filter(
        (row) => typeof row.comment === "string" && row.comment.trim().length > 0,
      ),
    [rows],
  );

  const handleReport = async (feedbackId: string) => {
    if (reportingId) return;
    setReportingId(feedbackId);
    try {
      const { error } = await db.from("feedback_reports").insert({
        feedback_id: feedbackId,
        reporter_id: userId,
      });
      if (error) throw error;

      track("psl_feedback_reported", { feedback_id: feedbackId });
      toast({
        title: "Reported — thanks, we'll review it.",
      });

      // Refresh in case a 3rd report auto-hid the note server-side.
      void loadFeedback();
    } catch (error) {
      toast({
        title: "Could not report feedback",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setReportingId(null);
    }
  };

  return (
    <section className="space-y-4">
      <h3 className="text-eyebrow text-center">Feedback</h3>
      <div className="surface-card space-y-5 p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Loading" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-center text-meta">
            No feedback yet. Rate others and invite friends to get more.
          </p>
        ) : (
          <>
            <div className="space-y-3">
              <div>
                <p className="text-meta mb-2">Your strengths</p>
                {strengths.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {strengths.map((item) => (
                      <span
                        key={`s-${item.tag}`}
                        className="inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold font-body text-primary"
                      >
                        {item.tag} ({item.count})
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground font-body">No strength tags yet.</p>
                )}
                {strengths.length > 0 && (
                  <p className="sr-only">{formatTagCountsLine(strengths)}</p>
                )}
              </div>

              <div>
                <p className="text-meta mb-2">Work on</p>
                {workOns.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {workOns.map((item) => (
                      <span
                        key={`w-${item.tag}`}
                        className="inline-flex items-center rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-semibold font-body text-foreground"
                      >
                        {item.tag} ({item.count})
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground font-body">No needs-work tags yet.</p>
                )}
              </div>
            </div>

            {notes.length > 0 && (
              <div className="space-y-3 border-t border-border pt-4">
                <p className="text-meta">Notes</p>
                <ul className="space-y-3">
                  {notes.map((note) => {
                    const author = authorsById[note.author_id];
                    const displayName = getAuthorDisplayName(author);
                    const avatarUrl = getAuthorAvatar(author);
                    const tags: Array<{ key: string; label: string; strong: boolean }> = [];
                    if (typeof note.strongest === "string" && note.strongest.trim()) {
                      tags.push({ key: "strongest", label: note.strongest.trim(), strong: true });
                    }
                    if (typeof note.needs_work === "string" && note.needs_work.trim()) {
                      tags.push({ key: "needs_work", label: note.needs_work.trim(), strong: false });
                    }
                    const when = note.created_at
                      ? formatDistanceToNow(new Date(note.created_at), { addSuffix: true })
                      : null;

                    return (
                      <li
                        key={note.id}
                        className="rounded-md border border-border bg-background/60 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1 space-y-2">
                            {note.author_id ? (
                              <Link
                                to={`/u/${note.author_id}`}
                                className="inline-flex max-w-full items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                <span className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-secondary">
                                  {avatarUrl ? (
                                    <img
                                      src={avatarUrl}
                                      alt=""
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted-foreground">
                                      {displayName.slice(0, 1).toUpperCase()}
                                    </span>
                                  )}
                                </span>
                                <span className="truncate text-sm font-semibold font-body text-foreground hover:text-primary">
                                  {displayName}
                                </span>
                              </Link>
                            ) : (
                              <p className="text-sm font-semibold font-body text-foreground">
                                Competitor
                              </p>
                            )}
                            <p className="text-sm font-body text-foreground leading-relaxed whitespace-pre-wrap">
                              {note.comment?.trim()}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                            disabled={reportingId === note.id}
                            aria-label="Report feedback"
                            onClick={() => void handleReport(note.id)}
                          >
                            {reportingId === note.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Flag className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {tags.map((tag) => (
                            <span
                              key={`${note.id}-${tag.key}`}
                              className={cn(
                                "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium font-body",
                                tag.strong
                                  ? "bg-primary/15 text-primary"
                                  : "bg-secondary text-muted-foreground",
                              )}
                            >
                              {tag.label}
                            </span>
                          ))}
                          {when && <span className="text-meta">{when}</span>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
