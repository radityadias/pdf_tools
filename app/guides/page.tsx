import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { GUIDES } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Guides",
  description: "Practical, step-by-step help for common PDF and image tasks.",
  alternates: { canonical: "/guides" },
};

export default function GuidesPage() {
  return (
    <PageShell
      title="Guides"
      intro="Practical, step-by-step help for common PDF and image tasks."
    >
      <ul className="space-y-8">
        {GUIDES.map((g) => (
          <li key={g.slug}>
            <Link
              href={`/guides/${g.slug}`}
              className="text-xl font-bold text-foreground transition hover:text-primary"
            >
              {g.title}
            </Link>
            <p className="mt-2 leading-relaxed text-muted-foreground">{g.description}</p>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}