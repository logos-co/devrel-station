import { FEEDBACK_LABEL, FEEDBACK_ORG, FEEDBACK_REPO } from "./config";
import type { FeedbackIssue } from "./types";

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
