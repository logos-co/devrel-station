import Link from "next/link";
import type { GetStaticProps } from "next";
import Layout from "@/components/Layout";
import { Meter } from "@/components/ui";
import { loadTrackedProposals } from "@/lib/tracking";
import { loadContentCollections } from "@/lib/content";
import { fetchFeedbackIssues } from "@/lib/github";
import { formatUsd } from "@/lib/status";

interface HomeProps {
  rfps: { active: number; needsAction: number; paid: number; committed: number };
  content: { collections: number; resources: number };
  feedback: { open: number; unanswered: number };
}

export default function Home({ rfps, content, feedback }: HomeProps) {
  return (
    <Layout title="Home">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Link
          href="/rfps"
          className="card card-blue block px-6 py-6 transition-opacity hover:opacity-90"
        >
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl">RFPs</h2>
            {rfps.needsAction > 0 ? (
              <span className="badge badge-attention">
                {rfps.needsAction} need{rfps.needsAction === 1 ? "s" : ""} action
              </span>
            ) : (
              <span className="badge badge-good">all clear</span>
            )}
          </div>
          <div className="mt-6 font-display text-5xl leading-none">
            {rfps.active}
          </div>
          <div className="mt-3 text-[11px] uppercase tracking-widest text-ink-secondary">
            active deliveries
          </div>
          <div className="mt-5 text-xs text-ink-muted">
            {formatUsd(rfps.paid)} of {formatUsd(rfps.committed)} paid out
          </div>
          <div className="mt-1.5">
            <Meter value={rfps.paid} max={rfps.committed} />
          </div>
        </Link>

        <Link
          href="/content-factory"
          className="card card-tan block px-6 py-6 transition-opacity hover:opacity-90"
        >
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl">Content Factory</h2>
            <span className="badge badge-neutral">
              {content.collections} collection{content.collections === 1 ? "" : "s"}
            </span>
          </div>
          <div className="mt-6 font-display text-5xl leading-none">
            {content.resources}
          </div>
          <div className="mt-3 text-[11px] uppercase tracking-widest text-ink-secondary">
            published resources
          </div>
        </Link>

        <Link
          href="/feedback"
          className="card card-grey block px-6 py-6 transition-opacity hover:opacity-90"
        >
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl">Feedback</h2>
            {feedback.unanswered > 0 ? (
              <span className="badge badge-attention">
                {feedback.unanswered} unanswered
              </span>
            ) : (
              <span className="badge badge-good">all clear</span>
            )}
          </div>
          <div className="mt-6 font-display text-5xl leading-none">
            {feedback.open}
          </div>
          <div className="mt-3 text-[11px] uppercase tracking-widest text-ink-secondary">
            open items
          </div>
        </Link>
      </div>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const proposals = loadTrackedProposals();
  const milestones = proposals.flatMap((p) => p.milestones);
  const collections = loadContentCollections();
  const feedback = (await fetchFeedbackIssues()) ?? [];
  const openFeedback = feedback.filter((i) => i.state === "open");
  const props: HomeProps = {
    rfps: {
      active: proposals.filter((p) => p.overall !== "completed").length,
      needsAction: milestones.filter((m) =>
        [
          "delivered",
          "in_review",
          "approved",
          "payout_requested",
          "blocked",
        ].includes(m.status),
      ).length,
      paid: proposals.reduce((s, p) => s + p.paid_amount, 0),
      committed: proposals.reduce((s, p) => s + p.total_budget, 0),
    },
    content: {
      collections: collections.length,
      resources: collections.reduce((s, c) => s + c.items.length, 0),
    },
    feedback: {
      open: openFeedback.length,
      unanswered: openFeedback.filter((i) => i.comments === 0).length,
    },
  };
  return { props, revalidate: 300 };
};
