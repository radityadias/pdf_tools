import type { Metadata } from "next";
import { PageShell, Section } from "@/components/layout/PageShell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${SITE.name} handles your data: your files never leave your device, plus how we use cookies and Google AdSense.`,
  alternates: { canonical: "/privacy-policy" },
};

const host = new URL(SITE.url).hostname;

export default function PrivacyPolicyPage() {
  return (
    <PageShell
      title="Privacy Policy"
      intro={`Your documents are yours. This page explains what ${SITE.name} does and does not collect when you use ${host}.`}
      updated={SITE.legalUpdated}
    >
      <Section title="The short version">
        <ul>
          <li>Your PDFs and images are processed inside your browser and are never uploaded to us.</li>
          <li>We have no accounts, no logins and no database of user files.</li>
          <li>The site is free and is supported by advertising from Google AdSense, which uses cookies.</li>
        </ul>
      </Section>

      <Section title="Your files">
        <p>
          Every tool on this site (compress, merge, split, PDF to image and image to PDF) runs
          locally in your browser using JavaScript libraries. When you select a file, it is read
          into your device’s memory, processed there, and the result is created on your device
          for you to download. Your files are not sent to our servers or to any third party, and
          they are discarded when you close or reload the page.
        </p>
      </Section>

      <Section title="Information collected automatically">
        <p>
          The website is delivered through Cloudflare. Like any website, our hosting and network
          provider may process technical data such as your IP address, browser type, device
          type, and the pages requested, in order to deliver the site, keep it secure and
          prevent abuse.
        </p>
        <p>
          We do not run our own analytics or tracking scripts at the moment. If that changes, we
          will update this policy.
        </p>
      </Section>

      <Section title="Advertising and cookies">
        <p>
          We use Google AdSense to show ads. Third-party vendors, including Google, use cookies
          or similar technologies to serve ads based on a user’s previous visits to this website
          and other websites. Google’s use of advertising cookies enables it and its partners to
          serve ads to you based on your visit to our site and/or other sites on the internet.
        </p>
        <ul>
          <li>
            You can opt out of personalised advertising by visiting{" "}
            <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">
              Google Ads Settings
            </a>
            .
          </li>
          <li>
            You can also opt out of some third-party vendors’ use of cookies for personalised
            advertising at{" "}
            <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">
              aboutads.info
            </a>
            .
          </li>
          <li>
            To learn how Google uses data from sites that use its services, see{" "}
            <a
              href="https://policies.google.com/technologies/partner-sites"
              target="_blank"
              rel="noopener noreferrer"
            >
              How Google uses information from sites or apps that use our services
            </a>
            .
          </li>
        </ul>
        <p>
          Where the law requires it (for example for visitors in the European Economic Area, the
          United Kingdom and Switzerland), we ask for your consent before personalised ads are
          shown, and you can change your choice at any time. Without consent, only
          non-personalised ads may be shown.
        </p>
      </Section>

      <Section title="Managing cookies">
        <p>
          You can block or delete cookies in your browser settings. If you do, ads may become
          less relevant, but the tools will keep working because they do not depend on cookies.
        </p>
      </Section>

      <Section title="Third-party services">
        <p>We rely on these third parties, each with its own privacy policy:</p>
        <ul>
          <li>
            Google AdSense, for advertising (
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              Google Privacy Policy
            </a>
            )
          </li>
          <li>
            Cloudflare, for hosting and security (
            <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">
              Cloudflare Privacy Policy
            </a>
            )
          </li>
        </ul>
      </Section>

      <Section title="Messages you send us">
        <p>
          If you email us, we receive your email address and whatever you write. We use it only
          to reply and to improve the site, and we keep it only as long as needed for that.
          Please do not attach sensitive documents to support emails.
        </p>
      </Section>

      <Section title="Children">
        <p>
          This site is not directed at children under 13, and we do not knowingly collect
          personal information from them.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          Depending on where you live, laws such as Indonesia’s Personal Data Protection Law
          (UU PDP) or the EU’s GDPR may give you rights over your personal data, including
          access, correction and deletion. Because we do not keep accounts or uploaded files,
          there is very little data we hold ourselves. For anything we may hold (for example an
          email you sent us), contact us at{" "}
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a> and we will respond.
        </p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          We may update this policy as the site changes. The date at the top shows when it was
          last revised.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about privacy? Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
        </p>
      </Section>
    </PageShell>
  );
}