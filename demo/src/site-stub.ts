// ============================================================
// site.ts — única fuente de verdad del negocio (skill §2.4).
//
// Ningún dato del cliente se escribe dentro de un componente: el layout, el
// grafo de datos estructurados y el widget de contacto leen todo de aquí.
//
// Cliente: Kit Demo Clinic — Demo City. PLACEHOLDER DEMO: NINGÚN valor
// proviene de un negocio real. Precios, cifras, dirección y mensajes son
// inventados; el catálogo del kit NO debe mostrar datos de un cliente.
//
// PROYECTO STANDALONE: el dominio canónico se lee de PUBLIC_SITE_URL en
// build time. baseUrl alimenta canonical/og:url/JSON-LD y debe coincidir
// con el dominio donde se sirve el sitio.
// ============================================================

/** Dominio canónico del cliente (sin barra final). */
const BASE_URL = (
  process.env.PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "https://kitdemo.example.com"
).replace(/\/+$/, "");

export const site = {
  // ── Identidad ──
  name: "Kit Demo Clinic",
  legalName: "Kit Demo Clinic Demo City",
  /** Dominio canónico del sitio web (las llamadas al CRM usan __WACRM_API_URL__) */
  baseUrl: BASE_URL,
  /** Logotipo para fondos claros. Alimenta el nodo del grafo (image/logo). */
  logo: "/logo-light.png",
  /** Logotipo para fondos oscuros (header/footer). Placeholder demo incluido. */
  logoDark: "/logo-dark.png",
  lang: "en-US",

  // ── Contacto ──
  phone: "+52 555 000 0000",
  /** Teléfono en formato internacional para wa.me (solo dígitos) */
  whatsappNumber: "525550000000",
  /** Mensaje pre-rellenado — el ref_code se inyecta al final (wa-ref.ts) */
  whatsappText: "Hi, I'm visiting from your website and I'd like more information about your services.",
  /**
   * Consentimiento SMS del formulario (A2P 10DLC). Redacción legal EXACTA —
   * no parafrasear. {name} lo sustituye ContactFields por site.name; así el
   * texto es de esta marca sin incrustar la marca en el kit.
   */
  smsConsentText:
    "By checking this box, I agree to receive SMS text messages and emails from {name} about my treatment plan, appointments and follow-ups. Message frequency varies. Msg & data rates may apply. Reply STOP to opt out at any time, or HELP for help. Consent is not a condition of purchase.",
  email: "hello@kitdemo.example.com",

  // ── Ubicación ──
  address: {
    street: "123 Demo Street, Suite 100",
    locality: "Demo City",
    region: "Demo State",
    postalCode: "00000",
    country: "US",
  },
  areaServed: ["US", "CA"],

  // ── Negocio (alimenta el nodo principal del grafo, skill §9.2) ──
  schemaType: "LocalBusiness" as const,
  priceRange: "$$",
  currency: "USD",
  openingHours: "Mo-Fr 08:00-19:00, Sa 09:00-14:00",
  languages: ["English"],
  paymentAccepted: ["Cash", "Credit Card", "Debit Card"],

  // ── Autoridad (E-E-A-T) ──
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

  // ── Redes ──
  social: [] as string[],


  // ── Medición ──
  /** Imagen Open Graph, 1200×630 (skill §20) */
  ogImage: "/og.png",
  /** ID de video testimonial (YouTube, fachada bajo demanda). Placeholder
   *  de dominio público (Big Buck Bunny — Blender Foundation). */
  videoId: "aqz-KE-bpKQ",
  /** Vídeo de fondo del hero. ARCHIVOS PROPIOS, no YouTube.
   *
   *  Misma regla que YouTubeLite: el BASE es el VERTICAL (móvil) y el
   *  horizontal es la excepción de escritorio. Si `desktop` se deja igual
   *  que `mobile`, escritorio reutiliza el vertical.
   *
   *  Las rutas van SIN extensión: el componente pide .webm y .mp4.
   *  Mientras los archivos no existan se queda el póster — el hero se ve
   *  correcto, solo que quieto. Receta de compresión en docs/hero-video.md
   *
   *  Los pósters SON EL LCP: locales, nunca miniaturas de YouTube. */
  heroVideo: {
    mobile: "/video/hero",         // → /video/hero.webm  + .mp4   (9:16)
    desktop: "/video/hero-wide",   // → /video/hero-wide.webm + .mp4 (16:9)
    poster: "/gallery/gallery-1.webp",
    posterDesktop: "/gallery/gallery-2.webp",
  },
  /** Indexación SEO. Por defecto NO (la plantilla trae datos genéricos).
   *  Se activa por env SITE_INDEXABLE=true. Gobierna la etiqueta
   *  <meta name="robots"> de cada página. */
  indexable: process.env.SITE_INDEXABLE === "true",

  // ── Widget de contacto flotante (skill §7.7) ──
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

  // ── Catálogo de servicios — alimenta el grafo y la sección de oferta ──
  // Precios DEMO placeholder, en USD. Sin relación con ningún negocio real.
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

  // ── Rating agregado (visible en todas las páginas, respaldado por las
  // ── reseñas renderizadas). Cifras DEMO placeholder. ──
  rating: {
    value: "4.9",
    count: "250",
  },

  // ── Cifras de respaldo (franja de credibilidad, skill §15.1 paso 2).
  // ── DEMO placeholders, sin relación con ningún negocio real. ──
  proof: [
    { num: "4.9/5", label: "from 250 reviews" },
    { num: "2,000+", label: "customers served" },
    { num: "15+", label: "years" },
    { num: "97.5%", label: "demo success rate" },
    { num: "300+", label: "demo visitors annually" },
  ],

  // ── Proceso (reducción de fricción, skill §15.1 paso 6) ──
  steps: [
    { title: "Step 1 — Demo Evaluation", text: "Placeholder step: comprehensive evaluation with our specialist, written demo plan before anything starts. Replace every placeholder field before publishing." },
    { title: "Step 2 — Demo Delivery", text: "Placeholder step: the service is delivered as described in the demo plan. This text demonstrates the rhythm of a step card." },
    { title: "Step 3 — Demo Follow-up", text: "Placeholder step: remote follow-up with your coordinator. The catálogo must never carry a real customer's story." },
  ],

  // ── Preguntas frecuentes (acordeón nativo, cero JS) ──
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

/** Acción principal. Se repite entre 3 y 5 veces con EXACTAMENTE este texto:
 *  variar el texto del botón fragmenta el reconocimiento (skill §15.2). */
export const PRIMARY_CTA = "Get My Quote";

/** Enlace a WhatsApp con el mensaje pre-rellenado. */
export const whatsappHref = `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(site.whatsappText)}`;

/** Links de navegación del Header (editable desde Ajustes del sitio). */
/**
 * Menú del header. Solo destinos que EXISTEN: rutas reales de este sitio.
 * Si el slug se borra, el build canta el 404.
 */
export const MENU_LINKS = [
  { href: "/", text: "Home" },
  { href: "/privacy-policy/", text: "Privacy Policy" },
  { href: "/terms/", text: "Terms" },
];

/**
 * Línea de confianza sobre la barra. Va en todas las money pages.
 * El teléfono sale de site.phone: un número escrito a mano en veinte
 * páginas es un número que un día deja de coincidir con el real.
 */
export const TOPBAR = [
  "Demo site — placeholder data, not a real business",
  `Call us: ${site.phone}`,
  "24/7 Demo Coordinator",
];

// ============================================================
// Estimado — las dos rutas del tratamiento
//
// Vive AQUÍ y no en las props de InstantEstimate porque lo pintan dos
// páginas distintas: la sección del cuestionario y /thank-you. Thank-you no
// monta el componente del estimado, así que si los precios siguieran siendo
// props del componente no tendría de dónde leerlos — y duplicarlos es la
// forma segura de que un día dejen de coincidir.
// ============================================================

/** Las tres formas de responder "cuántas arcadas". */
export type ArchKey = "both" | "upper" | "lower";

export interface Plan {
  /** Valor que viaja al CRM dentro de `package`. */
  key: string;
  /** Número de viajes. ES la diferencia entre los dos planes. */
  trips: string;
  /** Qué implica ese número de viajes, en una línea. */
  tripsNote: string;
  eyebrow: string;
  name: string;
  text: string;
  specs: string;
  /** Precio por arcadas. null = sin precio de lista para esa selección. */
  price: Record<ArchKey, number | null>;
  /** La tarjeta oscura. Solo una de las dos. */
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
    // El catálogo demo solo tiene precio de dos fases para ambas variantes.
    // Para una sola se ofrece presupuesto escrito en vez de inventar la cifra.
    price: { both: 2900, upper: null, lower: null },
  },
];

/** Texto cuando un plan no tiene precio de lista para esa arcada. */
export const QUOTE_FALLBACK = "Written quote in 24 h";

/**
 * Ahorro medio. Solo se usa cuando el lead llega SIN cuestionario: sin
 * presupuesto de EE. UU. no hay resta que hacer, pero seguir enseñando el
 * precio y callar el ahorro desperdicia la página de gracias.
 */
export const AVG_SAVINGS = "50%";

/** Opciones del desplegable de tratamiento. Mismo juego en todo el sitio. */
export const TREATMENT_OPTIONS = [
  { value: "", label: "Select treatment" },
  { value: "service-a-2900", label: "Demo Service One — $2,900" },
  { value: "service-b-2500", label: "Demo Service Two — $2,500" },
  { value: "service-b-1500", label: "Demo Service Two Partial — $1,500" },
  { value: "not-sure", label: "Not sure yet — tell me what I need" },
];

/** Hasta cuándo se sostiene el precio de la página de gracias. */
export const PRICE_LOCK_UNTIL = "December 2026";

/**
 * Subida de radiografía y presupuesto.
 *
 * El endpoint vive en el CRM, igual que /api/events: la base la resuelve
 * getApiBase() en tiempo de ejecución. Si responde error, el bloque cae a
 * WhatsApp — un paciente que ya se decidió a mandar su pano no se puede
 * quedar sin vía.
 */
export const UPLOAD = {
  endpoint: "/api/uploads",
  /** MIME aceptados: documentos y fotos del presupuesto demo. */
  accept: "image/jpeg,image/png,image/webp,application/pdf",
  /** Tope por archivo (MB). Un documento de móvil ronda 3-8 MB. */
  maxSizeMb: 20,
  maxFiles: 6,
};
const rutasFooter = Object.keys(import.meta.glob("../pages/*.astro"))
  .map((r) => r.replace("../pages/","").replace(".astro",""))
  .filter((s) => !["index","404","thank-you","thank-you-download"].includes(s))
  .sort();
export const HERRAMIENTAS = ["atomos", "showcase"];
export const PAGINAS = rutasFooter.filter((s) => !HERRAMIENTAS.includes(s));
