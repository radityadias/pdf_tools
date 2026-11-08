import Link from "next/link";
import { COMPANY_LINKS, LEGAL_LINKS, type NavLink } from "@/lib/nav";
import { SITE } from "@/lib/site";
import { TOOLS } from "@/lib/tools";

function FooterColumn({ title, links }: { title: string; links: NavLink[] }) {
  return (
    <nav aria-label={title}>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ul className="mt-4 space-y-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="rounded text-sm text-muted-foreground transition hover:text-foreground
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  const toolLinks: NavLink[] = TOOLS.map((t) => ({ href: `/${t.slug}`, label: t.title }));

  return (
    <footer className="border-t border-border bg-card w-full">
      <div className="mx-auto justify-center w-full px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 text-center">
          <div>
            <Link
              href="/"
              className="text-lg font-extrabold tracking-tight text-foreground text-start"
            >
              {SITE.name}
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Free PDF tools that run in your browser. Your files never leave your device.
            </p>
          </div>

          <FooterColumn title="Tools" links={toolLinks} />
          <FooterColumn title="Company" links={COMPANY_LINKS} />
          <FooterColumn title="Legal" links={LEGAL_LINKS} />
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-center">
          <p>
            © {year} {SITE.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}