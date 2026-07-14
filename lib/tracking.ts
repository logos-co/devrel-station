import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { RFP_REPO } from "./config";
import type {
  Milestone,
  MilestoneStatus,
  OverallStatus,
  TrackedProposal,
} from "./types";
import { MILESTONE_STATUSES } from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "rfps");

function asString(v: unknown): string | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
}

function parseMilestone(raw: Record<string, unknown>, index: number): Milestone {
  const status = asString(raw.status) as MilestoneStatus | undefined;
  return {
    id: asString(raw.id) ?? `M${index + 1}`,
    title: asString(raw.title) ?? `Milestone ${index + 1}`,
    payout: Number(raw.payout ?? 0),
    status: status && MILESTONE_STATUSES.includes(status) ? status : "not_started",
    duration: asString(raw.duration),
    due: asString(raw.due),
    deliverables: asString(raw.deliverables),
    links: Array.isArray(raw.links) ? raw.links.map(String) : [],
    reviewer: asString(raw.reviewer),
    approved_date: asString(raw.approved_date),
    payout_requested_date: asString(raw.payout_requested_date),
    paid_date: asString(raw.paid_date),
    notes: asString(raw.notes),
  };
}

// "4-6 days" → 6, "3 weeks" → 21, "5 weeks (sequential after M3)" → 35.
// Uses the upper bound of a range; null when no duration is parseable.
function durationDays(s?: string): number | null {
  if (!s) return null;
  const m = s.match(/(\d+)(?:\s*(?:-|–|to)\s*(\d+))?\s*(day|week|month)/i);
  if (!m) return null;
  const n = Number(m[2] ?? m[1]);
  const unit = m[3].toLowerCase();
  return unit.startsWith("day") ? n : unit.startsWith("week") ? n * 7 : n * 30;
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Fills expected_due on each milestone: an explicit `due` wins; otherwise
// milestones are assumed sequential from start_date, each taking the upper
// bound of its duration estimate. Estimation stops at the first milestone
// with neither a due date nor a parseable duration.
function scheduleMilestones(milestones: Milestone[], startDate?: string): void {
  let acc = 0;
  let canEstimate = Boolean(startDate);
  for (const m of milestones) {
    const days = durationDays(m.duration);
    if (m.due) {
      m.expected_due = m.due;
    } else if (canEstimate && days !== null) {
      m.expected_due = addDays(startDate!, acc + days);
      m.due_estimated = true;
    }
    if (days === null) canEstimate = false;
    else acc += days;
  }
}

const FINISHED_OR_HANDED_OFF = ["approved", "payout_requested", "paid"];

function isOverdue(m: Milestone, today: string): boolean {
  if (!m.expected_due) return false;
  if (FINISHED_OR_HANDED_OFF.includes(m.status)) return false;
  return m.expected_due < today;
}

function daysBetween(fromIso: string, toIso: string): number {
  return Math.round(
    (new Date(`${toIso}T00:00:00Z`).getTime() -
      new Date(`${fromIso}T00:00:00Z`).getTime()) /
      86_400_000,
  );
}

function deriveOverall(milestones: Milestone[], today: string): OverallStatus {
  if (milestones.length > 0 && milestones.every((m) => m.status === "paid"))
    return "completed";
  if (milestones.some((m) => m.status === "blocked")) return "blocked";
  if (milestones.some((m) => isOverdue(m, today))) return "overdue";
  if (milestones.some((m) => m.status === "delivered" || m.status === "in_review"))
    return "needs_review";
  if (milestones.some((m) => m.status === "approved" || m.status === "payout_requested"))
    return "needs_payout";
  return "on_track";
}

export function loadTrackedProposals(): TrackedProposal[] {
  if (!fs.existsSync(DATA_DIR)) return [];
  const today = new Date().toISOString().slice(0, 10);

  const proposals = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      const { data, content } = matter(
        fs.readFileSync(path.join(DATA_DIR, file), "utf8"),
      );
      const milestones = (Array.isArray(data.milestones) ? data.milestones : []).map(
        (m: Record<string, unknown>, i: number) => parseMilestone(m, i),
      );
      scheduleMilestones(milestones, asString(data.start_date));
      for (const m of milestones) {
        if (isOverdue(m, today)) {
          m.late_days = daysBetween(m.expected_due!, today);
        }
      }

      const paid = milestones.filter((m) => m.status === "paid");
      const approvedOrLater = milestones.filter((m) =>
        ["approved", "payout_requested", "paid"].includes(m.status),
      );
      const pendingDues = milestones
        .filter((m) => m.status !== "paid" && m.expected_due)
        .map((m) => m.expected_due as string)
        .sort();

      // Finish date is only estimable when every milestone has a due date
      const targetDate = asString(data.target_date);
      const allDues = milestones
        .map((m) => m.expected_due)
        .filter((d): d is string => Boolean(d));
      const estimatedFinish =
        targetDate ??
        (milestones.length > 0 && allDues.length === milestones.length
          ? allDues.reduce((a, b) => (a > b ? a : b))
          : undefined);

      const proposalIssue =
        data.proposal_issue !== undefined ? Number(data.proposal_issue) : undefined;

      const proposal: TrackedProposal = {
        slug,
        rfp: asString(data.rfp) ?? slug.toUpperCase(),
        title: asString(data.title) ?? slug,
        team: asString(data.team) ?? "Unknown team",
        contact: asString(data.contact),
        proposal_issue: proposalIssue,
        proposal_url: proposalIssue
          ? `https://github.com/${RFP_REPO}/issues/${proposalIssue}`
          : undefined,
        delivery_repo: asString(data.delivery_repo),
        accepted_date: asString(data.accepted_date),
        start_date: asString(data.start_date),
        target_date: asString(data.target_date),
        total_budget:
          data.total_budget !== undefined
            ? Number(data.total_budget)
            : milestones.reduce((s, m) => s + m.payout, 0),
        milestones,
        notes: content.trim(),
        paid_amount: paid.reduce((s, m) => s + m.payout, 0),
        approved_amount: approvedOrLater.reduce((s, m) => s + m.payout, 0),
        paid_count: paid.length,
        overall: deriveOverall(milestones, today),
        next_due: pendingDues[0],
        estimated_finish: estimatedFinish,
        finish_estimated: estimatedFinish ? !targetDate : undefined,
        overdue: milestones.some((m) => isOverdue(m, today)),
      };
      return proposal;
    });

  return proposals.sort((a, b) => a.rfp.localeCompare(b.rfp));
}

export function milestoneIsOverdue(m: Milestone): boolean {
  return isOverdue(m, new Date().toISOString().slice(0, 10));
}
