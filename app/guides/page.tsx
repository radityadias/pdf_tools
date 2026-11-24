import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import {
  formatDate,
  GUIDES,
  readingMinutes,
  TOPICS,
  type Guide,
  type Topic,
} from "@/lib/guides";
import { SITE } from "@/lib/site";
import { TOOLS } from "@/lib/tools";

export const metadata: Metadata = {
  title: "PDF Guides: Compress, Merge and Extract Text from PDFs",
  description:
    "Step-by-step guides for everyday PDF jobs: getting a file under an upload limit, merging documents in the right order, and turning scans into text.",
  alternates: { canonical: "/guides" },
  openGraph: { url: "/guides", type: "website" },
};

function GuideCard({ guide, featured = false }: { guide: Guide; featured?: boolean }) {
  const tool = TOOLS.find((t) => t.slug === guide.tool);
  const Icon = tool?.icon;

  return (
    <Link
      href={`/guides/${guide.slug}`}
      className={`group flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition
                  hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md
                  focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 ${
                    featured ? "md:p-8" : ""
                  }`}
    >
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" aria-hidden />}
        {TOPICS[guide.topic].title}
      </span>

      <h3
        className={`mt-4 font-bold tracking-tight text-foreground ${
          featured ? "text-2xl md:text-3xl" : "text-xl"
        }`}
      >
        {guide.title}
      </h3>
      <p className="mt-3 flex-1 leading-relaxed text-muted-foreground">{guide.excerpt}</p>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-4 w-4" aria-hidden /> {readingMinutes(guide)} min read
        </span>
        <span>Updated {formatDate(guide.updated)}</span>
      </div>

      <span className="mt-5 inline-flex items-center gap-1.5 font-semibold text-primary">
        Read the guide
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
      </span>
    </Link>
  );
}

export default function GuidesPage() {
  const sorted = [...GUIDES].sort((a, b) => b.updated.localeCompare(a.updated));
  const [featured, ...rest] = sorted;

  // Only topics that have guides are shown, so there are never empty sections
  const topics = (Object.keys(TOPICS) as Topic[])
    .map((topic) => ({ topic, guides: rest.filter((g) => g.topic === topic) }))
    .filter((t) => t.guides.length > 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "PDF guides",
    url: `${SITE.url}/guides`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: sorted.map((g, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE.url}/guides/${g.slug}`,
        name: g.title,
      })),
    },
  };

  return (
    <main className="bg-background text-foreground mt-5">
      <JsonLd data={jsonLd} />

      <div className="mx-auto w-full px-8 py-14">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span aria-hidden> / </span>
          <span className="text-foreground">Guides</span>
        </nav>

        <header className="mt-6 max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">PDF guides</h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            These guides cover the jobs people most often bring to a PDF tool: getting a file under
            an upload limit, combining documents in the right order, and pulling text out of a scan.
            Each one explains what is actually happening, gives the steps in order, and says
            honestly when a task can’t be done.
          </p>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Every tool on {SITE.name} runs in your browser, so none of these guides ever asks you to
            upload a document anywhere.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            {GUIDES.length} {GUIDES.length === 1 ? "guide" : "guides"} · last updated{" "}
            {formatDate(sorted[0].updated)}
          </p>
        </header>

        {featured && (
          <section className="mt-12" aria-labelledby="start-here">
            <h2 id="start-here" className="text-3xl! font-bold tracking-tight">
              Start here
            </h2>
            <div className="mt-5">
              <GuideCard guide={featured} featured />
            </div>
          </section>
        )}

        {topics.map(({ topic, guides }) => (
          <section key={topic} className="mt-14" aria-labelledby={`topic-${topic}`}>
            <h2 id={`topic-${topic}`} className="text-3xl! font-bold tracking-tight">
              {TOPICS[topic].title}
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">{TOPICS[topic].blurb}</p>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {guides.map((g) => (
                <GuideCard key={g.slug} guide={g} />
              ))}
            </div>
          </section>
        ))}

        <section className="mt-16 rounded-2xl border border-border bg-card p-8">
          <h2 className="text-xl! font-bold tracking-tight">How these guides are written</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
            Each guide is written around a tool on this site and checked against how that tool
            behaves today. When a limit or a step changes, the guide is updated and the date on it
            changes too. If you spot a mistake, or want a guide on something specific, tell us on
            the{" "}
            <Link
              href="/contact"
              className="font-medium text-primary underline underline-offset-2 hover:text-primary-hover"
            >
              contact page
            </Link>
            .
          </p>
        </section>

        <section className="mt-14" aria-labelledby="try-tools">
          <h2 id="try-tools" className="text-2xl font-bold tracking-tight">
            Ready to try a tool?
          </h2>
          <ul className="mt-5 flex flex-wrap gap-3">
            {TOOLS.map(({ slug, title, icon: Icon }) => (
              <li key={slug}>
                <Link
                  href={`/${slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition hover:border-primary/50 hover:bg-secondary"
                >
                  <Icon className="h-4 w-4 text-primary" aria-hidden />
                  {title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}