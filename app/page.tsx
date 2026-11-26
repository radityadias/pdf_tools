import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import Hero from "@/components/layout/Hero";

import type { Metadata } from "next";

import { ArrowRight } from "lucide-react";
import { GUIDES } from "@/lib/guides";
import { websiteJsonLd } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { TOOLS } from "@/lib/tools";

export const metadata: Metadata = {
  title: {
    absolute: `${SITE.name}: Free PDF Tools to Compress, Merge, Split & Sign` ,
  },
  description:
    "Compress, merge, split, sign, protect and convert PDFs without uploading them. Every tool runs in your browser, with no account and no watermark.",
  alternates: { canonical: "/" },
};

const SITUATIONS = [
  {
    title: "The upload form says “file too large”",
    body: "Application portals and school systems often cap uploads at a few hundred kilobytes, and a scan or a phone-photo PDF is usually far bigger. Compress it to a target size, then open the result and check that the small print is still readable before you submit it.",
    tools: ["compress-pdf"],
  },
  {
    title: "Your assignment is a pile of photos",
    body: "Photograph each page, turn the photos into one PDF and straighten any sideways pages. If your lecturer wants the cover sheet first, reorder the pages before you send the file.",
    tools: ["jpg-to-pdf", "reorder-pdf"],
  },
  {
    title: "A form has to be signed tonight",
    body: "No printer, no scanner. Draw your signature with a finger or a mouse, add today’s date, place both where the form asks for them, and download the signed copy.",
    tools: ["sign-pdf"],
  },
  {
    title: "A statement with account numbers has to go by email",
    body: "Add a password before you attach it, and send the password through a different channel, such as a chat message. You can also switch off printing and copying.",
    tools: ["protect-pdf"],
  },
  {
    title: "You only need three pages of a long document",
    body: "Split out the pages you need, or cut a long scan into one file per document. If the pages are scans, extract the words with OCR instead of retyping them.",
    tools: ["split-pdf", "pdf-to-text"],
  },
];

const HOW = [
  {
    title: "A small program loads with the page",
    text: "When you open a tool, your browser downloads the code that does the work, plus a few libraries for reading and writing PDFs. That part is the same for every visitor.",
  },
  {
    title: "Your file is read in memory",
    text: "When you choose a file, the code on the page reads it from your device straight into your browser’s memory. It is not sent to us or to anyone else.",
  },
  {
    title: "The result is built on the spot",
    text: "The finished file is created in memory and handed to you as a download. Close the tab, and everything is discarded.",
  },
];

const LIMITS = [
  "Compression works by redrawing pages as images, so it helps scans and photo-heavy files but rarely shrinks a PDF that is mostly typed text.",
  "OCR reads clean scans well and makes mistakes on blur, handwriting and small print, so proofread anything important.",
  "Most tools can’t open a PDF that is locked with a password you don’t have. They also can’t guess or crack one.",
  "Everything runs on your own device, so very large files can be slow on a phone and are better handled on a computer.",
];

const FAQ = [
  {
    q: "Which tool should I start with?",
    a: "Start from the problem. A file that is too big for a form needs Compress PDF. Pages in the wrong order need Reorder PDF. A pile of photos becomes one document with JPG to PDF. If you aren’t sure, the guides explain each task step by step.",
  },
  {
    q: "Do I need to install anything or make an account?",
    a: "No. The tools open in the browser you already use, and there is no sign-up, no trial period and no watermark on the files you download.",
  },
  {
    q: "How is this different from sites that upload my file?",
    a: "Many online converters send your document to their own servers and send a result back. Here the work happens inside your browser, so there is no upload to wait for and no copy of your file on a stranger’s machine.",
  },
  {
    q: "Which browsers and devices work?",
    a: "Current versions of Chrome, Edge, Firefox and Safari, on computers and phones. Very old browsers may miss features the tools rely on.",
  },
  {
    q: "Something didn’t work. What should I do?",
    a: "Tell us on the contact page. It helps to say which tool you used, your browser and device, and roughly how large the file was.",
  },
];

const heroData = {
    title: "Every PDF tool you need, in your browser",
    desc: "Compress, merge and split PDFs for free. No signup, and your files never leave your device.",
  };

const chip =
  "inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium transition hover:border-primary/50 hover:bg-secondary";

export default function Home() {
  const toolBySlug = (slug: string) => TOOLS.find((t) => t.slug === slug);
  const guides = [...GUIDES]
    .sort((a, b) => b.updated.localeCompare(a.updated))
    .slice(0, 3);

  return (
    <main className="bg-background text-foreground">
      <JsonLd data={websiteJsonLd()} />

      {/* Hero */}
      <Hero title={heroData.title} desc={heroData.desc} />

      {/* Tools: one flat grid, the original card design */}
      <section
        id="tools"
        className="mx-auto max-w-[1800px] scroll-mt-8 px-6 pb-16 sm:px-12"
      >
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {TOOLS.map(({ slug, title, desc, icon: Icon }) => (
            <Link
              key={slug}
              href={`/${slug}`}
              className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition
                         hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md
                         focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <h2 className="mt-4 text-xl! font-bold">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Real situations */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto w-full md:max-w-7xl px-6 py-16">
          <h2 className="text-2xl font-bold tracking-tight">
            Everyday situations
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Most people arrive with a small, urgent problem. These are the ones
            we see most often, and the tools that solve them.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {SITUATIONS.map((s) => (
              <article
                key={s.title}
                className="rounded-2xl border border-border bg-background p-6 shadow-sm"
              >
                <h3 className="font-bold">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {s.tools.map((slug, i) => {
                    const tool = toolBySlug(slug);
                    if (!tool) return null;
                    return (
                      <Link key={slug} href={`/${slug}`} className={chip}>
                        {s.tools.length > 1 && (
                          <span className="text-xs text-muted-foreground">
                            {i + 1}
                          </span>
                        )}
                        {tool.title}
                      </Link>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="text-2xl font-bold tracking-tight">
          How it works, in plain words
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          “Runs in your browser” is easy to say and easy to doubt, so here is
          what actually happens.
        </p>

        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {HOW.map((h, i) => (
            <li key={h.title}>
              <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-accent font-bold text-accent-foreground">
                {i + 1}
              </span>
              <h3 className="text-center mt-5 font-semibold">{h.title}</h3>
              <p className="text-center mt-3 text-sm leading-relaxed text-muted-foreground">
                {h.text}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-bold">What stays on your device</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Your documents, the signatures you draw and the passwords you type
              are handled in your browser and never sent to us. What the site
              can see is ordinary technical information, such as the pages you
              visit and your IP address in the hosting logs. Where ads appear,
              Google AdSense may also use cookies. The{" "}
              <Link
                href="/privacy-policy"
                className="font-medium text-primary underline underline-offset-2"
              >
                Privacy Policy
              </Link>{" "}
              covers the details.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-bold">How the site pays for itself</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              The tools are free. Where ads appear, they are the site’s only
              source of income. There are no accounts, no paywalls and no limits
              that push you toward a paid plan.
            </p>
          </div>
        </div>
      </section>

      {/* Honest limits */}
      <section className="border-y border-border bg-card w-full">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <h2 className="text-2xl font-bold tracking-tight">
            What to expect, honestly
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            No tool does everything. These limits apply across the site, and
            each tool page lists its own.
          </p>
          <ul className="mt-6 list-disc space-y-3 pl-6 leading-relaxed text-muted-foreground">
            {LIMITS.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Guides */}
      {guides.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-bold tracking-tight">
              Popular guides
            </h2>
            <Link
              href="/guides"
              className="inline-flex items-center gap-1.5 font-semibold text-primary hover:text-primary-hover"
            >
              All guides <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <ul className="mt-6 space-y-3">
            {guides.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/guides/${g.slug}`}
                  className="block rounded-xl border border-border bg-card px-5 py-4 font-semibold shadow-sm transition hover:border-primary/50 hover:bg-secondary"
                >
                  {g.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* FAQ */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <h2 className="text-center text-2xl font-bold tracking-tight">
          Questions before you start
        </h2>
        <div className="mt-8 space-y-4">
          {FAQ.map((f) => (
            <div
              key={f.q}
              className="rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <h3 className="font-semibold">{f.q}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                {f.a}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Still stuck?{" "}
          <Link
            href="/contact"
            className="font-medium text-primary underline underline-offset-2"
          >
            Write to us
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
