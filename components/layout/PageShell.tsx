import type { ReactNode } from "react";

export function PageShell({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro?: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <main className="bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-14">
        <header className="border-b border-border pb-8">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
          {intro && <p className="mt-3 text-lg text-muted-foreground">{intro}</p>}
          {updated && (
            <p className="mt-3 text-sm text-muted-foreground">Last updated: {updated}</p>
          )}
        </header>
        <div className="mt-10 space-y-10">{children}</div>
      </div>
    </main>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="text-xl font-bold">{title}</h3>
      <div
        className="mt-3 space-y-3 leading-relaxed text-muted-foreground
                   [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2
                   [&_a:hover]:text-primary-hover
                   [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6
                   [&_strong]:text-foreground"
      >
        {children}
      </div>
    </section>
  );
}