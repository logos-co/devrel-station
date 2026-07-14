import Link from "next/link";
import { useState } from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import Layout from "@/components/Layout";
import { ReviewComposer, useGitHubUser } from "@/components/github";
import { Meter, MilestoneBadge, OverallBadge } from "@/components/ui";
import { loadTrackedProposals } from "@/lib/tracking";
import { fetchMilestoneReviews } from "@/lib/github";
import { RFP_REPO } from "@/lib/config";
import { formatDate, formatUsd } from "@/lib/status";
import type { Milestone, MilestoneReview, TrackedProposal } from "@/lib/types";

function ReviewCard({ r }: { r: MilestoneReview }) {
  const long = r.body.length > 500;
  const body = (
    <div className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink-secondary">
      {r.body}
    </div>
  );
  return (
    <li className="rounded-lg bg-inset px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
        <span className="font-medium text-ink">{r.author}</span>
        {r.is_member && <span className="badge badge-progress">logos-co</span>}
        {r.verdict === "approved" && (
          <span className="badge badge-good">Approved</span>
        )}
        {r.verdict === "changes_requested" && (
          <span className="badge badge-attention">Changes requested</span>
        )}
        <span>{formatDate(r.created_at)}</span>
        <a
          href={r.url}
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:underline"
        >
          view on GitHub ↗
        </a>
      </div>
      {long ? (
        <details>
          <summary className="mt-1 cursor-pointer text-sm text-ink-secondary">
            {r.body.slice(0, 200).trimEnd()}… <span className="text-accent">show full review</span>
          </summary>
          {body}
        </details>
      ) : (
        body
      )}
    </li>
  );
}

function MilestoneCard({
  m,
  reviews,
  discussion,
  onReviewPosted,
}: {
  m: Milestone;
  reviews: MilestoneReview[];
  discussion: { repo: string; issue: number; url: string } | null;
  onReviewPosted: (review: MilestoneReview) => void;
}) {
  const user = useGitHubUser();
  const expectsReview = m.status === "delivered" || m.status === "in_review";
  const canCompose = Boolean(user && discussion);
  return (
    <li className="card px-6 py-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-mono text-sm text-ink-muted">{m.id}</span>
        <h3 className="min-w-0 flex-1 font-ui text-[17px] font-semibold">{m.title}</h3>
        {m.late_days ? (
          <span className="badge badge-critical">{m.late_days}d late</span>
        ) : null}
        <MilestoneBadge status={m.status} />
        <span className="text-sm font-medium tabular-nums">
          {formatUsd(m.payout)}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-muted">
        {m.duration && <span>Estimate: {m.duration}</span>}
        {m.expected_due && (
          <span>
            {m.due_estimated ? "Est. due" : "Due"}: {formatDate(m.expected_due)}
          </span>
        )}
        {m.reviewer && <span>Reviewer: {m.reviewer}</span>}
        {m.approved_date && <span>Approved: {formatDate(m.approved_date)}</span>}
        {m.payout_requested_date && (
          <span>Payout requested: {formatDate(m.payout_requested_date)}</span>
        )}
        {m.paid_date && <span>Paid: {formatDate(m.paid_date)}</span>}
      </div>

      {m.deliverables && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs uppercase tracking-widest text-ink-muted hover:text-ink">
            Deliverables
          </summary>
          <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
            {m.deliverables}
          </p>
        </details>
      )}

      {m.links.length > 0 && (
        <ul className="mt-3 space-y-1">
          {m.links.map((link) => (
            <li key={link}>
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="break-all text-sm text-accent hover:underline"
              >
                {link} ↗
              </a>
            </li>
          ))}
        </ul>
      )}

      {m.notes && (
        <p className="mt-3 rounded-lg bg-inset px-3 py-2 text-sm text-ink-secondary">
          {m.notes}
        </p>
      )}

      {(reviews.length > 0 || expectsReview || canCompose) && (
        <div className="mt-4 border-t border-hairline pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-ink-muted">
            Discussion{reviews.length > 0 && ` (${reviews.length})`}
          </h4>
          {reviews.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {reviews.map((r) => (
                <ReviewCard key={r.url} r={r} />
              ))}
            </ul>
          ) : canCompose ? null : (
            <p className="mt-2 text-sm text-ink-muted">
              No discussion yet. Connect GitHub (top right) to comment from
              here, or{" "}
              {discussion ? (
                <a
                  href={discussion.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:underline"
                >
                  comment on the proposal issue ↗
                </a>
              ) : (
                "comment on the proposal issue"
              )}{" "}
              starting with{" "}
              <code className="rounded bg-inset px-1 font-mono text-xs">
                {m.id}:
              </code>
              .
            </p>
          )}
          {canCompose && (
            <ReviewComposer
              repo={discussion!.repo}
              issue={discussion!.issue}
              milestoneId={m.id}
              onPosted={onReviewPosted}
            />
          )}
        </div>
      )}
    </li>
  );
}

export default function RfpDetail({
  proposal,
  reviews,
}: {
  proposal: TrackedProposal;
  reviews: MilestoneReview[] | null;
}) {
  const p = proposal;
  // Reviews posted from this page appear immediately, ahead of the next ISR pass
  const [posted, setPosted] = useState<MilestoneReview[]>([]);
  const reviewsFor = (id: string) =>
    [...(reviews ?? []), ...posted].filter(
      (r) => r.milestone.toUpperCase() === id.toUpperCase(),
    );
  // Discussion and approvals live on the proposal issue in logos-co/rfp
  const discussion = p.proposal_issue
    ? { repo: RFP_REPO, issue: p.proposal_issue, url: p.proposal_url! }
    : null;
  return (
    <Layout title={`${p.rfp} — ${p.title}`}>
      <Link href="/rfps" className="text-sm text-ink-muted hover:text-ink">
        ← All RFP deliveries
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-4xl">
          {p.rfp} — {p.title}
        </h1>
        <OverallBadge status={p.overall} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3 lg:grid-cols-5">
        <div>
          <dt className="text-xs text-ink-muted">Team</dt>
          <dd className="mt-0.5 font-medium">{p.team}</dd>
        </div>
        {p.contact && (
          <div>
            <dt className="text-xs text-ink-muted">Contact</dt>
            <dd className="mt-0.5">{p.contact}</dd>
          </div>
        )}
        <div>
          <dt className="text-xs text-ink-muted">Accepted</dt>
          <dd className="mt-0.5 tabular-nums">{formatDate(p.accepted_date)}</dd>
        </div>
        {p.start_date && (
          <div>
            <dt className="text-xs text-ink-muted">Started</dt>
            <dd className="mt-0.5 tabular-nums">{formatDate(p.start_date)}</dd>
          </div>
        )}
        {p.estimated_finish && (
          <div>
            <dt className="text-xs text-ink-muted">
              {p.finish_estimated ? "Est. finish" : "Target finish"}
            </dt>
            <dd className="mt-0.5 tabular-nums">
              {formatDate(p.estimated_finish)}
            </dd>
          </div>
        )}
        {p.target_date && (
          <div>
            <dt className="text-xs text-ink-muted">Target delivery</dt>
            <dd className="mt-0.5 tabular-nums">{formatDate(p.target_date)}</dd>
          </div>
        )}
        <div>
          <dt className="text-xs text-ink-muted">Links</dt>
          <dd className="mt-0.5 space-x-3">
            {p.proposal_url && (
              <a
                href={p.proposal_url}
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline"
              >
                Proposal #{p.proposal_issue} ↗
              </a>
            )}
            {p.delivery_repo && (
              <a
                href={p.delivery_repo}
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline"
              >
                Delivery repo ↗
              </a>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Budget paid</dt>
          <dd className="mt-0.5">
            <span className="tabular-nums">
              {formatUsd(p.paid_amount)} / {formatUsd(p.total_budget)}
            </span>
            <div className="mt-1.5 max-w-40">
              <Meter value={p.paid_amount} max={p.total_budget} />
            </div>
          </dd>
        </div>
      </dl>

      <section className="mt-8">
        <h2 className="text-lg font-semibold tracking-tight">
          Milestones ({p.paid_count}/{p.milestones.length} paid)
        </h2>
        {reviews === null && p.proposal_url && (
          <p className="mt-2 text-xs text-ink-muted">
            Couldn&apos;t fetch reviews from GitHub just now — they&apos;ll
            reappear on the next refresh.
          </p>
        )}
        <ul className="mt-3 space-y-3">
          {p.milestones.map((m) => (
            <MilestoneCard
              key={m.id}
              m={m}
              reviews={reviewsFor(m.id)}
              discussion={discussion}
              onReviewPosted={(r) => setPosted((prev) => [...prev, r])}
            />
          ))}
        </ul>
      </section>

      {p.notes && (
        <details className="mt-8">
          <summary className="cursor-pointer text-xs uppercase tracking-widest text-ink-muted hover:text-ink">
            Notes
          </summary>
          <div className="card mt-3 whitespace-pre-wrap px-6 py-5 text-sm leading-relaxed text-ink-secondary">
            {p.notes}
          </div>
        </details>
      )}
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: loadTrackedProposals().map((p) => ({ params: { slug: p.slug } })),
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const proposal = loadTrackedProposals().find((p) => p.slug === params?.slug);
  if (!proposal) return { notFound: true, revalidate: 60 };
  const reviews = proposal.proposal_issue
    ? await fetchMilestoneReviews(RFP_REPO, proposal.proposal_issue)
    : [];
  return {
    props: { proposal: JSON.parse(JSON.stringify(proposal)), reviews },
    revalidate: 60,
  };
};
