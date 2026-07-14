// The public repo where proposals are submitted. Its proposal issues also
// host all milestone discussion and engineering approvals — the dashboard's
// review box posts comments there.
export const RFP_REPO = "logos-co/rfp";

// Where dashboard-submitted community feedback lands, as issues labeled
// `feedback` — this app's own repo. The board additionally shows
// feedback-labeled issues from the whole org.
export const FEEDBACK_REPO =
  process.env.NEXT_PUBLIC_FEEDBACK_REPO ?? "logos-co/devrel-station";

export const FEEDBACK_ORG = "logos-co";
export const FEEDBACK_LABEL = "feedback";
