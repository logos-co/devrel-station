import { useEffect, useState } from "react";
import {
  fetchViewer,
  getStoredToken,
  postReviewComment,
  storeToken,
  TOKEN_EVENT,
  type ReviewVerdict,
} from "@/lib/githubClient";
import { FEEDBACK_REPO, RFP_REPO } from "@/lib/config";
import type { MilestoneReview } from "@/lib/types";

// Resolves to the connected GitHub user, or null. Re-checks whenever the
// stored token changes (connect/disconnect in any component).
export function useGitHubUser(): { login: string } | null {
  const [user, setUser] = useState<{ login: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    const sync = () => {
      if (!getStoredToken()) {
        setUser(null);
        return;
      }
      fetchViewer()
        .then((u) => !cancelled && setUser(u))
        .catch(() => !cancelled && setUser(null));
    };
    sync();
    window.addEventListener(TOKEN_EVENT, sync);
    return () => {
      cancelled = true;
      window.removeEventListener(TOKEN_EVENT, sync);
    };
  }, []);
  return user;
}

export function GitHubConnect() {
  const user = useGitHubUser();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (user) {
    return (
      <span className="flex items-center gap-2 text-sm text-ink-secondary">
        <span className="badge badge-good">@{user.login}</span>
        <button
          onClick={() => storeToken(null)}
          className="text-xs text-ink-muted hover:text-ink"
        >
          disconnect
        </button>
      </span>
    );
  }

  const save = async () => {
    setSaving(true);
    setError(null);
    storeToken(value.trim());
    try {
      await fetchViewer();
      setOpen(false);
      setValue("");
    } catch (e) {
      storeToken(null);
      setError(e instanceof Error ? e.message : "Token check failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-full border border-hairline px-4 py-1.5 text-xs uppercase tracking-widest text-ink-secondary hover:border-ink hover:text-ink"
      >
        Connect GitHub
      </button>
      {open && (
        <div className="card absolute right-0 top-full z-10 mt-2 w-80 p-4">
          <p className="text-xs leading-relaxed text-ink-secondary">
            The token is stored only in this browser and sent only to
            api.github.com.
          </p>
          <a
            href="https://github.com/settings/personal-access-tokens/new?name=devrel-station&target_name=logos-co"
            target="_blank"
            rel="noreferrer"
            className="mt-2 block rounded-lg bg-inset px-3 py-2 text-xs leading-relaxed text-ink-secondary hover:text-ink"
          >
            <span className="font-medium text-accent">
              Generate a fine-grained PAT ↗
            </span>
            <br />
            Repositories: <strong>{RFP_REPO}</strong>,{" "}
            <strong>{FEEDBACK_REPO}</strong>
            <br />
            Permission: <strong>Issues — Read &amp; write</strong>
          </a>
          <input
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && value.trim() && save()}
            placeholder="github_pat_…"
            className="mt-3 w-full rounded-lg border border-hairline bg-page px-2 py-1.5 font-mono text-xs"
          />
          {error && (
            <p className="mt-2 text-xs" style={{ color: "var(--badge-critical-fg)" }}>
              {error}
            </p>
          )}
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => setOpen(false)}
              className="rounded-full px-3 py-1 text-xs text-ink-muted hover:text-ink"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={!value.trim() || saving}
              className="rounded-full bg-ink px-4 py-1 text-xs font-medium text-page disabled:opacity-50"
            >
              {saving ? "Checking…" : "Connect"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ReviewComposer({
  repo,
  issue,
  milestoneId,
  onPosted,
}: {
  repo: string;
  issue: number;
  milestoneId: string;
  onPosted: (review: MilestoneReview) => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<ReviewVerdict | "comment" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (verdict?: ReviewVerdict) => {
    setBusy(verdict ?? "comment");
    setError(null);
    try {
      onPosted(
        await postReviewComment(repo, issue, milestoneId, text.trim(), verdict),
      );
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Posting failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder={`${milestoneId} review notes — posted as a comment on the proposal issue`}
        className="w-full rounded-lg border border-hairline bg-page px-3 py-2 text-sm"
      />
      {error && (
        <p className="mt-1 text-xs" style={{ color: "var(--badge-critical-fg)" }}>
          {error}
        </p>
      )}
      <div className="mt-1 flex justify-end gap-2">
        <button
          onClick={() => submit()}
          disabled={!text.trim() || busy !== null}
          className="rounded-full px-3 py-1.5 text-xs text-ink-muted hover:text-ink disabled:opacity-50"
        >
          {busy === "comment" ? "Posting…" : "Comment"}
        </button>
        <button
          onClick={() => submit("changes_requested")}
          disabled={busy !== null}
          className="rounded-full border border-hairline px-4 py-1.5 text-xs font-medium text-ink hover:border-ink disabled:opacity-50"
        >
          {busy === "changes_requested" ? "Posting…" : "Request changes"}
        </button>
        <button
          onClick={() => submit("approved")}
          disabled={busy !== null}
          className="rounded-full bg-ink px-4 py-1.5 text-xs font-medium text-page disabled:opacity-50"
        >
          {busy === "approved" ? "Posting…" : `Approve ${milestoneId}`}
        </button>
      </div>
    </div>
  );
}

