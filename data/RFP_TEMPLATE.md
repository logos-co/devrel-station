# Tracking file template

When a proposal is **accepted**, copy the template below into
`data/rfps/<rfp-id>-<short-name>.md` (e.g. `data/rfps/RFP-003-atomic-swaps.md`)
and fill it in. The dashboard reads every `.md` file in `data/rfps/`
(files starting with `_` are ignored).

The **frontmatter is the source of truth** for delivery tracking — proposal
issues on GitHub are inconsistent, so we normalise milestones here once at
acceptance time. The markdown body below the frontmatter is free-form notes
(context, decisions, meeting notes) and is shown on the detail page.

## Milestone status — the workflow

Update the `status` field of a milestone as it moves through the process:

| status | meaning | who acts next |
|---|---|---|
| `not_started` | work hasn't begun | applicant |
| `in_progress` | applicant is working | applicant |
| `delivered` | deliverables submitted | **engineering** (start review) |
| `in_review` | engineering is reviewing | **engineering** (approve/feedback) |
| `approved` | engineering approved | **DevRel** (request payout from finance) |
| `payout_requested` | finance has been asked to pay | **finance** |
| `paid` | payout completed | — done |
| `blocked` | progress blocked (explain in `notes`) | DevRel to unblock |

Dates are `YYYY-MM-DD`. Money is USD, plain numbers (no `$` or commas).
Everything except `id`, `title`, `payout`, `status` is optional — leave a field
blank or delete it if unknown.

## Late detection

If `start_date` is set, the dashboard estimates each milestone's due date by
walking milestones in order and adding the **upper bound** of each `duration`
("4-6 days" → 6 days, "3 weeks" → 21 days), assuming sequential delivery. An
explicit `due` on a milestone always overrides the estimate (use it when the
real schedule overlaps milestones or was agreed with the applicant). A
milestone past its (estimated or explicit) due date that isn't yet approved
or paid shows an "Nd late" flag and marks the whole delivery Overdue.

## Engineering reviews & discussion

Milestone discussion lives **as comments on the proposal issue in
logos-co/rfp** (`proposal_issue` above) — the same thread where the proposal
was submitted. No separate tracking repo.

There are two ways to comment — both produce the same GitHub comment:

- **From the dashboard**: connect GitHub (top right, fine-grained token scoped
  to logos-co/rfp with Issues read/write) and use the review box on any
  milestone — **Approve**, **Request changes**, or plain **Comment**.
- **From GitHub**: comment on the proposal issue directly.

The first line of the comment determines how the dashboard reads it:

| first line starts with | shown as |
|---|---|
| `M2: <text>` | discussion comment (anyone can join) |
| `Review M2: <notes>` | review comment |
| `Review M2 — Approved` (+ optional `: notes`) | **Approved** verdict badge |
| `Review M2 — Changes requested: <notes>` | **Changes requested** verdict badge |

Each milestone shows its comments as a chronological discussion thread.
Commenters who are logos-co organization members get a `logos-co` badge
(from GitHub's author association), so team voices are distinguishable from
external ones.

Comments refresh on the detail page every minute. The comment on GitHub is the
canonical record; when engineering posts an Approved verdict, update the
milestone's `status` to `approved` here and fill `reviewer` / `approved_date`
— that is what moves it into the payout flow.

---

```markdown
---
rfp: RFP-0XX
title: Project name from the proposal
team: Team or applicant name
contact: handle (Discord), handle (Signal)
proposal_issue: 123            # issue number in logos-co/rfp (proposal + discussion)
delivery_repo: https://github.com/team/repo   # where the work lands (optional)
accepted_date: 2026-01-01
start_date: 2026-01-06
target_date: 2026-03-01        # overall expected delivery (optional)
total_budget: 10000            # omit to auto-sum milestone payouts
milestones:
  - id: M1
    title: Short milestone title
    payout: 2500
    duration: 1-2 weeks        # estimate from the proposal (optional)
    due: 2026-01-20            # agreed due date (optional but recommended)
    status: in_progress
    deliverables: >
      One-paragraph summary of what "done" means for this milestone,
      taken from the proposal's completion criteria.
    links:                     # PRs / repos / docs submitted for review
      - https://github.com/logos-co/spel/pull/123
    reviewer:                  # engineering reviewer, once assigned
    approved_date:
    payout_requested_date:
    paid_date:
    notes:
  - id: M2
    title: Second milestone
    payout: 5000
    status: not_started
---

Free-form notes about this engagement: review feedback threads, scope-change
decisions, anything colleagues need for context.
```
