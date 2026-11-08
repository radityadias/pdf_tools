import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, Section } from "@/components/layout/PageShell";
import { SITE } from "@/lib/site";
import { TOOLS } from "@/lib/tools";

export const metadata: Metadata = {
  title: "About",
  description: `${SITE.name} offers free PDF tools that run entirely in your browser, so your files never leave your device.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <PageShell
      title={`About ${SITE.name}`}
      intro="Free PDF and image tools that work in your browser, with no signup and no uploads."
    >
      <Section title="Why this site exists">
        <p>
          Most online PDF tools ask you to upload your documents to a server you know nothing
          about. For contracts, IDs, invoices and application forms, that is a lot to trust a
          stranger with. {SITE.name} was built around a simpler idea: do the work on your own
          device, so your files never go anywhere.
        </p>
      </Section>

      <Section title="How it works">
        <p>
          When you pick a file, it is opened and processed by JavaScript running in your
          browser, using open-source libraries such as pdf-lib and PDF.js. The finished file is
          created on your device and handed to you to download. There are no accounts and no
          upload step, so there is nothing for us to store, and nothing waiting on a server.
        </p>
      </Section>

      <Section title="What you can do here">
        <ul>
          {TOOLS.map((t) => (
            <li key={t.slug}>
              <Link href={`/${t.slug}`}>{t.title}</Link>: {t.desc}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Honest limits">
        <ul>
          <li>
            PDF compression works by re-encoding pages as images, so it helps most on scanned and
            image-heavy PDFs. PDFs that are mostly text are already small and may not shrink.
          </li>
          <li>Password-protected PDFs can’t be opened by these tools.</li>
          <li>
            Because everything runs on your device, very large files can be slow or may exceed
            what your browser can handle.
          </li>
        </ul>
      </Section>

      <Section title="How the site is funded">
        <p>
          The tools are free to use. The site is supported by advertising from Google AdSense,
          which is why you may see ads and why we publish a clear{" "}
          <Link href="/privacy-policy">Privacy Policy</Link>.
        </p>
      </Section>

      <Section title="Get in touch">
        <p>
          Found a bug, or want a tool we don’t have yet? Tell us on the{" "}
          <Link href="/contact">contact page</Link>.
        </p>
      </Section>
    </PageShell>
  );
}