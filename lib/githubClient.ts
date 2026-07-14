// Client-side GitHub access. The token lives only in the engineer's browser
// (localStorage) and is sent only to api.github.com — the dashboard itself
// stays a static site with no server-held secrets.
import { FEEDBACK_LABEL, FEEDBACK_REPO } from "./config";
import type { FeedbackIssue, MilestoneReview } from "./types";

const TOKEN_KEY = "rfp-tracker:github-token";
export const TOKEN_EVENT = "rfp-tracker:token-changed";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string | null) {
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event(TOKEN_EVENT));
}

async function gh(path: string, init: RequestInit = {}) {
  const token = getStoredToken();
  if (!token) throw new Error("No GitHub token connected");
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (!res.ok) {
    let detail = "";
    try {
      detail = ((await res.json()) as { message?: string }).message ?? "";
    } catch {
      /* non-JSON error body */
    }
    const hint =
      res.status === 401
        ? "Token is invalid or expired"
        : res.status === 403 || res.status === 404
          ? "Token lacks permission on this repository"
          : `GitHub returned ${res.status}`;
    throw new Error(detail ? `${hint} — ${detail}` : hint);
  }
  return res.status === 204 ? null : res.json();
}

export async function fetchViewer(): Promise<{ login: string }> {
  return gh("/user") as Promise<{ login: string }>;
}

// Files community feedback as a `feedback`-labeled issue in FEEDBACK_REPO
// under the connected user's account. Labels only stick when the token's
// user has triage rights on the repo.
export async function createFeedbackIssue(
  title: string,
  body: string,
): Promise<FeedbackIssue> {
  const it = (await gh(`/repos/${FEEDBACK_REPO}/issues`, {
    method: "POST",
    body: JSON.stringify({ title, body, labels: [FEEDBACK_LABEL] }),
  })) as {
    number: number;
    title: string;
    body?: string | null;
    html_url: string;
    state: string;
    created_at: string;
    comments: number;
    user: { login: string };
    labels: { name: string }[];
  };
  return {
    repo: FEEDBACK_REPO,
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

export type ReviewVerdict = "approved" | "changes_requested";

export async function postReviewComment(
  repo: string,
  issue: number,
  milestoneId: string,
  text: string,
  verdict?: ReviewVerdict,
): Promise<MilestoneReview> {
  // Verdicts and reviews use the "Review Mx" convention; a plain comment is
  // just "Mx: …" so the thread reads like a forum.
  const prefix =
    verdict === "approved"
      ? `Review ${milestoneId} — Approved`
      : verdict === "changes_requested"
        ? `Review ${milestoneId} — Changes requested`
        : `${milestoneId}:`;
  const body = text ? `${prefix}${verdict ? ":" : ""} ${text}` : prefix;
  const c = (await gh(`/repos/${repo}/issues/${issue}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  })) as {
    body: string;
    html_url: string;
    created_at: string;
    author_association?: string;
    user: { login: string };
  };
  return {
    milestone: milestoneId.toUpperCase(),
    author: c.user.login,
    body: c.body,
    url: c.html_url,
    created_at: c.created_at,
    verdict: verdict ?? null,
    kind: verdict ? "review" : "comment",
    is_member: ["MEMBER", "OWNER"].includes(c.author_association ?? ""),
  };
}

