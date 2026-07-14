// Milestone lifecycle, in workflow order. This mirrors the real process:
// dev works → submits deliverables → engineering reviews → engineering approves
// → DevRel asks finance to pay → finance pays.
export const MILESTONE_STATUSES = [
  "not_started",
  "in_progress",
  "delivered",
  "in_review",
  "approved",
  "payout_requested",
  "paid",
  "blocked",
] as const;

export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export interface Milestone {
  id: string;
  title: string;
  payout: number;
  status: MilestoneStatus;
  duration?: string;
  due?: string; // YYYY-MM-DD, explicit agreed date
  // due, or derived from start_date + cumulative duration upper bounds
  expected_due?: string;
  due_estimated?: boolean; // expected_due was derived, not agreed
  late_days?: number; // days past expected_due while still unfinished
  deliverables?: string;
  links: string[];
  reviewer?: string;
  approved_date?: string;
  payout_requested_date?: string;
  paid_date?: string;
  notes?: string;
}

export interface TrackedProposal {
  slug: string; // filename without .md
  rfp: string; // e.g. "RFP-001"
  title: string;
  team: string;
  contact?: string;
  proposal_issue?: number;
  proposal_url?: string;
  // Issue in the dedicated tracking repo hosting this delivery's milestone
  // discussion. Falls back to the proposal issue when unset.
  tracking_issue?: number;
  tracking_url?: string;
  delivery_repo?: string;
  accepted_date?: string;
  start_date?: string;
  target_date?: string;
  total_budget: number;
  milestones: Milestone[];
  notes: string; // markdown body of the tracking file
  // derived
  paid_amount: number;
  approved_amount: number;
  paid_count: number;
  overall: OverallStatus;
  next_due?: string;
  // target_date if set, else the last milestone's expected due date
  estimated_finish?: string;
  finish_estimated?: boolean;
  overdue: boolean;
}

// One published resource inside a Content Factory collection — a tweet in a
// series, a video in a playlist, a post in a set.
export interface ContentResource {
  title: string; // e.g. "Part 0"
  url: string;
  preview?: ResourcePreview;
}

// Metadata fetched from the platform at build/ISR time (best-effort — a
// resource without a preview falls back to a plain link tile).
export interface ResourcePreview {
  thumbnail?: string; // media thumbnail URL
  video?: boolean; // thumbnail is a video still
  date?: string; // YYYY-MM-DD published
}

// A Content Factory collection: a named series of published resources.
// One data/content-factory/*.md file per collection.
export interface ContentCollection {
  slug: string; // filename without .md
  title: string; // e.g. "Basecamp tutorials"
  platform?: string; // e.g. "X"
  items: ContentResource[];
  notes: string; // markdown body of the collection file
}

// One piece of community feedback — a GitHub issue labeled `feedback`,
// anywhere in the org. The issue is the record; GitHub is the workflow.
export interface FeedbackIssue {
  repo: string; // "logos-co/feedback"
  number: number;
  title: string;
  body: string;
  url: string;
  state: "open" | "closed";
  author: string;
  created_at: string;
  labels: string[]; // labels besides `feedback`
  comments: number;
}

export type OverallStatus =
  | "on_track"
  | "needs_review"
  | "needs_payout"
  | "blocked"
  | "overdue"
  | "completed";

// One entry in a milestone's discussion thread — an issue comment on the
// proposal whose first line references the milestone:
//   "Review M1: …"                        → review
//   "Review M1 — Approved[: …]"           → review with verdict
//   "Review M1 — Changes requested[: …]"  → review with verdict
//   "M1: …"                               → plain discussion comment
export interface MilestoneReview {
  milestone: string; // "M1"
  author: string;
  body: string;
  url: string;
  created_at: string;
  verdict: "approved" | "changes_requested" | null;
  kind: "review" | "comment";
  is_member: boolean; // author is a logos-co org member/owner
}
