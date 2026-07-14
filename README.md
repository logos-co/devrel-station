# DevRel Station

The developer relations hub for Logos. Home (`/`) is the station overview;
each DevRel responsibility gets its own tab, added one at a time. Live today:

- **RFPs (`/rfps`)** — delivery tracking for accepted
  [logos-co/rfp](https://github.com/logos-co/rfp) proposals: milestone
  progress, engineering reviews, and finance payouts.
- **Content Factory (`/content-factory`)** — collections of published
  resources (e.g. a tutorial series on X), one markdown file per collection
  listing its links. See
  [`data/CONTENT_FACTORY_TEMPLATE.md`](data/CONTENT_FACTORY_TEMPLATE.md).
- **Feedback (`/feedback`)** — every GitHub issue labeled `feedback` across
  the logos-co org, fetched live. The on-page form (needs the Connect GitHub
  token, scoped to include this repo) files new feedback as a
  `feedback`-labeled issue in **this repository** (default
  `logos-co/devrel-station`, override with `NEXT_PUBLIC_FEEDBACK_REPO`) — the
  station gathers its own feedback. Triage happens on GitHub — comment,
  relabel, close; the issue is the record.

Every area follows the same pattern: **one markdown file per tracked item**
in `data/<area>/`, with structured YAML frontmatter the dashboard reads.
Editing a status field updates the boards; git history is the audit trail.

```bash
npm install
npm run dev     # http://localhost:3000
```

Optionally set `GITHUB_TOKEN` in the environment to raise the GitHub API rate
limit (everything works unauthenticated too).

## RFP tracking — how it works

There are two data sources:

1. **`data/rfps/*.md` — the source of truth for delivery tracking.**
   One file per *accepted* proposal, with structured milestones in YAML
   frontmatter. Proposal issues on GitHub are free-form and inconsistent, so we
   normalise each accepted proposal into this format once, at acceptance time.
   See [`data/RFP_TEMPLATE.md`](data/RFP_TEMPLATE.md) for the template and the status
   workflow.
2. **The GitHub API — engineering reviews, fetched live.** Any comment on the
   proposal issue whose first line starts with `Review M1:` (or `M1 review:`)
   is pulled in and shown under that milestone, refreshed every minute.

### Pages

- **RFPs board (`/rfps`)** — stat tiles (active deliveries, milestones awaiting
  engineering review, approved-but-unpaid amounts, paid vs committed), an
  **Action needed** queue showing exactly who each item is waiting on
  (engineering / DevRel / finance), and a table of all tracked deliveries.
- **Delivery detail (`/rfps/<slug>`)** — per-milestone timeline with the
  workflow strip (in progress → delivered → in review → approved → payout
  requested → paid), payout amounts, engineering reviews, dates, and notes.

### Reviewing from the dashboard (engineering)

Every milestone has a **discussion thread**: all comments on the delivery's
**proposal issue in logos-co/rfp** whose first line references the milestone
(`M1: …`, `Review M1: …`, `Review M1 — Approved`,
`Review M1 — Changes requested: …`), shown chronologically. Commenters who
are logos-co org members get a `logos-co` badge, so team voices are
distinguishable from external ones. There is no separate tracking repo —
the proposal thread is the record, reviews included.

To take part without leaving the dashboard, click **Connect GitHub** (top
right) and paste a
[fine-grained personal access token](https://github.com/settings/personal-access-tokens/new)
scoped to **only `logos-co/rfp`** with **Issues: Read & write**. Each
milestone then gets a compose box with three actions: **Approve**, **Request
changes**, or plain **Comment**. Each posts an ordinary comment on the
proposal issue under your own GitHub account and appears in the thread
immediately. No database — the GitHub comment is the record.

The token is stored only in your browser's localStorage and is sent only to
`api.github.com` — the dashboard has no backend and never sees it. Use a short
expiry and revoke it any time; `disconnect` removes it from the browser.

### The workflow (who does what)

| milestone status | meaning | next step is on |
|---|---|---|
| `not_started` / `in_progress` | applicant working | applicant |
| `delivered` | deliverables submitted | engineering — start review |
| `in_review` | review running | engineering — approve / feedback |
| `approved` | engineering signed off | DevRel — request payout from finance |
| `payout_requested` | finance asked to pay | finance |
| `paid` | payout done | — |
| `blocked` | stuck (explain in `notes`) | DevRel |

Day-to-day, tracking an engagement means editing one YAML field: when
engineering approves M2, change its `status: in_review` to `approved` (and fill
`approved_date`); the board's action queue then reminds you to ask finance.

### Adding a new delivery

1. A proposal gets the `accepted` label in logos-co/rfp.
2. Copy the template from `data/RFP_TEMPLATE.md` into
   `data/rfps/RFP-0XX-short-name.md`.
3. Transcribe the milestones from the proposal (title, payout, completion
   criteria), agree due dates with the applicant, and fill them in.
4. Commit. The file is the audit trail — status changes are git history.

## Adding a new station area

Follow the existing pattern: a `data/<area>/` directory + `*_TEMPLATE.md`, a
loader in `lib/<area>.ts`, a page under `pages/<area>/`, an entry in `NAV` in
`components/Layout.tsx`, and a summary card in `pages/index.tsx`.
