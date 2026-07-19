import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Trophy, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProfileUser = {
  user_id: string;
  username: string | null;
  name: string | null;
  photo_urls: string[] | null;
  country: string | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  mogg_score: number | null;
  psl_average: number | null;
  psl_rating_count: number | null;
  global_rank: number | null;
  local_rank: number | null;
  battle_count: number | null;
  total_wins: number | null;
  win_rate: number | null;
  confidence_tier: string | null;
  arena_energy?: number | null;
  is_competing?: boolean | null;
  show_on_leaderboard?: boolean | null;
};

export type RankHistoryRow = {
  id: string;
  date: string;
  global_rank: number | null;
  local_rank: number | null;
};

export const PROFILE_SELECT =
  "user_id, username, name, photo_urls, country, age, height_cm, weight_kg, mogg_score, psl_average, psl_rating_count, global_rank, local_rank, battle_count, total_wins, win_rate, confidence_tier, arena_energy, is_competing, show_on_leaderboard";

export const ENERGY_CAP = 200;

export function getPhotos(profile: ProfileUser | null | undefined): string[] {
  if (!profile || !Array.isArray(profile.photo_urls)) return [];
  return profile.photo_urls.filter((url): url is string => typeof url === "string" && url.length > 0);
}

export function getDisplayName(profile: ProfileUser | null | undefined): string {
  return profile?.name?.trim() || profile?.username || "Competitor";
}

export function formatConfidenceLabel(tier?: string | null): string {
  const normalized = (tier ?? "").trim().toLowerCase();
  if (normalized === "verified" || normalized === "high") return "Verified ✓";
  if (normalized === "ranked" || normalized === "medium") return "Ranked";
  return "Unranked";
}

function formatBodyStats(profile: ProfileUser): string | null {
  const parts: string[] = [];
  if (typeof profile.height_cm === "number" && Number.isFinite(profile.height_cm)) {
    parts.push(`${Math.round(profile.height_cm)} cm`);
  }
  if (typeof profile.weight_kg === "number" && Number.isFinite(profile.weight_kg)) {
    parts.push(`${Math.round(profile.weight_kg)} kg`);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

function formatWinRate(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  const n = Number(value);
  const pct = n > 0 && n <= 1 ? n * 100 : n;
  return `${Math.round(pct)}%`;
}

function formatRank(rank: number | null | undefined): string {
  if (rank == null || !Number.isFinite(Number(rank))) return "Unranked";
  return `#${rank}`;
}

function formatShortDate(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function rankArrow(
  current: number | null,
  previous: number | null,
): { symbol: "up" | "down"; className: string } | null {
  if (current == null || previous == null) return null;
  if (current < previous) return { symbol: "up", className: "text-emerald-400" };
  if (current > previous) return { symbol: "down", className: "text-red-400" };
  return null;
}

type ProfileCardProps = {
  profile: ProfileUser;
  className?: string;
  /** Own profile only — public profiles hide this. */
  showEnergyMeter?: boolean;
  rankHistory?: RankHistoryRow[];
  rankHistoryEmptyMessage?: string;
};

/** Shared photo + stats layout for own and public profiles. */
export function ProfileCard({
  profile,
  className,
  showEnergyMeter = false,
  rankHistory = [],
  rankHistoryEmptyMessage = "Your rank history will appear here after your first leaderboard refresh.",
}: ProfileCardProps) {
  const photos = useMemo(() => getPhotos(profile), [profile]);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    setPhotoIndex(0);
  }, [profile.user_id]);

  const safeIndex = photos.length === 0 ? 0 : Math.min(photoIndex, photos.length - 1);
  const mainPhoto = photos[safeIndex] ?? null;
  const displayName = getDisplayName(profile);
  const bodyStats = formatBodyStats(profile);
  const ratingCount = Number(profile.psl_rating_count ?? 0);
  const hasPsl = Number.isFinite(ratingCount) && ratingCount > 0;
  const energy = Number(profile.arena_energy ?? 0);
  const energySafe = Number.isFinite(energy) ? Math.max(0, energy) : 0;
  const energyPct = Math.min(100, (energySafe / ENERGY_CAP) * 100);
  const globalTopTen =
    profile.global_rank != null && Number.isFinite(profile.global_rank) && profile.global_rank <= 10;
  const localChampion = profile.local_rank === 1;

  return (
    <div className={cn("space-y-8", className)}>
      {/* Photos + identity — avatar owns the page */}
      <section className="space-y-4">
        <div className="overflow-hidden surface-card">
          {mainPhoto ? (
            <img
              src={mainPhoto}
              alt={displayName}
              className="aspect-[3/4] max-h-[58dvh] sm:max-h-[70dvh] w-full object-cover mx-auto"
            />
          ) : (
            <div className="flex aspect-[3/4] max-h-[58dvh] sm:max-h-[70dvh] w-full items-center justify-center bg-secondary text-meta">
              No photo yet
            </div>
          )}

          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto p-4">
              {photos.map((url, index) => (
                <button
                  key={`${url}-${index}`}
                  type="button"
                  onClick={() => setPhotoIndex(index)}
                  aria-label={`Show photo ${index + 1}`}
                  className={cn(
                    "h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition",
                    index === safeIndex
                      ? "border-primary shadow-primary-glow-sm"
                      : "border-transparent opacity-80 hover:opacity-100",
                  )}
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="text-center space-y-2 px-2">
          <h2 className="text-page-title text-foreground normal-case tracking-tight leading-none">
            {displayName}
          </h2>
          <p className="text-meta">@{profile.username || "user"}</p>
          <p className="text-body text-foreground">
            {profile.country || "Unknown country"}
            {typeof profile.age === "number" && Number.isFinite(profile.age)
              ? ` · ${profile.age}`
              : ""}
          </p>
          {bodyStats ? <p className="text-meta">{bodyStats}</p> : null}
        </div>
      </section>

      {/* Rank plaque — most prominent status after photo */}
      <section className="space-y-4">
        <h3 className="text-eyebrow text-center">Rank</h3>
        <div className="grid grid-cols-2 overflow-hidden surface-card border-primary/40 shadow-primary-glow-sm">
          <div className="space-y-2 border-r border-border px-4 py-6 text-center sm:py-8">
            <div className="flex items-center justify-center gap-2">
              {globalTopTen ? <Trophy className="h-4 w-4 text-primary" aria-hidden /> : null}
              <p className="text-meta uppercase tracking-[0.2em]">Global</p>
            </div>
            <p className="text-meta">Worldwide arena</p>
            <p className="text-stat text-foreground">{formatRank(profile.global_rank)}</p>
          </div>
          <div className="space-y-2 px-4 py-6 text-center sm:py-8">
            <p className="text-meta uppercase tracking-[0.2em]">Local</p>
            <p className="truncate text-meta">{profile.country?.trim() || "Territory"}</p>
            <p className="text-stat text-foreground">{formatRank(profile.local_rank)}</p>
            {localChampion ? (
              <span className="mt-2 inline-block rounded-full border border-primary/40 bg-primary/10 px-2 py-2 text-meta font-bold tracking-wide text-primary">
                Territory champion
              </span>
            ) : null}
          </div>
        </div>
      </section>

      {/* MOGG SCORE */}
      <section className="space-y-4">
        <h3 className="text-eyebrow text-center">Score</h3>
        <div className="surface-card px-4 py-8 text-center">
          <p className="text-meta uppercase tracking-[0.25em]">MOGG score</p>
          <p className="mt-2 text-stat-hero text-foreground">
            {Math.round(Number(profile.mogg_score ?? 0)).toLocaleString()}
          </p>
        </div>
      </section>

      {/* Trophy stat cards */}
      <section className="space-y-4">
        <h3 className="text-eyebrow text-center">Record</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Battles", value: String(profile.battle_count ?? 0) },
            { label: "Wins", value: String(profile.total_wins ?? 0) },
            { label: "Win Rate", value: formatWinRate(profile.win_rate) },
            { label: "Status", value: formatConfidenceLabel(profile.confidence_tier) },
          ].map((chip) => (
            <div
              key={chip.label}
              className="min-w-0 surface-card border-primary/20 px-4 py-6 text-center shadow-primary-glow-sm animate-fade-in"
            >
              <p className="text-stat-sm tabular-nums leading-none text-primary normal-case">
                {chip.value}
              </p>
              <p className="mt-4 text-meta uppercase tracking-wide">{chip.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Arena energy */}
      {showEnergyMeter ? (
        <section className="space-y-4">
          <h3 className="text-eyebrow text-center">Energy</h3>
          <div className="surface-card p-4 space-y-4 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary fill-primary/20" aria-hidden />
                <p className="text-meta uppercase tracking-[0.2em]">Arena energy</p>
              </div>
              <p className="text-body font-semibold tabular-nums text-foreground">
                {Math.round(energySafe).toLocaleString()} / {ENERGY_CAP}
              </p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary shadow-primary-glow-sm transition-[width] duration-300"
                style={{ width: `${energyPct}%` }}
              />
            </div>
            <p className="text-meta">
              Visibility fuel · Earned from votes and ratings · Spent when you appear
            </p>
          </div>
        </section>
      ) : null}

      {/* Rank history */}
      <section className="space-y-4">
        <h3 className="text-eyebrow text-center">History</h3>
        <div className="surface-card overflow-hidden">
          <div className="border-b border-border px-4 py-4">
            <p className="text-meta uppercase tracking-[0.2em]">Rank history</p>
          </div>
          {rankHistory.length === 0 ? (
            <p className="px-4 py-6 text-center text-meta">{rankHistoryEmptyMessage}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-body">
                <thead>
                  <tr className="border-b border-border text-meta">
                    <th className="px-4 py-2 text-left font-medium">Date</th>
                    <th className="px-4 py-2 text-center font-medium">Global</th>
                    <th className="px-4 py-2 text-center font-medium">Local</th>
                  </tr>
                </thead>
                <tbody>
                  {rankHistory.map((row, index) => {
                    const older = rankHistory[index + 1];
                    const globalMove = rankArrow(row.global_rank, older?.global_rank ?? null);
                    const localMove = rankArrow(row.local_rank, older?.local_rank ?? null);
                    return (
                      <tr key={row.id} className="border-b border-border/60 last:border-0">
                        <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                          {formatShortDate(row.date)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className="inline-flex items-center justify-center gap-2 tabular-nums text-foreground">
                            {row.global_rank != null ? `#${row.global_rank}` : "—"}
                            {globalMove?.symbol === "up" ? (
                              <ChevronUp className={cn("h-4 w-4", globalMove.className)} />
                            ) : null}
                            {globalMove?.symbol === "down" ? (
                              <ChevronDown className={cn("h-4 w-4", globalMove.className)} />
                            ) : null}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className="inline-flex items-center justify-center gap-2 tabular-nums text-foreground">
                            {row.local_rank != null ? `#${row.local_rank}` : "—"}
                            {localMove?.symbol === "up" ? (
                              <ChevronUp className={cn("h-4 w-4", localMove.className)} />
                            ) : null}
                            {localMove?.symbol === "down" ? (
                              <ChevronDown className={cn("h-4 w-4", localMove.className)} />
                            ) : null}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* PSL */}
      <section className="space-y-4">
        <h3 className="text-eyebrow text-center">PSL</h3>
        <div className="surface-card p-6 text-center sm:p-8">
          {hasPsl ? (
            <>
              <p className="text-stat text-foreground">{Number(profile.psl_average).toFixed(2)}</p>
              <p className="mt-2 text-meta">
                · {ratingCount} {ratingCount === 1 ? "rating" : "ratings"}
              </p>
            </>
          ) : (
            <p className="text-meta">Not rated yet</p>
          )}
        </div>
      </section>
    </div>
  );
}
