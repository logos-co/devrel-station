import { useState } from "react";
import type { GetStaticProps } from "next";
import Layout from "@/components/Layout";
import { FeedbackComposer } from "@/components/feedback";
import { StatTile } from "@/components/ui";
import { fetchFeedbackIssues } from "@/lib/github";
import { FEEDBACK_LABEL, FEEDBACK_ORG } from "@/lib/config";
import { formatDate } from "@/lib/status";
import type { FeedbackIssue } from "@/lib/types";

const BROWSE_URL = `https://github.com/search?q=${encodeURIComponent(
  `org:${FEEDBACK_ORG} is:issue label:${FEEDBACK_LABEL}`,
)}&type=issues`;

function IssueCard({ issue }: { issue: FeedbackIssue }) {
  const i = issue;
  const long = i.body.length > 300;
  return (
    <li className="card px-5 py-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
        {i.state === "open" ? (
          <span className="badge badge-progress">Open</span>
        ) : (
          <span className="badge badge-good">Closed</span>
        )}
        {i.labels.map((l) => (
          <span key={l} className="badge badge-neutral">
            {l}
          </span>
        ))}
        <span className="font-medium text-ink">{i.author}</span>
        <span className="tabular-nums">{formatDate(i.created_at)}</span>
        {i.comments > 0 && (
          <span>
            {i.comments} comment{i.comments === 1 ? "" : "s"}
          </span>
        )}
      </div>
      <a
        href={i.url}
        target="_blank"
        rel="noreferrer"
        className="mt-1.5 block font-ui text-[15px] font-medium hover:underline"
      >
        {i.title}{" "}
        <span className="font-normal text-ink-muted">
          {i.repo.split("/")[1]}#{i.number} ↗
        </span>
      </a>
      {i.body &&
        (long ? (
          <details>
            <summary className="mt-1 cursor-pointer text-sm text-ink-secondary">
              {i.body.slice(0, 200).trimEnd()}…{" "}
              <span className="text-accent">show all</span>
            </summary>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink-secondary">
              {i.body}
            </p>
          </details>
        ) : (
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink-secondary">
            {i.body}
          </p>
        ))}
    </li>
  );
}

export default function FeedbackBoard({
  issues,
}: {
  issues: FeedbackIssue[] | null;
}) {
  // Issues filed from this page appear immediately, ahead of the next ISR pass
  const [posted, setPosted] = useState<FeedbackIssue[]>([]);
  const all = [...posted, ...(issues ?? [])];
  const open = all.filter((i) => i.state === "open");
  const closed = all.filter((i) => i.state === "closed");
  const unanswered = open.filter((i) => i.comments === 0).length;

  return (
    <Layout title="Feedback">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-4xl">Community feedback</h1>
        <a
          href={BROWSE_URL}
          target="_blank"
          rel="noreferrer"
          className="text-xs uppercase tracking-widest text-ink-muted hover:text-ink"
        >
          Browse on GitHub ↗
        </a>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Open" value={String(open.length)} variant="blue" />
        <StatTile label="Unanswered" value={String(unanswered)} variant="tan" />
        <StatTile label="Closed" value={String(closed.length)} variant="grey" />
      </div>

      <div className="mt-6">
        <FeedbackComposer onAdded={(i) => setPosted((prev) => [i, ...prev])} />
      </div>

      {issues === null && (
        <p className="mt-6 text-sm text-ink-muted">
          Couldn&apos;t fetch issues from GitHub just now — they&apos;ll
          reappear on the next refresh.
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {open.map((i) => (
          <IssueCard key={i.url} issue={i} />
        ))}
      </ul>

      {closed.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-xs uppercase tracking-widest text-ink-muted hover:text-ink">
            Closed ({closed.length})
          </summary>
          <ul className="mt-3 space-y-3">
            {closed.map((i) => (
              <IssueCard key={i.url} issue={i} />
            ))}
          </ul>
        </details>
      )}
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const issues = await fetchFeedbackIssues();
  return { props: { issues }, revalidate: 60 };
};
