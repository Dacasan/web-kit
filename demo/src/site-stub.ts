// ============================================================
// site.ts — única fuente de verdad del negocio (skill §2.4).
//
// Ningún dato del cliente se escribe dentro de un componente: el layout, el
// grafo de datos estructurados y el widget de contacto leen todo de aquí.
//
// Cliente: Kit Demo Clinic — Demo City, Mexico. Datos verificados con
// el cliente (index.html de referencia). Antes de poner `indexable: true`,
// confirmar que logo.svg, og.png y equipo.webp sean los reales del cliente
// (hoy son marcadores genéricos del fork).
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
  /** Logotipo real del cliente. Alimenta el nodo del grafo (image/logo). */
  logo: "/logo-a4-light.png",
  lang: "en-US",

  // ── Contacto ──
  phone: "+52 555 000 0000",
  /** Teléfono en formato internacional para wa.me (solo dígitos) */
  whatsappNumber: "525550000000",
  /** Mensaje pre-rellenado — el ref_code se inyecta al final (wa-ref.ts) */
  whatsappText: "Hi, I'm visiting from your website and I'd like more information about All-on-X implants in Demo City.",
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
    street: "Col. Luis Donaldo Colosio Supermanzana 310 Manzana 1 Lote 4, Residencial Cumbres",
    locality: "Cancún",
    region: "Quintana Roo",
    postalCode: "77560",
    country: "MX",
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
    url: "https://kitdemo.example.com/#doctor",
    image: "/equipo.webp",
    jobTitle: "D.D.S., M.S. — Oral & Maxillofacial Surgeon",
    knowsAbout: [
      "All-on-X / All-on-5 / All-on-6",
      "Zygomatic implants (certified)",
      "Sinus lift & bone grafting",
      "Zirconium restorations",
      "Torus removal",
      "Orthognathic surgery",
    ],
    sameAs: [] as string[],
  },
  certifications: [] as string[],

  // ── Redes ──
  social: [] as string[],


  // ── Medición ──
  /** Imagen Open Graph, 1200×630 (skill §20) */
  ogImage: "/og.png",
  /** ID de video testimonial (YouTube, fachada bajo demanda) */
  videoId: "3H-6gGOO_QI",
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
   *  Los pósters SON EL LCP: WebP locales, nunca miniaturas de YouTube. */
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
  // Precios oficiales (agosto 2026), en USD para pacientes US/CA.
  // Fuente: documentos oficiales de la clínica + plan V4.
  services: [
    {
      name: "All-Inclusive Full Mouth — Both Arches, 2 Trips",
      desc: "First Trip Surgical $12,800 + Second Trip Restorative Zirconia $7,000 = $19,800. 4 implants per arch, extractions, bone grafts & PRF, IV sedation, non-removable temporary bridge days 5–6, final zirconia Prettau. Hotel Fiesta Inn Cumbres 6 nights for 2 guests + transfers included.",
      price: "19800",
    },
    {
      name: "First Trip Surgical Phase — Both Arches",
      desc: "6 business days: D1 evaluation/CBCT, D2 surgery IV sedation, D3–4 wax rollers, D4–5 provisional, D5–6 temporary screw-retained bridge. 4 implants per arch, extractions, bone grafts & PRF included. Hotel 6 nights 2 guests + transfers.",
      price: "12800",
    },
    {
      name: "Second Trip Restorative Phase — Both Arches",
      desc: "After 4 months healing, 6 business days: 2 Zirconia superstructures, abutments, night guard. Hotel 6 nights 2 guests + transfers included.",
      price: "7000",
    },
    {
      name: "One Trip — Both Arches",
      desc: "10 business days: temporary bridge days 5–6, final hybrid in 10 days via in-house lab. For edentulous or infection-free candidates with torque tests passed. Hotel included.",
      price: "14990",
    },
    {
      name: "One Trip — Single Arch",
      desc: "One arch, same timeline: temporary bridge days 5–6, final hybrid in 10 business days. Hotel included.",
      price: "9000",
    },
    {
      name: "Additional Implant",
      desc: "Per implant, beyond the 4 per arch included in the package. Determined clinically after Dr. Demo evaluates your case.",
      price: "900",
    },
    {
      name: "Zygomatic Implant — Per Unit",
      desc: "For severe maxillary bone loss: anchors to cheekbone 40–55mm, no graft, no sinus lift. Dr. Demo, certified and pioneer in Mexico since 2019.",
      price: "4500",
    },
    {
      name: "All-on-6 — Per Arch",
      desc: "6 implants per arch, stronger bite (90%), added support.",
      price: "12000",
    },
    {
      name: "3-on-6 — Per Arch",
      desc: "6 implants, 3 bridges. No bulky artificial gums, ultra-lightweight.",
      price: "13000",
    },
    {
      name: "Snap-On Denture — Per Arch",
      desc: "2–4 implants, removable overdenture. Most affordable fixed-arch option.",
      price: "3000",
    },
    {
      name: "Single Tooth Implant — Crown Included",
      desc: "One implant, abutment and zirconia crown. Same Nobel Biocare/Straumann systems.",
      price: "1600",
    },
  ],

  // ── Rating agregado (4.9/5 · 1,247 reviews — visible en todas las páginas,
  // ── respaldado por las reseñas renderizadas) ──
  rating: {
    value: "4.9",
    count: "1247",
  },

  // ── Cifras de respaldo (franja de credibilidad, skill §15.1 paso 2) ──
  proof: [
    { num: "4.9/5", label: "from 1,247 reviews" },
    { num: "8,000+", label: "Americans & Canadians treated" },
    { num: "25+", label: "years" },
    { num: "98.2%", label: "success rate" },
    { num: "1,000+", label: "dental tourists annually" },
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
      q: "How much does All-on-X really cost in Demo City?",
      a: "At KitDemoClinic by Dr. Demo: All-Inclusive Full Mouth (both arches, 2 trips) is $19,800 — First Trip Surgical $12,800 + Second Trip Restorative Zirconia $7,000. One Trip is $9,000 for one arch or $14,990 for both arches. Additional implant $900. All prices in USD, with hotel Fiesta Inn Cumbres 6 nights for 2 guests and transfers included. No hidden fees — your written quote before you travel.",
    },
    {
      q: "Why is All-on-X in Mexico so much more affordable?",
      a: "Lower operating costs and our own on-site lab — NOT cheaper materials. We use the same FDA-approved Nobel Biocare, Straumann and BioHorizons implants, Navident guided surgery, and hospital-grade sterilization that US clinics use. 8,000+ Americans and Canadians have trusted us with their smiles.",
    },
    {
      q: "Is Teeth in a Day included in the price?",
      a: "Yes. A non-removable temporary screw-retained bridge is delivered on days 5–6 of your stay (wax rollers days 3–4, provisional try-in days 4–5). It is included in every surgical package. The final restoration comes after healing: hybrid in 10 business days for One Trip candidates, or permanent zirconia on the second trip at about 4 months.",
    },
    {
      q: "Is the hotel really included? Which one?",
      a: "Yes. Every full-mouth package includes 6 nights for 2 guests at Fiesta Inn Cumbres Cancún with airport transfers. The clinic is a short walk from the hotel. You can upgrade to a beachfront Hotel Zone stay if you prefer.",
    },
    {
      q: "How long does the whole process take?",
      a: "First trip: 6 business days — Day 1 evaluation and CBCT, Day 2 implant surgery under IV sedation, Days 3–4 wax rollers, Days 4–5 provisional try-in, Days 5–6 delivery of temporary screw-retained teeth. You fly home with fixed teeth. After 4 months of healing, the final restorative protocol is completed on a short second trip. One Trip candidates may receive the final hybrid in 10 business days.",
    },
    {
      q: "Do I need a bone graft for All-on-X?",
      a: "Most patients do NOT. The All-on-X technique uses angled implants to maximize existing bone. If severe bone loss is present, Dr. Demo is a certified zygomatic implant surgeon — zygomatic implants anchor to the cheekbone ($4,500 per unit) with no graft needed.",
    },
    {
      q: "Is it safe to get dental implants in Mexico?",
      a: "Absolutely. Dr. Demo is a board-certified Oral & Maxillofacial Surgeon (D.D.S., M.S.) with 25+ years of experience, member of IAOMS, ICOI, the Mexican Board of Oral and Maxillofacial Surgery and AOCMF. We use Nobel Biocare implants, Navident guided surgery, hospital-grade sterilization and IV sedation. 98.2% success rate across 8,000+ American and Canadian patients.",
    },
    {
      q: "How long do the implants last?",
      a: "Nobel Biocare implants carry a lifetime warranty and are designed to last 20–30 years or more with proper care. The prosthetic arch lasts 6–8 years (hybrid) or 12+ years (zirconia Prettau, which never stains and is our standard for final restorations).",
    },
    {
      q: "How much does a full mouth cost in Mexico?",
      a: "At KitDemoClinic: the All-Inclusive Full Mouth (both arches, 2 trips, permanent zirconia) is $19,800 — First Trip Surgical $12,800 + Second Trip Restorative $7,000. One Trip is $14,990 for both arches or $9,000 for one arch. Additional implant $900. Transparent pricing always — your written quote is guaranteed for 12 months.",
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
 * Menú de las páginas SEO. Cuatro destinos, todos PÁGINAS REALES.
 *
 * Antes eran anclas (#cost, #process, #vacation, #faq) heredadas del fork:
 * #vacation no existía en ninguna página del sitio, #cost solo en una y
 * #process faltaba en otra. Un menú con anclas muertas no falla de forma
 * visible — simplemente no pasa nada al pulsar — así que aguantó cinco
 * páginas sin que nadie lo notara. Con rutas no puede pasar: si el slug se
 * borra, el build canta el 404.
 */
export const MENU_LINKS = [
  { href: "/all-on-4-dental-implants-demo city-cost/", text: "Demo City Cost" },
  { href: "/about/", text: "About Us" },
  { href: "/all-on-4-reviews-mexico/", text: "Reviews" },
  { href: "/dental-implant-vacation-packages-cost/", text: "Vacation Packages" },
];

/**
 * Línea de confianza sobre la barra. Va en todas las money pages.
 * El teléfono sale de site.phone: un número escrito a mano en veinte
 * páginas es un número que un día deja de coincidir con el real.
 */
export const TOPBAR = [
  "Now in Demo City, Mexico — Serving USA & Canada Since 2019",
  `Cancún Line: ${site.phone}`,
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
    name: "One Trip — Fixed Hybrid",
    text: "Temporary bridge on days 5–6 and final hybrid arch in 10 business days, made in our own lab. Travel included.",
    specs: "All-on-X · IV sedation · 10 business days · hotel + transfers",
    price: { both: 14990, upper: 9000, lower: 9000 },
    dark: true,
  },
  {
    key: "two-trips",
    trips: "2 trips",
    tripsNote: "Two visits · surgery now, permanent zirconia at ~4 months",
    eyebrow: "Permanent zirconia",
    name: "All-Inclusive Full Mouth",
    text: "First Trip Surgical $12,800 + Second Trip Restorative $7,000. Zirconia Prettau after 4 months of healing.",
    specs: "All-on-X · IV sedation · 6 + 6 business days · hotel + transfers",
    // El catálogo solo tiene precio de dos viajes para ambas arcadas. Para
    // una sola se ofrece presupuesto escrito en vez de inventar la cifra.
    price: { both: 19800, upper: null, lower: null },
  },
];

/** Texto cuando un plan no tiene precio de lista para esa arcada. */
export const QUOTE_FALLBACK = "Written quote in 24 h";

/**
 * Ahorro medio. Solo se usa cuando el lead llega SIN cuestionario: sin
 * presupuesto de EE. UU. no hay resta que hacer, pero seguir enseñando el
 * precio y callar el ahorro desperdicia la página de gracias.
 */
export const AVG_SAVINGS = "60%";

/** Opciones del desplegable de tratamiento. Mismo juego en todo el sitio. */
export const TREATMENT_OPTIONS = [
  { value: "", label: "Select treatment" },
  { value: "all-inclusive-19800", label: "All-Inclusive Full Mouth Zirconia — $19,800" },
  { value: "one-trip-both-14990", label: "One Trip Both Arches — $14,990" },
  { value: "one-trip-single-9000", label: "One Trip Single Arch — $9,000" },
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
