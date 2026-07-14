import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { ContentCollection, ResourcePreview } from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "content-factory");

const TWEET_URL = /(?:twitter\.com|x\.com)\/[^/]+\/status\/(\d+)/;

// Tweet metadata via the fxtwitter API — the X API needs paid auth and
// x.com serves no OG tags to plain fetches, so this is the practical way
// to get post text + video thumbnails server-side.
async function fetchTweetPreview(id: string): Promise<ResourcePreview | undefined> {
  try {
    const res = await fetch(`https://api.fxtwitter.com/status/${id}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return undefined;
    const { tweet } = await res.json();
    if (!tweet) return undefined;
    const video = tweet.media?.videos?.[0];
    const photo = tweet.media?.photos?.[0];
    const posted = tweet.created_at ? new Date(tweet.created_at) : null;
    return {
      thumbnail: video?.thumbnail_url ?? photo?.url ?? undefined,
      video: Boolean(video),
      date:
        posted && !Number.isNaN(posted.getTime())
          ? posted.toISOString().slice(0, 10)
          : undefined,
    };
  } catch {
    return undefined;
  }
}

// Best-effort preview enrichment for every resource in every collection.
// Failures (offline, API down, non-tweet URL) leave the item as a plain link.
export async function withPreviews(
  collections: ContentCollection[],
): Promise<ContentCollection[]> {
  return Promise.all(
    collections.map(async (c) => ({
      ...c,
      items: await Promise.all(
        c.items.map(async (item) => {
          const tweetId = item.url.match(TWEET_URL)?.[1];
          const preview = tweetId ? await fetchTweetPreview(tweetId) : undefined;
          return preview ? { ...item, preview } : item;
        }),
      ),
    })),
  );
}

export function loadContentCollections(): ContentCollection[] {
  if (!fs.existsSync(DATA_DIR)) return [];

  return fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      const { data, content } = matter(
        fs.readFileSync(path.join(DATA_DIR, file), "utf8"),
      );
      const items = (Array.isArray(data.items) ? data.items : [])
        .map((raw: Record<string, unknown>, i: number) => ({
          title: raw?.title ? String(raw.title) : `Part ${i}`,
          url: raw?.url ? String(raw.url) : "",
        }))
        .filter((item) => item.url);
      return {
        slug,
        title: data.title ? String(data.title) : slug,
        platform: data.platform ? String(data.platform) : undefined,
        items,
        notes: content.trim(),
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}
