
const BASE_URL = (
  process.env.PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "https://kitdemo.example.com"
).replace(/\/+$/, "");

export const site = {
  name: "Kit Demo Clinic",
  legalName: "Kit Demo Clinic Demo City",
  baseUrl: BASE_URL,
  logo: "/logo-light.png",
  logoDark: "/logo-dark.png",
  lang: "en-US",

  phone: "+52 555 000 0000",
  whatsappNumber: "525550000000",
  whatsappText: "Hi, I'm visiting from your website and I'd like more information about your services.",
  smsConsentText:
    "By checking this box, I agree to receive SMS text messages and emails from {name} about your enquiry, updates and follow-ups. Message frequency varies. Msg & data rates may apply. Reply STOP to opt out at any time, or HELP for help. Consent is not a condition of purchase.",
  email: "hello@kitdemo.example.com",

  address: {
    street: "123 Demo Street, Suite 100",
    locality: "Demo City",
    region: "Demo State",
    postalCode: "00000",
    country: "US",
  },
  areaServed: ["US", "CA"],

  schemaType: "LocalBusiness" as const,
  priceRange: "$$",
  currency: "USD",
  openingHours: "Mo-Fr 08:00-19:00, Sa 09:00-14:00",
  languages: ["English"],
  paymentAccepted: ["Cash", "Credit Card", "Debit Card"],

  author: {
    name: "Dr. Demo",
    url: `${BASE_URL}/#doctor`,
    image: "/equipo.webp",
    jobTitle: "Demo Role — Placeholder Title",
    knowsAbout: [
      "Demo service one",
      "Demo service two",
      "Demo service three",
    ],
    sameAs: [] as string[],
  },
  certifications: [] as string[],

  social: [] as string[],


  ogImage: "/og.png",
  googleAdsConversionId: "",
  metaPixelId: "",
  ga4MeasurementId: "",
  videoId: "aqz-KE-bpKQ",
  heroVideo: {
    mobile: "/video/hero",         // → /video/hero.webm  + .mp4   (9:16)
    desktop: "/video/hero-wide",   // → /video/hero-wide.webm + .mp4 (16:9)
    poster: "/gallery/gallery-1.webp",
    posterDesktop: "/gallery/gallery-2.webp",
  },
  indexable: process.env.SITE_INDEXABLE === "true",

  widget: {
    aria: "Contact channels",
    pill: "Customer care",
    online: "Online now",
    heading: "How can we help you?",
    prompt: "Choose an option to continue:",
    close: "Close",
    back: "Back",
    sales: { title: "WhatsApp", text: "Talk to our team right now" },
    support: { title: "Book a consultation", text: "Leave your details and we'll call you" },
  },

  services: [
    {
      name: "Demo Service One — 2 Steps",
      desc: "Phase 1 $1,900 + Phase 2 $1,000 = $2,900. Demo description for placeholder service one: includes accommodation placeholder and transfers. Replace every placeholder field before publishing.",
      price: "2900",
    },
    {
      name: "Demo Service One — Phase 1",
      desc: "Demo description for placeholder service two: first phase of the demo service. Includes accommodation placeholder and transfers.",
      price: "1900",
    },
    {
      name: "Demo Service One — Phase 2",
      desc: "Demo description for placeholder service three: second phase after a waiting period. Includes accommodation placeholder and transfers.",
      price: "1000",
    },
    {
      name: "Demo Service Two — Full",
      desc: "Demo description for placeholder service four, single-step variant. Includes accommodation placeholder.",
      price: "2500",
    },
    {
      name: "Demo Service Two — Partial",
      desc: "Demo description for placeholder service five, single-step partial variant. Includes accommodation placeholder.",
      price: "1500",
    },
    {
      name: "Demo Add-on — Per Unit",
      desc: "Demo description for placeholder add-on unit. Determined clinically after Dr. Demo evaluates your case.",
      price: "250",
    },
    {
      name: "Demo Advanced Option — Per Unit",
      desc: "Demo description for placeholder advanced option unit. Dr. Demo placeholder credential.",
      price: "1100",
    },
    {
      name: "Demo Service C — Full",
      desc: "Demo description for placeholder option C.",
      price: "2200",
    },
    {
      name: "Demo Service D — Full",
      desc: "Demo description for placeholder option D.",
      price: "2400",
    },
    {
      name: "Demo Entry Service — Partial",
      desc: "Demo description for the entry-level placeholder option.",
      price: "900",
    },
    {
      name: "Demo Single Unit — Add-on Included",
      desc: "Demo description for the single-unit placeholder option.",
      price: "600",
    },
  ],

  rating: {
    value: "4.9",
    count: "250",
  },

  proof: [
    { num: "4.9/5", label: "from 250 reviews" },
    { num: "2,000+", label: "customers served" },
    { num: "15+", label: "years" },
    { num: "97.5%", label: "demo success rate" },
    { num: "300+", label: "demo visitors annually" },
  ],

  steps: [
    { title: "Step 1 — Demo Evaluation", text: "Placeholder step: comprehensive evaluation with our specialist, written demo plan before anything starts. Replace every placeholder field before publishing." },
    { title: "Step 2 — Demo Delivery", text: "Placeholder step: the service is delivered as described in the demo plan. This text demonstrates the rhythm of a step card." },
    { title: "Step 3 — Demo Follow-up", text: "Placeholder step: remote follow-up with your coordinator. The catálogo must never carry a real customer's story." },
  ],

  faq: [
    {
      q: "How much does Demo Service One cost in Demo City?",
      a: "At Kit Demo Clinic by Demo Author: Demo Service One is $2,900 — the placeholder price of the demo catalogue. Package B is $1,500 for one variant or $2,500 for another. All prices in USD are placeholders. No hidden fees — your written demo quote before you confirm.",
    },
    {
      q: "Why is Demo Service One so much more affordable?",
      a: "Placeholder answer: lower operating costs and our own demo lab — NOT cheaper materials. This FAQ demonstrates the accordion's rhythm with two sentences and a number. 2,000+ placeholder customers have trusted this demo.",
    },
    {
      q: "Is the demo follow-up included in the price?",
      a: "Yes. Every demo package includes the placeholder follow-up described in Step 3. It is included in every package of this demo. Replace every placeholder field before publishing.",
    },
    {
      q: "Is accommodation really included? Which one?",
      a: "Yes. Every demo package includes a partner-accommodation placeholder with transfers included. You can upgrade if you prefer. The catálogo must never carry a real partner's name.",
    },
    {
      q: "How long does the whole demo process take?",
      a: "Placeholder timeline: three steps as described in the steps section above. You receive the written demo plan at Step 1. Package B candidates may receive a faster demo variant.",
    },
    {
      q: "Do I need an add-on for Demo Service One?",
      a: "Most customers do NOT. If a special case appears, the demo advanced option ($1,100 per unit) covers it with no extra step needed.",
    },
    {
      q: "Is it safe to buy from this demo business?",
      a: "Absolutely. Demo Author is a placeholder credential with 15+ years of demo experience. We use FDA-approved demo systems and hospital-grade placeholder sterilization. 97.5% demo success rate across 2,000+ placeholder customers.",
    },
    {
      q: "How long do the demo services last?",
      a: "Placeholder answer: demo systems are designed to last many years with proper care. The demo component lasts 6-8 placeholder years. Replace every placeholder field before publishing.",
    },
    {
      q: "How much does the full demo cost in Demo City?",
      a: "At Kit Demo Clinic: Demo Service One (2 steps) is $2,900 — Step one $1,900 + Step two $1,000. Package B is $2,500 or $1,500 per variant. Additional unit $250. Transparent pricing always — your written demo quote is guaranteed for 12 months.",
    },
  ],
} as const;

export const PRIMARY_CTA = "Get My Quote";

export const whatsappHref = `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(site.whatsappText)}`;

export const MENU_LINKS = [
  { href: "/", text: "Home" },
  { href: "/privacy-policy/", text: "Privacy Policy" },
  { href: "/terms/", text: "Terms" },
];

export const TOPBAR = [
  "Demo site — placeholder data, not a real business",
  `Call us: ${site.phone}`,
  "24/7 Demo Coordinator",
];


export type ArchKey = "both" | "upper" | "lower";

export interface Plan {
  key: string;
  trips: string;
  tripsNote: string;
  eyebrow: string;
  name: string;
  text: string;
  specs: string;
  price: Record<ArchKey, number | null>;
  dark?: boolean;
}

export const PLANS: Plan[] = [
  {
    key: "one-step",
    trips: "1 step",
    tripsNote: "One step · everything delivered at once",
    eyebrow: "Most chosen",
    name: "Demo Plan B",
    text: "Placeholder plan: the full demo service delivered in one step, made in our own lab. Travel included.",
    specs: "Demo service · 10 placeholder days · accommodation + transfers",
    price: { both: 2500, upper: 1500, lower: 1500 },
    dark: true,
  },
  {
    key: "two-steps",
    trips: "2 steps",
    tripsNote: "Two steps · phase one now, phase two later",
    eyebrow: "Demo Plan A",
    name: "Demo Plan A",
    text: "Phase one $1,900 + phase two $1,000. The placeholder plan that demonstrates a two-phase offer.",
    specs: "Demo service · 6 + 6 placeholder days · accommodation + transfers",
    price: { both: 2900, upper: null, lower: null },
  },
];

export const QUOTE_FALLBACK = "Written quote in 24 h";

export const AVG_SAVINGS = "50%";

export const TREATMENT_OPTIONS = [
  { value: "", label: "Select service" },
  { value: "service-a-2900", label: "Demo Service One — $2,900" },
  { value: "service-b-2500", label: "Demo Service Two — $2,500" },
  { value: "service-b-1500", label: "Demo Service Two Partial — $1,500" },
  { value: "not-sure", label: "Not sure yet — tell me what I need" },
];

export const PRICE_LOCK_UNTIL = "December 2026";

export const UPLOAD = {
  endpoint: "/api/uploads",
  accept: "image/jpeg,image/png,image/webp,application/pdf",
  maxSizeMb: 20,
  maxFiles: 6,
};
const rutasFooter = Object.keys(import.meta.glob("../pages/*.astro"))
  .map((r) => r.replace("../pages/","").replace(".astro",""))
  .filter((s) => !["index","404","thank-you","thank-you-download"].includes(s))
  .sort();
export const HERRAMIENTAS = ["atomos", "showcase"];
export const PAGINAS = rutasFooter.filter((s) => !HERRAMIENTAS.includes(s));
