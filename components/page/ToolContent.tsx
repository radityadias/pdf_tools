import type { ReactNode } from "react";
import Link from "next/link";
import { GUIDES } from "@/lib/guides";
import { TOOL_CONTENT } from "@/lib/tool-content";
import { TOOLS } from "@/lib/tools";

function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-2xl font-bold tracking-tight text-foreground">
      {children}
    </h2>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 list-disc space-y-2 pl-6 leading-relaxed text-muted-foreground">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function ToolContent({ slug }: { slug: string }) {
  const tool = TOOLS.find((t) => t.slug === slug);
  const content = TOOL_CONTENT[slug];
  if (!tool || !content) return null;

  const related = content.related.flatMap((s) =>
    TOOLS.filter((t) => t.slug === s),
  );
  const guides = GUIDES.filter((g) => g.tool === slug);

  return (
    <section className="mt-12 border-t border-border bg-card w-full">
      <div className="mx-auto max-w-7xl space-y-14 px-6 py-14">
        <div className="space-y-4">
          <H2>About {tool.title}</H2>
          {content.intro.map((p) => (
            <p key={p} className="leading-relaxed text-muted-foreground">
              {p}
            </p>
          ))}
        </div>

        <div>
          <H2>How to use {tool.title}</H2>
          <ol className="mt-6 space-y-5">
            {content.steps.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent font-bold text-accent-foreground">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-1 leading-relaxed text-muted-foreground">
                    {s.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <H2>Tips for better results</H2>
            <BulletList items={content.tips} />
          </div>
          <div>
            <H2>Good to know</H2>
            <BulletList items={content.limits} />
          </div>
        </div>

        <div>
          <H2>Frequently asked questions</H2>
          <div className="mt-6 space-y-4">
            {content.faqs.map((f) => (
              <div
                key={f.q}
                className="rounded-xl border border-border bg-background p-5"
              >
                <h3 className="font-semibold text-foreground">{f.q}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {f.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {guides.length > 0 && (
          <div>
            <H2>Related guides</H2>
            <ul className="mt-4 space-y-2">
              {guides.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={`/guides/${g.slug}`}
                    className="font-medium text-primary underline underline-offset-2 hover:text-primary-hover"
                  >
                    {g.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {related.length > 0 && (
          <div>
            <H2>Related tools</H2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {related.map(({ slug: s, title, desc, icon: Icon }) => (
                <Link
                  key={s}
                  href={`/${s}`}
                  className="rounded-xl border border-border bg-background p-4 transition hover:border-primary/50 hover:shadow-sm"
                >
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                  <p className="mt-2 font-semibold text-foreground">{title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
