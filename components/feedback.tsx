import { useState } from "react";
import { useGitHubUser } from "@/components/github";
import { FEEDBACK_LABEL, FEEDBACK_REPO } from "@/lib/config";
import { createFeedbackIssue } from "@/lib/githubClient";
import type { FeedbackIssue } from "@/lib/types";

const NEW_ISSUE_URL = `https://github.com/${FEEDBACK_REPO}/issues/new?labels=${FEEDBACK_LABEL}`;

export function FeedbackComposer({
  onAdded,
}: {
  onAdded: (issue: FeedbackIssue) => void;
}) {
  const user = useGitHubUser();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <p className="text-sm text-ink-muted">
        Connect GitHub (top right) to add feedback from here, or{" "}
        <a
          href={NEW_ISSUE_URL}
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:underline"
        >
          open an issue in {FEEDBACK_REPO} ↗
        </a>
        .
      </p>
    );
  }

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const issue = await createFeedbackIssue(title.trim(), body.trim());
      setTitle("");
      setBody("");
      onAdded(issue);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card px-5 py-4">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What did the community say?"
        className="w-full rounded-lg border border-hairline bg-page px-3 py-2 text-sm"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Details — quotes, links, who said it, where"
        className="mt-2 w-full rounded-lg border border-hairline bg-page px-3 py-2 text-sm"
      />
      <div className="mt-2 flex items-center justify-end gap-3">
        {error && (
          <span className="text-xs" style={{ color: "var(--badge-critical-fg)" }}>
            {error}
          </span>
        )}
        <span className="text-xs text-ink-muted">→ {FEEDBACK_REPO}</span>
        <button
          onClick={submit}
          disabled={busy || !title.trim()}
          className="rounded-full bg-ink px-4 py-1.5 text-xs font-medium text-page disabled:opacity-50"
        >
          {busy ? "Filing…" : "Add feedback"}
        </button>
      </div>
    </div>
  );
}
