// The public repo where proposals are submitted (read-only for the dashboard).
export const RFP_REPO = "logos-co/rfp";

// The repo whose issues host milestone discussion threads — one issue per
// accepted RFP, referenced by `tracking_issue` in data/rfps/*.md frontmatter.
// Kept separate from RFP_REPO so proposal threads stay noise-free.
export const TRACKING_REPO =
  process.env.NEXT_PUBLIC_TRACKING_REPO ?? "logos-co/rfp-tracking";

// Where dashboard-submitted community feedback lands, as issues labeled
// `feedback` — this app's own repo. The board additionally shows
// feedback-labeled issues from the whole org.
export const FEEDBACK_REPO =
  process.env.NEXT_PUBLIC_FEEDBACK_REPO ?? "logos-co/devrel-station";

export const FEEDBACK_ORG = "logos-co";
export const FEEDBACK_LABEL = "feedback";
