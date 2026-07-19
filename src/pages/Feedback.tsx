import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { fetchArenaEnergy } from "@/lib/arena-energy";
import { track } from "@/lib/analytics";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type VoteType = "up" | "down";

type FeatureRequestRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  upvote_count: number | null;
  submitted_by: string | null;
  shipped_at: string | null;
  created_at: string;
};

type RequestCard = FeatureRequestRow & {
  upvotes: number;
  downvotes: number;
  userVote: VoteType | null;
};

type VoteRow = {
  id: string;
  request_id: string;
  user_id: string;
  vote_type: string;
};

// App tables are not in the marketing Database types.
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

function formatShippedDate(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function sortByVotes(items: RequestCard[]): RequestCard[] {
  return [...items].sort(
    (a, b) => b.upvotes - a.upvotes || b.downvotes - a.downvotes,
  );
}

function attachVotes(
  requests: FeatureRequestRow[],
  votes: VoteRow[],
  currentUserId: string | undefined,
): RequestCard[] {
  const upByRequest = new Map<string, number>();
  const downByRequest = new Map<string, number>();
  const myVoteByRequest = new Map<string, VoteType>();

  for (const vote of votes) {
    const type = vote.vote_type === "down" ? "down" : vote.vote_type === "up" ? "up" : null;
    if (!type) continue;
    if (type === "up") {
      upByRequest.set(vote.request_id, (upByRequest.get(vote.request_id) ?? 0) + 1);
    } else {
      downByRequest.set(vote.request_id, (downByRequest.get(vote.request_id) ?? 0) + 1);
    }
    if (currentUserId && vote.user_id === currentUserId) {
      myVoteByRequest.set(vote.request_id, type);
    }
  }

  return requests.map((row) => ({
    ...row,
    upvotes: upByRequest.get(row.id) ?? 0,
    downvotes: downByRequest.get(row.id) ?? 0,
    userVote: myVoteByRequest.get(row.id) ?? null,
  }));
}

const TITLE_MAX = 280;
const DESC_MAX = 500;

const Feedback = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [tab, setTab] = useState<"top" | "shipped" | "submit">("top");
  const [arenaEnergy, setArenaEnergy] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [topRequests, setTopRequests] = useState<RequestCard[]>([]);
  const [shippedRequests, setShippedRequests] = useState<RequestCard[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<RequestCard | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    void fetchArenaEnergy(user.id)
      .then((value) => {
        if (!cancelled) setArenaEnergy(value);
      })
      .catch((error) => {
        console.error("Failed to load arena energy:", error);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const loadLists = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [topRes, shippedRes] = await Promise.all([
        db
          .from("feature_requests")
          .select(
            "id, title, description, status, upvote_count, submitted_by, shipped_at, created_at",
          )
          .neq("status", "shipped")
          .order("created_at", { ascending: false }),
        db
          .from("feature_requests")
          .select(
            "id, title, description, status, upvote_count, submitted_by, shipped_at, created_at",
          )
          .eq("status", "shipped")
          .order("shipped_at", { ascending: false }),
      ]);

      if (topRes.error) throw topRes.error;
      if (shippedRes.error) throw shippedRes.error;

      const topRows = (topRes.data as FeatureRequestRow[] | null) ?? [];
      const shippedRows = (shippedRes.data as FeatureRequestRow[] | null) ?? [];
      const allIds = [...topRows, ...shippedRows].map((row) => row.id);

      let votes: VoteRow[] = [];
      if (allIds.length > 0) {
        const votesRes = await db
          .from("feature_request_votes")
          .select("id, request_id, user_id, vote_type")
          .in("request_id", allIds);
        if (votesRes.error) throw votesRes.error;
        votes = (votesRes.data as VoteRow[] | null) ?? [];
      }

      setTopRequests(sortByVotes(attachVotes(topRows, votes, user.id)));
      setShippedRequests(attachVotes(shippedRows, votes, user.id));
    } catch (error) {
      toast({
        title: "Could not load feature board",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    if (tab === "submit") return;
    void loadLists();
  }, [tab, loadLists]);


  const applyLocalVotePatch = (requestId: string, patch: Partial<RequestCard>) => {
    setTopRequests((prev) =>
      sortByVotes(prev.map((row) => (row.id === requestId ? { ...row, ...patch } : row))),
    );
  };

  const handleVote = async (item: RequestCard, direction: VoteType) => {
    if (!user?.id) return;

    const snapshot = {
      upvotes: item.upvotes,
      downvotes: item.downvotes,
      userVote: item.userVote,
    };

    try {
      if (item.userVote === direction) {
        // Cancel vote
        applyLocalVotePatch(item.id, {
          userVote: null,
          upvotes: direction === "up" ? item.upvotes - 1 : item.upvotes,
          downvotes: direction === "down" ? item.downvotes - 1 : item.downvotes,
        });
        const { error } = await db
          .from("feature_request_votes")
          .delete()
          .eq("request_id", item.id)
          .eq("user_id", user.id);
        if (error) throw error;
        return;
      }

      if (item.userVote != null) {
        // Switch direction
        applyLocalVotePatch(item.id, {
          userVote: direction,
          upvotes:
            direction === "up" ? item.upvotes + 1 : Math.max(0, item.upvotes - 1),
          downvotes:
            direction === "down"
              ? item.downvotes + 1
              : Math.max(0, item.downvotes - 1),
        });
        const { error } = await db
          .from("feature_request_votes")
          .update({ vote_type: direction })
          .eq("request_id", item.id)
          .eq("user_id", user.id);
        if (error) throw error;
        track("feature_request_voted", { vote_type: direction });
        return;
      }

      // New vote
      applyLocalVotePatch(item.id, {
        userVote: direction,
        upvotes: direction === "up" ? item.upvotes + 1 : item.upvotes,
        downvotes: direction === "down" ? item.downvotes + 1 : item.downvotes,
      });
      const { error } = await db.from("feature_request_votes").upsert(
        {
          request_id: item.id,
          user_id: user.id,
          vote_type: direction,
        },
        { onConflict: "request_id,user_id" },
      );
      if (error) throw error;
      track("feature_request_voted", { vote_type: direction });
    } catch (error) {
      applyLocalVotePatch(item.id, snapshot);
      toast({
        title: "Could not save your vote",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    if (!user?.id || !trimmedTitle || submitting) return;

    setSubmitting(true);
    try {
      const { error } = await db.from("feature_requests").insert({
        title: trimmedTitle,
        description: description.trim() || null,
        status: "pending",
        upvote_count: 0,
        submitted_by: user.id,
      });
      if (error) throw error;
      setTitle("");
      setDescription("");
      setSubmitted(true);
      track("feature_request_submitted");
    } catch (error) {
      toast({
        title: "Could not submit idea",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user?.id || !deleteTarget || deleting) return;
    const target = deleteTarget;
    setDeleting(true);
    const snapshot = topRequests;
    setTopRequests((prev) => prev.filter((row) => row.id !== target.id));
    setDeleteTarget(null);

    try {
      const { error } = await db
        .from("feature_requests")
        .delete()
        .eq("id", target.id)
        .eq("submitted_by", user.id);
      if (error) throw error;
    } catch (error) {
      setTopRequests(snapshot);
      toast({
        title: "Could not delete your idea",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const renderCard = (item: RequestCard, showVotes: boolean) => {
    const isOwn = Boolean(user?.id && item.submitted_by === user.id);
    const isShipped = item.status === "shipped";
    const netVotes = item.upvotes - item.downvotes;

    return (
      <article
        key={item.id}
        className="relative surface-card space-y-4 p-4 animate-fade-in sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="min-w-0 flex-1 text-section text-foreground normal-case tracking-tight">
            {item.title}
          </h2>
          {showVotes && isOwn ? (
            <button
              type="button"
              aria-label="Delete your idea"
              onClick={() => setDeleteTarget(item)}
              className="shrink-0 rounded-md p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground active:scale-[0.97]"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : isShipped ? (
            <span className="shrink-0 rounded-md border border-emerald-400/40 bg-emerald-500/20 px-2 py-2 text-meta font-bold uppercase tracking-wide text-emerald-300">
              Shipped
            </span>
          ) : (
            <span className="shrink-0 rounded-md border border-primary/40 bg-primary/15 px-2 py-2 text-meta font-bold uppercase tracking-wide text-primary">
              Live
            </span>
          )}
        </div>

        {item.description ? (
          <p className="text-meta leading-relaxed">{item.description}</p>
        ) : null}

        {isShipped && item.shipped_at ? (
          <p className="text-meta font-medium text-emerald-400">
            Shipped {formatShippedDate(item.shipped_at)}
          </p>
        ) : null}

        {showVotes ? (
          <div className="flex items-end justify-between gap-4 border-t border-border pt-4">
            <div>
              <p className="text-meta uppercase tracking-wide">Votes</p>
              <p className="text-stat-sm text-primary tabular-nums leading-none">
                {netVotes > 0 ? `+${netVotes}` : netVotes}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleVote(item, "up")}
                className={cn(
                  "inline-flex min-h-btn-secondary items-center gap-2 rounded-md border px-4 text-sm font-bold font-body transition active:scale-[0.97]",
                  item.userVote === "up"
                    ? "border-primary bg-primary text-primary-foreground shadow-primary-glow-sm"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary",
                )}
                aria-label={item.userVote === "up" ? "Remove upvote" : "Upvote"}
              >
                <ChevronUp className="h-4 w-4" />
                <span className="tabular-nums">{item.upvotes}</span>
              </button>
              <button
                type="button"
                onClick={() => void handleVote(item, "down")}
                className={cn(
                  "inline-flex min-h-btn-secondary items-center gap-2 rounded-md border px-4 text-sm font-bold font-body transition active:scale-[0.97]",
                  item.userVote === "down"
                    ? "border-red-400/60 bg-red-500/20 text-red-300"
                    : "border-border text-muted-foreground hover:border-red-400/40 hover:text-red-300",
                )}
                aria-label={item.userVote === "down" ? "Remove downvote" : "Downvote"}
              >
                <ChevronDown className="h-4 w-4" />
                <span className="tabular-nums">{item.downvotes}</span>
              </button>
            </div>
          </div>
        ) : null}
      </article>
    );
  };

  const topList = useMemo(() => topRequests, [topRequests]);

  return (
    <main className="min-h-dvh overflow-x-hidden bg-background text-foreground">
      <AppHeader energy={arenaEnergy} />

      <div className="container mx-auto max-w-full overflow-x-hidden px-4 py-4 sm:px-6 sm:py-8">
        <div className="mb-6 text-center">
          <h1 className="text-page-title text-primary">
            FEATURE BOARD
          </h1>
        </div>

        <div className="mx-auto max-w-lg">
          <Tabs
            value={tab}
            onValueChange={(value) => {
              if (value === "top" || value === "shipped" || value === "submit") {
                setTab(value);
              }
            }}
          >
            <TabsList className="grid w-full grid-cols-3 h-auto gap-2 bg-secondary/50 p-2">
              <TabsTrigger value="top" className="text-meta sm:text-sm py-2">
                TOP REQUESTS
              </TabsTrigger>
              <TabsTrigger value="shipped" className="text-meta sm:text-sm py-2">
                SHIPPED
              </TabsTrigger>
              <TabsTrigger value="submit" className="text-meta sm:text-sm py-2">
                SUBMIT
              </TabsTrigger>
            </TabsList>

            <TabsContent value="top" className="mt-4 space-y-4">
              {loading ? (
                <div className="flex min-h-[30vh] items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" aria-label="Loading" />
                </div>
              ) : topList.length === 0 ? (
                <p className="surface-card p-8 text-center text-sm text-muted-foreground font-body">
                  No challenges on the board. Drop the first request.
                </p>
              ) : (
                topList.map((item) => renderCard(item, true))
              )}
            </TabsContent>

            <TabsContent value="shipped" className="mt-4 space-y-4">
              {loading ? (
                <div className="flex min-h-[30vh] items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" aria-label="Loading" />
                </div>
              ) : shippedRequests.length === 0 ? (
                <p className="surface-card p-8 text-center text-sm text-muted-foreground font-body">
                  Nothing shipped yet. Keep pushing.
                </p>
              ) : (
                shippedRequests.map((item) => renderCard(item, false))
              )}
            </TabsContent>

            <TabsContent value="submit" className="mt-4">
              {submitted ? (
                <div className="surface-card px-6 py-12 text-center space-y-4">
                  <p className="text-5xl" aria-hidden>
                    🙏
                  </p>
                  <h2 className="text-section text-foreground">THANK YOU!</h2>
                  <p className="text-meta leading-relaxed">
                    Your idea has been submitted.
                    <br />
                    We read every single one.
                  </p>
                  <Button
                    type="button"
                    className="font-body"
                    onClick={() => {
                      setSubmitted(false);
                      setTitle("");
                      setDescription("");
                    }}
                  >
                    SUBMIT ANOTHER IDEA
                  </Button>
                </div>
              ) : (
                <div className="surface-card p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="idea-title" className="font-body">
                      What should we build?
                    </Label>
                    <Textarea
                      id="idea-title"
                      value={title}
                      onChange={(event) => setTitle(event.target.value.slice(0, TITLE_MAX))}
                      placeholder="Your feature idea..."
                      maxLength={TITLE_MAX}
                      rows={3}
                      className="font-body resize-none"
                    />
                    <p className="text-right text-meta tabular-nums">
                      {title.length}/{TITLE_MAX}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="idea-description" className="font-body">
                      Description (optional)
                    </Label>
                    <Textarea
                      id="idea-description"
                      value={description}
                      onChange={(event) =>
                        setDescription(event.target.value.slice(0, DESC_MAX))
                      }
                      placeholder="Add more detail..."
                      maxLength={DESC_MAX}
                      rows={4}
                      className="font-body resize-none"
                    />
                    <p className="text-right text-meta tabular-nums">
                      {description.length}/{DESC_MAX}
                    </p>
                  </div>

                  <Button
                    type="button"
                    className="w-full font-body"
                    disabled={!title.trim() || submitting}
                    onClick={() => void handleSubmit()}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        SUBMITTING...
                      </>
                    ) : (
                      "SUBMIT IDEA"
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display tracking-tight">Delete idea?</AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              This will permanently remove your feature request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-body" disabled={deleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="font-body bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

export default Feedback;
