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
  { href: "/compress-pdf", label: "COMPRESS PDF" },
  { href: "/merge-pdf", label: "MERGE PDF" },
  { href: "/split-pdf", label: "SPLIT PDF" },
]

export const TOOL_LINKS: NavLink[] = [
  { href: "/jpg-to-pdf", label: "IMAGE TO PDF" },
  { href: "/pdf-to-jpg", label: "PDF TO IMAGE" },
]