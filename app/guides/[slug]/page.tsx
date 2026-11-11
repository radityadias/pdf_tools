import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell, Section } from "@/components/layout/PageShell";
import { GUIDES } from "@/lib/guides";
import { TOOLS } from "@/lib/tools";

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = GUIDES.find((g) => g.slug === slug);
  if (!guide) return {};

  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: {
      title: guide.title,
      description: guide.description,
      url: `/guides/${guide.slug}`,
      type: "article",
    },
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = GUIDES.find((g) => g.slug === slug);
  if (!guide) notFound();

  const tool = TOOLS.find((t) => t.slug === guide.tool);
  const updated = new Date(guide.updated).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <PageShell title={guide.title} intro={guide.description} updated={updated}>
      {guide.sections.map((s) => (
        <Section key={s.heading} title={s.heading}>
          {s.paragraphs?.map((p) => <p key={p}>{p}</p>)}
          {s.list &&
            (s.ordered ? (
              <ol>
                {s.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            ) : (
              <ul>
                {s.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ))}
        </Section>
      ))}

      {tool && (
        <Section title="Try it yourself">
          <p>{tool.desc} It runs in your browser, so your files stay on your device.</p>
          <Link
            href={`/${tool.slug}`}
            className="inline-block rounded-xl bg-primary px-6 py-3 font-bold !text-primary-foreground !no-underline transition hover:bg-primary-hover"
          >
            Open {tool.title}
          </Link>
        </Section>
      )}
    </PageShell>
  );
}