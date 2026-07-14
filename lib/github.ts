import { FEEDBACK_LABEL, FEEDBACK_ORG, FEEDBACK_REPO } from "./config";
import type { FeedbackIssue, MilestoneReview } from "./types";

const API = "https://api.github.com";

function apiHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "devrel-station",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

// Matches a first line like "Review M1: ..." / "**M2 review** ..." — the
// convention engineering uses to tie a review comment to a milestone.
const REVIEW_RE =
  /^\s*(?:\*\*|#+\s*)?(?:review[\s:–—-]*(m\d+)|(m\d+)[\s:–—-]*review)\b/i;
// Plain discussion comment on a milestone: "M1: ..." / "Re M2 — ..."
const COMMENT_RE = /^\s*(?:\*\*|#+\s*)?(?:re[\s:–—-]+)?(m\d+)\b[\s:–—-]/i;

const MEMBER_ASSOCIATIONS = ["MEMBER", "OWNER"];

interface GhComment {
  body?: string;
  html_url: string;
  created_at: string;
  author_association?: string;
  user: { login: string };
}

export function parseThreadComment(c: GhComment): MilestoneReview | null {
  const firstLine = (c.body ?? "").split("\n", 1)[0];
  let milestone: string;
  let kind: MilestoneReview["kind"];
  let verdict: MilestoneReview["verdict"] = null;

  const review = firstLine.match(REVIEW_RE);
  if (review) {
    kind = "review";
    milestone = (review[1] ?? review[2]).toUpperCase();
    const rest = firstLine.slice(review.index! + review[0].length);
    verdict = /^[\s:–—-]*approved\b/i.test(rest)
      ? "approved"
      : /^[\s:–—-]*changes\s+requested\b/i.test(rest)
        ? "changes_requested"
        : null;
  } else {
    const comment = firstLine.match(COMMENT_RE);
    if (!comment) return null;
    kind = "comment";
    milestone = comment[1].toUpperCase();
  }

  return {
    milestone,
    author: c.user.login,
    body: c.body ?? "",
    url: c.html_url,
    created_at: c.created_at,
    verdict,
    kind,
    is_member: MEMBER_ASSOCIATIONS.includes(c.author_association ?? ""),
  };
}

interface GhSearchIssue {
  number: number;
  title: string;
  body?: string | null;
  html_url: string;
  state: string;
  created_at: string;
  comments: number;
  user: { login: string };
  labels: { name: string }[];
  repository_url: string; // https://api.github.com/repos/<owner>/<repo>
}

export function mapFeedbackIssue(it: GhSearchIssue): FeedbackIssue {
  return {
    repo: it.repository_url.replace(`${API}/repos/`, ""),
    number: it.number,
    title: it.title,
    body: it.body ?? "",
    url: it.html_url,
    state: it.state === "closed" ? "closed" : "open",
    author: it.user.login,
    created_at: it.created_at,
    labels: it.labels.map((l) => l.name).filter((n) => n !== FEEDBACK_LABEL),
    comments: it.comments,
  };
}

async function searchFeedbackIssues(scope: string): Promise<FeedbackIssue[] | null> {
  const q = encodeURIComponent(`${scope} is:issue label:${FEEDBACK_LABEL}`);
  try {
    const issues: FeedbackIssue[] = [];
    for (let page = 1; page <= 3; page++) {
      const res = await fetch(
        `${API}/search/issues?q=${q}&sort=created&order=desc&per_page=100&page=${page}`,
        { headers: apiHeaders() },
      );
      if (!res.ok) return page === 1 ? null : issues;
      const data: { items?: GhSearchIssue[] } = await res.json();
      const items = data.items ?? [];
      issues.push(...items.map(mapFeedbackIssue));
      if (items.length < 100) break;
    }
    return issues;
  } catch {
    return null;
  }
}

// All `feedback`-labeled issues across the org (plus FEEDBACK_REPO, if that
// lives outside the org), newest first. Search only sees public repos unless
// GITHUB_TOKEN grants more. Null = fetch failed.
export async function fetchFeedbackIssues(): Promise<FeedbackIssue[] | null> {
  const org = await searchFeedbackIssues(`org:${FEEDBACK_ORG}`);
  if (FEEDBACK_REPO.startsWith(`${FEEDBACK_ORG}/`)) return org;
  const repo = await searchFeedbackIssues(`repo:${FEEDBACK_REPO}`);
  if (org === null && repo === null) return null;
  const merged = [...(org ?? []), ...(repo ?? [])];
  return merged
    .filter((i, idx) => merged.findIndex((j) => j.url === i.url) === idx)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function fetchMilestoneReviews(
  repo: string,
  issueNumber: number,
): Promise<MilestoneReview[] | null> {
  try {
    const reviews: MilestoneReview[] = [];
    for (let page = 1; page <= 3; page++) {
      const res = await fetch(
        `${API}/repos/${repo}/issues/${issueNumber}/comments?per_page=100&page=${page}`,
        { headers: apiHeaders() },
      );
      if (!res.ok) return page === 1 ? null : reviews;
      const comments: GhComment[] = await res.json();
      for (const c of comments) {
        const parsed = parseThreadComment(c);
        if (parsed) reviews.push(parsed);
      }
      if (comments.length < 100) break;
    }
    return reviews.sort((a, b) => a.created_at.localeCompare(b.created_at));
  } catch {
    return null;
  }
}
