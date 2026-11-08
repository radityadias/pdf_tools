import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, Section } from "@/components/layout/PageShell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: `The terms for using ${SITE.name}: free PDF tools that run in your browser.`,
  alternates: { canonical: "/terms-and-conditions" },
};

const host = new URL(SITE.url).hostname;

export default function TermsPage() {
  return (
    <PageShell
      title="Terms & Conditions"
      intro={`Please read these terms before using ${host}. By using the site, you agree to them.`}
      updated={SITE.legalUpdated}
    >
      <Section title="The service">
        <p>
          {SITE.name} provides free online tools for working with PDF and image files. The tools
          run in your browser. We may change, add or remove tools, or stop the service, at any
          time without notice.
        </p>
      </Section>

      <Section title="Your files">
        <p>
          Your files stay on your device and are not uploaded to us (see our{" "}
          <Link href="/privacy-policy">Privacy Policy</Link>). You keep all rights to your
          files and to the results. You are responsible for making sure you have the right to
          process any file you use.
        </p>
      </Section>

      <Section title="Acceptable use">
        <p>You agree not to:</p>
        <ul>
          <li>use the site for anything unlawful or to process content you have no right to use;</li>
          <li>attempt to disrupt, overload or reverse-engineer the site beyond what the law allows;</li>
          <li>use automated tools to scrape the site or to generate excessive traffic;</li>
          <li>click on ads artificially or encourage others to do so.</li>
        </ul>
      </Section>

      <Section title="Results and limits">
        <p>
          Output quality depends on your input file and your device. Some tools change the file
          in ways you should know about: for example, compression may turn text pages into
          images, which makes the text unselectable, and very large files may be too heavy for
          your browser to process. Always check the result, and keep your original file,
          before relying on it for anything important.
        </p>
      </Section>

      <Section title="No warranty">
        <p>
          The site and its tools are provided “as is” and “as available”, without warranties of
          any kind, whether express or implied, including fitness for a particular purpose,
          accuracy or uninterrupted availability.
        </p>
      </Section>

      <Section title="Limitation of liability">
        <p>
          To the fullest extent permitted by law, we are not liable for any loss or damage
          arising from your use of the site, including lost or corrupted files, lost data or
          lost profits. You use the tools at your own risk.
        </p>
      </Section>

      <Section title="Advertising and third-party links">
        <p>
          The site displays ads provided by third parties such as Google AdSense. We do not
          control or endorse those ads or any third-party sites linked from this website, and
          we are not responsible for their content or practices.
        </p>
      </Section>

      <Section title="Intellectual property">
        <p>
          The design, text and code of this site belong to {SITE.name} or its licensors, except
          for open-source libraries that remain under their own licenses. You may not copy or
          republish the site’s content without permission.
        </p>
      </Section>

      <Section title="Changes to these terms">
        <p>
          We may update these terms from time to time. Continuing to use the site after changes
          means you accept the updated terms.
        </p>
      </Section>

      <Section title="Governing law">
        <p>These terms are governed by the laws of the Republic of Indonesia.</p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about these terms? Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a>{" "}
          or visit our <Link href="/contact">contact page</Link>.
        </p>
      </Section>
    </PageShell>
  );
}