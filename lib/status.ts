import type { MilestoneStatus, OverallStatus } from "./types";

// Shared display metadata for statuses. Badges always render the label text,
// so color never carries meaning alone.
export const MILESTONE_STATUS_META: Record<
  MilestoneStatus,
  { label: string; className: string; description: string }
> = {
  not_started: {
    label: "Not started",
    className: "badge-neutral",
    description: "Work has not begun",
  },
  in_progress: {
    label: "In progress",
    className: "badge-progress",
    description: "The team is actively working on this milestone",
  },
  delivered: {
    label: "Delivered",
    className: "badge-attention",
    description: "Deliverables submitted — waiting for engineering to pick up the review",
  },
  in_review: {
    label: "In review",
    className: "badge-attention",
    description: "Engineering is reviewing the deliverables",
  },
  approved: {
    label: "Approved",
    className: "badge-approved",
    description: "Engineering approved — DevRel should request payout from finance",
  },
  payout_requested: {
    label: "Payout requested",
    className: "badge-payout",
    description: "Finance has been asked to pay out",
  },
  paid: {
    label: "Paid",
    className: "badge-good",
    description: "Payout completed — milestone closed",
  },
  blocked: {
    label: "Blocked",
    className: "badge-critical",
    description: "Progress is blocked — see notes",
  },
};

export const OVERALL_STATUS_META: Record<
  OverallStatus,
  { label: string; className: string }
> = {
  on_track: { label: "On track", className: "badge-progress" },
  needs_review: { label: "Awaiting review", className: "badge-attention" },
  needs_payout: { label: "Payout pending", className: "badge-payout" },
  blocked: { label: "Blocked", className: "badge-critical" },
  overdue: { label: "Overdue", className: "badge-critical" },
  completed: { label: "Completed", className: "badge-good" },
};

export function formatUsd(amount: number): string {
  return `$${amount.toLocaleString("en-US")}`;
}

export function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
