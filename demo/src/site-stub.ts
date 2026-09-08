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
    street: "[BRAND] Street, Suite 100",
    locality: "Demo City",
    region: "Demo State",
    postalCode: "00000",
    country: "US",
  },
  areaServed: ["US", "CA"],

  // ── Negocio (alimenta el nodo principal del grafo, skill §9.2) ──
  schemaType: "Dentist" as const,
  priceRange: "$$",
  currency: "USD",
  openingHours: "Mo-Fr 08:00-19:00, Sa 09:00-14:00",
  languages: ["English"],
  paymentAccepted: ["Cash", "Credit Card", "Debit Card"],

  // ── Autoridad (E-E-A-T) ──
  author: {
    name: "Dr. Demo",
    url: `${BASE_URL}/#doctor`,
    image: "/demo-team.png",
    jobTitle: "D.D.S., M.S. — Placeholder Title",
    knowsAbout: [
      "Demo treatment 1",
      "Demo treatment 2",
      "Demo treatment 3",
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
    poster: "/gallery/gallery-1.png",
    posterDesktop: "/gallery/gallery-2.png",
  },
  /** Indexación SEO. Por defecto NO (la plantilla trae datos genéricos).
   *  Se activa por env SITE_INDEXABLE=true. Gobierna la etiqueta
   *  <meta name="robots"> de cada página. */
  indexable: process.env.SITE_INDEXABLE === "true",

  // ── Widget de contacto flotante (skill §7.7) ──
  widget: {
    aria: "Contact channels",
    pill: "Patient care",
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
      name: "Demo Package A — Both Arches, 2 Trips",
      desc: "First Trip $1,900 + Second Trip $1,000 = $2,900. Demo description for placeholder package one: includes accommodation placeholder and transfers. Replace every [BRAND] field before publishing.",
      price: "2900",
    },
    {
      name: "Demo Package A — First Trip",
      desc: "Demo description for placeholder package two: first phase of the demo treatment. Includes accommodation placeholder and transfers.",
      price: "1900",
    },
    {
      name: "Demo Package A — Second Trip",
      desc: "Demo description for placeholder package three: restorative phase after healing. Includes accommodation placeholder and transfers.",
      price: "1000",
    },
    {
      name: "Demo Package B — Both Arches",
      desc: "Demo description for placeholder package four, single-visit variant. Includes accommodation placeholder.",
      price: "2500",
    },
    {
      name: "Demo Package B — Single Arch",
      desc: "Demo description for placeholder package five, single-visit single-arch variant. Includes accommodation placeholder.",
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
      name: "Demo Option C — Per Arch",
      desc: "Demo description for placeholder option C.",
      price: "2200",
    },
    {
      name: "Demo Option D — Per Arch",
      desc: "Demo description for placeholder option D.",
      price: "2400",
    },
    {
      name: "Demo Entry Option — Per Arch",
      desc: "Demo description for the entry-level placeholder option.",
      price: "900",
    },
    {
      name: "Demo Single Unit — Crown Included",
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
    { num: "2,000+", label: "patients treated" },
    { num: "15+", label: "years" },
    { num: "97.5%", label: "success rate" },
    { num: "300+", label: "dental tourists annually" },
  ],

  // ── Proceso (reducción de fricción, skill §15.1 paso 6) ──
  steps: [
    { title: "Day 1 — Evaluation & Digital Planning", text: "Comprehensive evaluation with our specialist. Intraoral scan, clinical photographs, CBCT 3D scan, and personalized treatment plan. Your exact USD cost is written before any treatment starts." },
    { title: "Day 2 — Implant Surgery Under IV Sedation", text: "Tooth extractions if needed, placement of 4 to 6 implants, impressions for the provisional prosthesis. Post-operative instructions and medications." },
    { title: "Days 3–4 — Wax Rollers Try-In", text: "Post-surgical check-up. Wax rollers for vertical dimension, bite relationship, midline, lip support, aesthetics and phonetics." },
    { title: "Days 4–5 — Provisional Prosthesis Try-In", text: "Try-in of the provisional prosthesis in resin. Evaluation of tooth shape, smile design, occlusion and phonetics. In some cases, two try-ins may be needed." },
    { title: "Days 5–6 — Delivery of Temporary Screw-Retained Prosthesis", text: "Fixed provisional prosthesis placed. Occlusal adjustments, hygiene and diet instructions. You leave Demo City with your new smile." },
    { title: "4 Months Healing — Osseointegration Period", text: "Time needed for the implants to integrate with the bone and provide a strong, long-lasting foundation. Remote follow-up with your 24/7 English coordinator." },
    { title: "Final Protocol — Permanent Screw-Retained Prosthesis", text: "Clinical and radiographic evaluation, final scans and impressions, esthetic and functional try-ins, and fabrication of your final zirconia prosthesis. Strong, esthetic and made to last." },
  ],

  // ── Preguntas frecuentes (acordeón nativo, cero JS) ──
  faq: [
    {
      q: "How much does Demo Package A really cost in Demo City?",
      a: "At Kit Demo Clinic by Dr. Demo: Demo Package A (both arches, 2 trips) is $2,900 — First Trip $1,900 + Second Trip $1,000. Package B is $1,500 for one arch or $2,500 for both arches. Additional unit $250. All prices in USD, with partner-hotel accommodation placeholder and transfers included. No hidden fees — your written quote before you travel.",
    },
    {
      q: "Why is Demo Package A so much more affordable?",
      a: "Lower operating costs and our own on-site lab — NOT cheaper materials. We use the same FDA-approved implant systems and hospital-grade sterilization that US clinics use. 2,000+ international patients have trusted us with their smiles.",
    },
    {
      q: "Is Teeth in a Day included in the price?",
      a: "Yes. A non-removable temporary screw-retained bridge is delivered on days 5–6 of your stay (wax rollers days 3–4, provisional try-in days 4–5). It is included in every surgical package. The final restoration comes after healing: hybrid in 10 business days for Package B candidates, or permanent zirconia on the second trip at about 4 months.",
    },
    {
      q: "Is the hotel really included? Which one?",
      a: "Yes. Every full-mouth package includes 6 nights for 2 guests at a partner hotel close to the clinic, with airport transfers. You can upgrade to a beachfront stay if you prefer.",
    },
    {
      q: "How long does the whole process take?",
      a: "First trip: 6 business days — Day 1 evaluation and CBCT, Day 2 implant surgery under IV sedation, Days 3–4 wax rollers, Days 4–5 provisional try-in, Days 5–6 delivery of temporary screw-retained teeth. You fly home with fixed teeth. After 4 months of healing, the final restorative protocol is completed on a short second trip. Package B candidates may receive the final hybrid in 10 business days.",
    },
    {
      q: "Do I need a bone graft for Demo Package A?",
      a: "Most patients do NOT. The technique uses angled implants to maximize existing bone. If severe bone loss is present, Dr. Demo is a certified zygomatic implant surgeon — zygomatic implants anchor to the cheekbone ($1,100 per unit) with no graft needed.",
    },
    {
      q: "Is it safe to get dental implants abroad?",
      a: "Absolutely. Dr. Demo is a board-certified placeholder credential (D.D.S., M.S.) with 15+ years of experience. We use FDA-approved implant systems, guided surgery, hospital-grade sterilization and IV sedation. 97.5% success rate across 2,000+ international patients.",
    },
    {
      q: "How long do the implants last?",
      a: "FDA-approved implant systems are designed to last 20–30 years or more with proper care. The prosthetic arch lasts 6–8 years (hybrid) or 12+ years (zirconia).",
    },
    {
      q: "How much does a full mouth cost in Demo City?",
      a: "At Kit Demo Clinic: Demo Package A (both arches, 2 trips) is $2,900 — First Trip $1,900 + Second Trip $1,000. Package B is $2,500 for both arches or $1,500 for one arch. Additional unit $250. Transparent pricing always — your written quote is guaranteed for 12 months.",
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
  "Demo placeholders — replace every [BRAND] field before publishing",
  `Call us: ${site.phone}`,
  "24/7 Patient Coordinator",
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
    key: "one-trip",
    trips: "1 trip",
    tripsNote: "One visit · fly home with your final teeth",
    eyebrow: "Most chosen",
    name: "Package B — Fixed Hybrid",
    text: "Temporary bridge on days 5–6 and final hybrid arch in 10 business days, made in our own lab. Travel included.",
    specs: "Demo treatment · IV sedation · 10 business days · hotel + transfers",
    price: { both: 2500, upper: 1500, lower: 1500 },
    dark: true,
  },
  {
    key: "two-trips",
    trips: "2 trips",
    tripsNote: "Two visits · surgery now, permanent zirconia at ~4 months",
    eyebrow: "Permanent zirconia",
    name: "Demo Package A",
    text: "First Trip $1,900 + Second Trip $1,000. Zirconia after 4 months of healing.",
    specs: "Demo treatment · IV sedation · 6 + 6 business days · hotel + transfers",
    // El catálogo demo solo tiene precio de dos viajes para ambas arcadas.
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
  { value: "package-a-2900", label: "Demo Package A — $2,900" },
  { value: "package-b-both-2500", label: "Demo Package B Both Arches — $2,500" },
  { value: "package-b-single-1500", label: "Demo Package B Single Arch — $1,500" },
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
  /** MIME aceptados: radiografías, fotos y PDF del presupuesto. */
  accept: "image/jpeg,image/png,image/heic,image/webp,application/pdf,.dcm",
  /** Tope por archivo (MB). Una pano de móvil ronda 3-8 MB. */
  maxSizeMb: 20,
  maxFiles: 6,
};
const rutasFooter = Object.keys(import.meta.glob("../pages/*.astro"))
  .map((r) => r.replace("../pages/","").replace(".astro",""))
  .filter((s) => !["index","404","thank-you","thank-you-download"].includes(s))
  .sort();
export const HERRAMIENTAS = ["atomos", "showcase"];
export const PAGINAS = rutasFooter.filter((s) => !HERRAMIENTAS.includes(s));
