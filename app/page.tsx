import Hero from "@/components/Hero";
import Link from "next/link";
import { Metadata } from "next";
import { TOOLS } from "@/lib/tools";
import { Gift, ShieldCheck, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Free PDF Tools Online: Compress, Merge & Split PDF",
  description:
    "Free online PDF tools that work in your browser. Compress, merge and split PDFs with no signup. Your files never leave your device.",
};

const FEATURES = [
  {
    title: "Private by design",
    desc: "Everything runs in your browser. Your files are never uploaded to a server.",
  },
  {
    title: "Free, no signup",
    desc: "No accounts, no watermarks, no daily limits.",
  },
  {
    title: "Fast",
    desc: "No upload or download wait. Processing starts the moment you pick a file.",
  },
];

const STEPS = [
  { title: "Choose a tool", desc: "Pick compress, merge or split." },
  { title: "Add your PDF", desc: "Select a file or drop it onto the page." },
  { title: "Download", desc: "Get your result in seconds." },
];

const FAQ = [
  {
    q: "Are my files uploaded anywhere?",
    a: "No. All processing happens locally in your browser, so your documents stay on your device.",
  },
  {
    q: "Is it really free?",
    a: "Yes. The site is supported by ads, so there are no fees, watermarks or signup.",
  },
  {
    q: "Why didn't my PDF get smaller?",
    a: "Compression works best on scanned or image-heavy PDFs. PDFs that are mostly text are already compact, so there may be little to save.",
  },
  {
    q: "Does it work on my phone?",
    a: "Yes, on any modern mobile or desktop browser.",
  },
];

export default function Home() {
  const heroData = {
    title: "Every PDF tool you need, in your browser",
    desc: "Compress, merge and split PDFs for free. No signup, and your files never leave your device.",
  };

  return (
    <>
      <main>
        <Hero title={heroData.title} desc={heroData.desc} />

        <section className="mx-auto max-w-5xl px-6 pb-16">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                <h2 className="mt-4 text-lg font-bold">{title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Why */}
        <section className="border-y border-border bg-card">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                Why choose us
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                Built for privacy, speed and simplicity
              </h2>
              <p className="mt-3 text-muted-foreground">
                No accounts, no uploads, no waiting. Just open a tool and get it
                done.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-5">
              {/* Featured: privacy */}
              <div className="relative overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground md:col-span-3 md:row-span-2">
                {/* decorative circles */}
                <div
                  aria-hidden
                  className="absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-primary-foreground/10"
                />
                <div
                  aria-hidden
                  className="absolute -bottom-6 right-24 h-24 w-24 rounded-full bg-accent/30"
                />

                <div className="relative">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-foreground/15">
                    <ShieldCheck className="h-7 w-7" aria-hidden />
                  </span>
                  <h3 className="mt-6 text-2xl font-bold">
                    Your files never leave your device
                  </h3>
                  <p className="mt-3 max-w-md text-primary-foreground/80">
                    Every tool runs directly in your browser. Nothing is
                    uploaded to a server, so your contracts, IDs and personal
                    documents stay private.
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-foreground">
                    100% local processing
                  </span>
                </div>
              </div>

              {/* Free */}
              <div className="rounded-3xl border border-border bg-background p-6 transition hover:border-primary/40 hover:shadow-md md:col-span-2">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-primary">
                  <Gift className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-bold">Free, no signup</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  No accounts, no watermarks and no daily limits.
                </p>
              </div>

              {/* Fast */}
              <div className="rounded-3xl border border-border bg-background p-6 transition hover:border-primary/40 hover:shadow-md md:col-span-2">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-primary">
                  <Zap className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-bold">Fast</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  No upload or download wait. Processing starts the moment you
                  pick a file.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-14">
          <h2 className="text-center text-2xl font-bold">How it works</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="text-center">
                <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-accent font-bold text-accent-foreground">
                  {i + 1}
                </span>
                <h3 className="mt-3 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-20">
          <h2 className="text-center text-2xl font-bold">
            Frequently asked questions
          </h2>
          <div className="mt-8 space-y-3">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-border bg-card p-4 open:border-primary/40"
              >
                <summary className="cursor-pointer list-none font-semibold marker:hidden">
                  {item.q}
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
