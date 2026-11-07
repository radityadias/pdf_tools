import type { Metadata, Viewport } from "next";
import { Roboto, Raleway } from "next/font/google";
import { SITE } from "@/lib/site";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

const roboto = Roboto({
  variable: "--font-sans-serif",
  subsets: ["latin"],
});

const raleway = Raleway({
  variable: "--font-sans-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name}: Free Online PDF Tools`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "en_US",
    title: `${SITE.name}: Free Online PDF Tools`,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name}: Free Online PDF Tools`,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  themeColor: "#3b5ea3",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} ${raleway.variable} h-full antialiased`}
    >
      <head>
        <meta
          name="google-adsense-account"
          content="ca-pub-2231908252676475"
        ></meta>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className="min-h-full flex flex-col items-center">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
