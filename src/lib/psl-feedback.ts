export const PSL_FEEDBACK_TAGS = [
  "Jawline",
  "Skin",
  "Hair",
  "Eyes",
  "Style",
  "Grooming",
  "Physique",
  "Smile",
] as const;

export type PslFeedbackTag = (typeof PSL_FEEDBACK_TAGS)[number];

export const PSL_FEEDBACK_COMMENT_MAX = 200;

export type PslFeedbackRow = {
  id: string;
  author_id: string;
  strongest: string | null;
  needs_work: string | null;
  comment: string | null;
  created_at: string | null;
  is_hidden?: boolean | null;
};

export type PslFeedbackAuthor = {
  user_id: string;
  username: string | null;
  name: string | null;
  photo_urls: string[] | null;
};

export type TagCount = {
  tag: string;
  count: number;
};

/** Count tag values and return the top N sorted by count desc, then name. */
export function topTagCounts(
  rows: Array<{ value: string | null | undefined }>,
  limit = 3,
): TagCount[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const tag = typeof row.value === "string" ? row.value.trim() : "";
    if (!tag) continue;
    counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, limit);
}

export function formatTagCountsLine(items: TagCount[]): string {
  return items.map((item) => `${item.tag} (${item.count})`).join(" · ");
}
