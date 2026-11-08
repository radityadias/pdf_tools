import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, Section } from "@/components/layout/PageShell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact ${SITE.name}: report a bug, suggest a tool, or ask a question about privacy.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <PageShell
      title="Contact"
      intro="We read every message. The fastest way to reach us is by email."
    >
      <Section title="Email us">
        <a
          href={`mailto:${SITE.email}`}
          className="inline-block rounded-xl bg-primary px-6 py-3 font-bold !text-primary-foreground !no-underline transition hover:bg-primary-hover"
        >
          {SITE.email}
        </a>
        <p>We usually reply within a few days.</p>
      </Section>

      <Section title="What to write to us about">
        <ul>
          <li>Bugs or tools that didn’t work as expected</li>
          <li>Ideas for new tools or improvements</li>
          <li>Questions about privacy or these policies</li>
          <li>Advertising or partnership enquiries</li>
        </ul>
      </Section>

      <Section title="Reporting a problem">
        <p>The more detail you give, the faster we can fix it:</p>
        <ul>
          <li>Which tool you were using</li>
          <li>Your browser and device (for example Chrome on Android)</li>
          <li>Roughly how large the file was and how many pages it had</li>
          <li>What you expected, and what happened instead</li>
        </ul>
        <p>
          Please don’t attach private or sensitive documents. A description is enough, and we
          may ask for a sample file if we need one.
        </p>
      </Section>

      <Section title="Related pages">
        <p>
          <Link href="/privacy-policy">Privacy Policy</Link> ·{" "}
          <Link href="/terms-and-conditions">Terms &amp; Conditions</Link> ·{" "}
          <Link href="/about">About</Link>
        </p>
      </Section>
    </PageShell>
  );
}