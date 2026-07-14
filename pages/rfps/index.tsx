import Link from "next/link";
import type { GetStaticProps } from "next";
import Layout from "@/components/Layout";
import { Meter, OverallBadge, StatTile } from "@/components/ui";
import { loadTrackedProposals } from "@/lib/tracking";
import { formatDate, formatUsd } from "@/lib/status";
import type { TrackedProposal } from "@/lib/types";

export default function RfpsBoard({
  proposals,
}: {
  proposals: TrackedProposal[];
}) {
  const active = proposals.filter((p) => p.overall !== "completed");
  const committed = proposals.reduce((s, p) => s + p.total_budget, 0);
  const paid = proposals.reduce((s, p) => s + p.paid_amount, 0);
  const allMilestones = proposals.flatMap((p) => p.milestones);
  const awaitingReview = allMilestones.filter(
    (m) => m.status === "delivered" || m.status === "in_review",
  ).length;
  const awaitingPayout = allMilestones.filter(
    (m) => m.status === "approved" || m.status === "payout_requested",
  );

  return (
    <Layout title="RFPs">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-4xl">
          Accepted RFP deliveries
        </h1>
        <a
          href="https://github.com/logos-co/rfp/issues?q=is%3Aissue+label%3Aproposal"
          target="_blank"
          rel="noreferrer"
          className="text-xs uppercase tracking-widest text-ink-muted hover:text-ink"
        >
          Browse proposals on GitHub ↗
        </a>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Active deliveries" value={String(active.length)} variant="blue" />
        <StatTile
          label="Awaiting engineering review"
          value={String(awaitingReview)}
          variant="tan"
        />
        <StatTile
          label="Awaiting payout"
          value={String(awaitingPayout.length)}
          variant="dark"
          detail={
            awaitingPayout.length
              ? formatUsd(awaitingPayout.reduce((s, m) => s + m.payout, 0))
              : undefined
          }
        />
        <StatTile
          label="Paid out"
          value={formatUsd(paid)}
          variant="grey"
          detail={`of ${formatUsd(committed)} committed`}
          meter={{ value: paid, max: committed }}
        />
      </div>

      <div className="mt-8">
        {proposals.length === 0 ? (
          <p className="text-sm text-ink-secondary">
            No tracked deliveries yet. Copy <code>data/RFP_TEMPLATE.md</code> into{" "}
            <code>data/rfps/</code> when a proposal is accepted.
          </p>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-hairline text-left text-[11px] uppercase tracking-widest text-ink-muted">
                  <th className="px-5 py-3 font-medium">Project</th>
                  <th className="px-3 py-3 font-medium">Team</th>
                  <th className="px-3 py-3 font-medium">Paid</th>
                  <th className="px-3 py-3 font-medium">Budget</th>
                  <th className="px-3 py-3 font-medium">Next due</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((p) => (
                  <tr
                    key={p.slug}
                    className="border-b border-hairline last:border-b-0"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/rfps/${p.slug}`}
                        className="font-ui text-[15px] font-medium hover:underline"
                      >
                        {p.rfp} — {p.title}
                      </Link>
                    </td>
                    <td className="px-3 py-4 text-ink-secondary">{p.team}</td>
                    <td className="px-3 py-4 tabular-nums text-ink-secondary">
                      {p.paid_count}/{p.milestones.length}
                    </td>
                    <td className="px-3 py-4">
                      <div className="w-28">
                        <Meter value={p.paid_amount} max={p.total_budget} />
                      </div>
                      <div className="mt-1.5 text-xs tabular-nums text-ink-muted">
                        {formatUsd(p.paid_amount)} / {formatUsd(p.total_budget)}
                      </div>
                    </td>
                    <td className="px-3 py-4 tabular-nums text-ink-secondary">
                      {formatDate(p.next_due)}
                    </td>
                    <td className="px-5 py-4">
                      <OverallBadge status={p.overall} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  // JSON round-trip drops `undefined` optional fields, which Next.js props forbid
  const proposals = JSON.parse(JSON.stringify(loadTrackedProposals()));
  return { props: { proposals }, revalidate: 300 };
};
