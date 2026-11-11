export type NavLink = { href: string; label: string };

export const COMPANY_LINKS: NavLink[] = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export const LEGAL_LINKS: NavLink[] = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-and-conditions", label: "Terms & Conditions" },
];

export const NAVBAR_LINKS: NavLink[] = [
  { href: "/compress-pdf", label: "Compress PDF" },
  { href: "/merge-pdf", label: "Merge PDF" },
  { href: "/split-pdf", label: "Split PDF" },
]

export const TOOL_LINKS: NavLink[] = [
  { href: "/jpg-to-pdf", label: "Image To PDF" },
  { href: "/pdf-to-jpg", label: "PDF To Image" },
  { href: "/reorder-pdf", label: "Reorder PDF" },
]