import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Fira_Code, Public_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { GitHubConnect } from "@/components/github";

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});
const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

const NAV = [
  { href: "/", label: "Home" },
  { href: "/rfps", label: "RFPs" },
  { href: "/content-factory", label: "Content Factory" },
  { href: "/feedback", label: "Feedback" },
];

export default function Layout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const { pathname } = useRouter();
  return (
    <div
      className={`${firaCode.variable} ${publicSans.variable} min-h-screen font-sans`}
    >
      <Head>
        <title>{`${title} · DevRel Station`}</title>
        <meta
          name="description"
          content="DevRel Station — the developer relations hub for Logos"
        />
      </Head>
      <header className="border-b border-hairline bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-2 px-6 py-4">
          <Link
            href="/"
            aria-label="DevRel Station"
            title="DevRel Station"
            className="text-ink hover:text-accent"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
              <path d="M7.76 16.24a6 6 0 0 1 0-8.48" />
              <path d="M16.24 7.76a6 6 0 0 1 0 8.48" />
              <path d="M4.93 19.07a10 10 0 0 1 0-14.14" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          </Link>
          <nav className="flex items-center gap-1">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3.5 py-1.5 text-xs uppercase tracking-widest ${
                    active
                      ? "bg-ink text-page"
                      : "text-ink-secondary hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto">
            <GitHubConnect />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
