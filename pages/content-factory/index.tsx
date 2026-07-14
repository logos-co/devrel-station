import Image from "next/image";
import type { GetStaticProps } from "next";
import Layout from "@/components/Layout";
import { loadContentCollections, withPreviews } from "@/lib/content";
import { formatDate } from "@/lib/status";
import type { ContentCollection, ContentResource } from "@/lib/types";

const CARD_VARIANTS = ["card-blue", "card-tan", "card-grey"] as const;

function ResourceTile({ item }: { item: ContentResource }) {
  const p = item.preview;
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="block overflow-hidden rounded-xl bg-page transition-opacity hover:opacity-90"
    >
      {p?.thumbnail && (
        <div className="relative aspect-video">
          <Image
            src={p.thumbnail}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
          {p.video && (
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid size-11 place-items-center rounded-full bg-ink/75 pl-1 text-sm text-page">
                ▶
              </span>
            </span>
          )}
        </div>
      )}
      <div className="px-4 py-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-ui text-sm font-semibold">{item.title} ↗</span>
          {p?.date && (
            <span className="text-xs tabular-nums text-ink-muted">
              {formatDate(p.date)}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

function CollectionCard({
  collection,
  variant,
}: {
  collection: ContentCollection;
  variant: string;
}) {
  const c = collection;
  return (
    <div className={`card ${variant} px-6 py-6`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-2xl">{c.title}</h2>
        <span className="badge badge-neutral">
          {c.items.length} resource{c.items.length === 1 ? "" : "s"}
        </span>
      </div>
      {c.platform && (
        <div className="mt-1 text-[11px] uppercase tracking-widest text-ink-secondary">
          {c.platform}
        </div>
      )}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {c.items.map((item) => (
          <ResourceTile key={item.url} item={item} />
        ))}
      </div>
      {c.notes && (
        <p className="mt-4 whitespace-pre-wrap text-xs leading-relaxed text-ink-muted">
          {c.notes}
        </p>
      )}
    </div>
  );
}

export default function ContentFactory({
  collections,
}: {
  collections: ContentCollection[];
}) {
  return (
    <Layout title="Content Factory">
      <h1 className="text-4xl">Content Factory</h1>

      <div className="mt-6">
        {collections.length === 0 ? (
          <p className="text-sm text-ink-secondary">
            No collections yet. Copy <code>data/CONTENT_FACTORY_TEMPLATE.md</code>{" "}
            into <code>data/content-factory/</code>.
          </p>
        ) : (
          <div className="space-y-4">
            {collections.map((c, i) => (
              <CollectionCard
                key={c.slug}
                collection={c}
                variant={CARD_VARIANTS[i % CARD_VARIANTS.length]}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  // JSON round-trip drops `undefined` optional fields, which Next.js props forbid
  const collections = JSON.parse(
    JSON.stringify(await withPreviews(loadContentCollections())),
  );
  return { props: { collections }, revalidate: 300 };
};
