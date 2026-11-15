import { Caveat, Dancing_Script, Great_Vibes } from "next/font/google";

const dancing = Dancing_Script({ subsets: ["latin"], display: "swap", preload: false });
const vibes = Great_Vibes({ subsets: ["latin"], weight: "400", display: "swap", preload: false });
const caveat = Caveat({ subsets: ["latin"], display: "swap", preload: false });

export const SIGNATURE_FONTS = [
  { id: "dancing", label: "Classic", family: dancing.style.fontFamily },
  { id: "vibes", label: "Elegant", family: vibes.style.fontFamily },
  { id: "caveat", label: "Casual", family: caveat.style.fontFamily },
];