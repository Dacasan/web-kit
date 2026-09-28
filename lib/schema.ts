// ============================================================
// Grafo de datos estructurados (skill §9.2).
//
// Cada página emite UN SOLO bloque JSON-LD con un `@graph`, donde los nodos
// se referencian entre sí por `@id` en lugar de duplicarse. El tipo del
// negocio sale de `site.schemaType`, no se escribe fijo.
// ============================================================

import { site } from '@agenciaweb/kit-site';

export type SchemaNode = Record<string, unknown> & { "@type": string; "@id"?: string };

// El catálogo y el nodo #product van como `Service` en todos los casos.
// Motivo, verificado contra schema.org v30.1: `DentalProcedure` no existe, y
// `availableService` exige dominio Hospital|MedicalClinic|Physician — por eso
// la oferta se expone con `hasOfferCatalog` → OfferCatalog (⊂ ItemList →
// ListItem → item), cuyo `item` admite `Service`, y `Service` sí admite
// `offers` (precios). Cadena comprobada: OfferCatalog⊂ItemList, itemListElement
// dom=ItemList/rng=ListItem, item dom=ListItem/rng=Thing, offers dom incluye Service.
//
// Cast local — mismo patrón que SeoHead.astro:64: los campos son OPCIONALES a
// nivel de tipos, de modo que un sitio que actualice el kit sin declararlos
// sigue compilando (ausente = el nodo no emite esa propiedad). Verificado con
// tsc 6.0.3 --strict: un objeto sin esos campos sí convierte a este tipo.
const { geo, medicalSpecialty, openingHoursSpec } = site as {
  geo?: { lat: number; lng: number };
  medicalSpecialty?: string;
  openingHoursSpec?: { days: string[]; opens: string; closes: string }[];
};

interface GraphInput {
  /** URL absoluta de la página actual. */
  url: string;
  title: string;
  description: string;
  /** Migas: todos los niveles salvo el último llevan `item`. */
  breadcrumb?: { name: string; item?: string }[];
  /** Emite el nodo FAQPage. Mínimo 2 preguntas. */
  faq?: readonly { q: string; a: string }[];
  /** Emite el nodo HowTo. Mínimo 2 pasos. */
  steps?: readonly { title: string; text: string }[];
  /**
   * Producto/tratamiento de la página. Emite un nodo de servicio con Offer
   * (costo) y AggregateRating (estrellas + conteo). NO es opcional: es el
   * bloque que gana rich snippets de rating, reviews y precio.
   */
  product?: {
    name: string;
    description?: string;
    price?: string;
    ratingValue?: string;
    ratingCount?: string;
  };
}

export function buildGraph({
  url,
  title,
  description,
  breadcrumb = [],
  faq = [],
  steps = [],
  product,
}: GraphInput): { "@context": string; "@graph": SchemaNode[] } {
  const siteUrl = site.baseUrl;
  const ogImage = `${siteUrl}${site.ogImage}`;
  const graph: SchemaNode[] = [];

  graph.push({
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: title,
    description,
    isPartOf: { "@id": `${siteUrl}#website` },
    author: { "@id": `${siteUrl}#author` },
    primaryImageOfPage: { "@id": `${url}#primaryimage` },
    ...(breadcrumb.length ? { breadcrumb: { "@id": `${url}#breadcrumb` } } : {}),
    inLanguage: site.lang,
  });

  if (breadcrumb.length) {
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: breadcrumb.map((b, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: b.name,
        // `item` va absoluto: una ruta relativa ("/") no es una URL para
        // BreadcrumbList. Mismo patrón que SeoHead.astro:69 (ogFullUrl) —
        // un valor que ya viene absoluto se deja tal cual.
        ...(b.item
          ? { item: b.item.startsWith("http") ? b.item : `${siteUrl}${b.item}` }
          : {}),
      })),
    });
  }

  graph.push({
    "@type": "ImageObject",
    "@id": `${url}#primaryimage`,
    url: ogImage,
    contentUrl: ogImage,
    width: 1200,
    height: 630,
  });

  graph.push({
    "@type": "WebSite",
    "@id": `${siteUrl}#website`,
    url: siteUrl,
    name: site.name,
    inLanguage: site.lang,
    ...(site.social.length ? { sameAs: [...site.social] } : {}),
  });

  graph.push({
    "@type": "Person",
    "@id": `${siteUrl}#author`,
    name: site.author.name,
    url: site.author.url,
    image: `${siteUrl}${site.author.image}`,
    jobTitle: site.author.jobTitle,
    knowsAbout: [...site.author.knowsAbout],
    ...(site.author.sameAs.length ? { sameAs: [...site.author.sameAs] } : {}),
    // E-E-A-T: enlace inverso persona → negocio (el negocio declara a la
    // persona vía `founder`). `worksFor` dom=Person, rng=Organization ✅.
    worksFor: { "@id": `${siteUrl}#business` },
  });

  // Entidad principal del negocio. `areaServed` va como array de nodos
  // Country, uno por país: agrupar varios en un solo nodo es incorrecto.
  graph.push({
    "@type": site.schemaType,
    "@id": `${siteUrl}#business`,
    name: site.name,
    legalName: site.legalName,
    url: siteUrl,
    telephone: site.phone,
    email: site.email,
    priceRange: site.priceRange,
    image: `${siteUrl}${site.logo}`,
    logo: `${siteUrl}${site.logo}`,
    description,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.locality,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    areaServed: site.areaServed.map((c) => ({ "@type": "Country", name: c })),
    openingHours: site.openingHours,
    // Horario estructurado — `openingHoursSpecification` es lo que Google
    // documenta como recommended para LocalBusiness; `openingHours` (Text) no
    // está en esa lista, por eso se mantiene el uno y se añade el otro.
    // `dayOfWeek` va con nombres completos: el enumerado DayOfWeek (v30.1) no
    // contiene "Mo" ni ninguna abreviatura.
    ...(openingHoursSpec && openingHoursSpec.length
      ? {
          openingHoursSpecification: openingHoursSpec.map((h) => ({
            "@type": "OpeningHoursSpecification",
            dayOfWeek: h.days,
            opens: h.opens,
            closes: h.closes,
          })),
        }
      : {}),
    // NAP/local: `geo` dom=Place (Dentist ⊂ Place ✅). Google exige al menos
    // 5 decimales de precisión en latitude/longitude.
    ...(geo ? { geo: { "@type": "GeoCoordinates", latitude: geo.lat, longitude: geo.lng } } : {}),
    // Miembro del enumerado MedicalSpecialty (v30.1). Dominio de la propiedad
    // = Hospital|MedicalClinic|MedicalOrganization|Physician, y Dentist ⊂
    // MedicalOrganization ✅.
    ...(medicalSpecialty ? { medicalSpecialty } : {}),
    knowsLanguage: [...site.languages],
    paymentAccepted: [...site.paymentAccepted],
    currenciesAccepted: site.currency,
    // E-E-A-T: el negocio declara a su fundador (inverso de `worksFor` del
    // nodo Person). `founder` dom=Organization, rng=Organization|Person ✅.
    founder: { "@id": `${siteUrl}#author` },
    // SIN aggregateRating: Google no admite reseñas autoservidas en el nodo
    // LocalBusiness/Dentist (self-serving review markup) y es vector de acción
    // manual. El rating SÍ se muestra como texto visible en la cabecera; esto
    // solo retira el marcado. Ver sameAs abajo para consolidar la entidad con
    // la ficha de Google, que es de donde deben salir las estrellas de la SERP.
    ...(site.sameAs && site.sameAs.length > 0 ? { sameAs: [...site.sameAs] } : {}),
    // Catálogo de ofertas — sustituye a `availableService`, cuyo dominio no
    // incluye Dentist. Cada servicio mantiene su precio: `offers` es válido
    // sobre `Service`, que es lo que `item` espera en rango (rng=Thing).
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `Treatments — ${site.name}`,
      itemListElement: site.services.map((s, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Service",
          name: s.name,
          description: s.desc,
          provider: { "@id": `${siteUrl}#business` },
          offers: {
            "@type": "Offer",
            price: s.price,
            priceCurrency: site.currency,
          },
        },
      })),
    },
  });

  // Nodo de producto/tratamiento de la página: el bloque que gana rich
  // snippets de estrellas, reviews y precio en la SERP.
  if (product) {
    graph.push({
      // `Service` (no `DentalProcedure`: el tipo no existe). Elegido sobre
      // `Product` porque conserva `provider` y `areaServed`, que el dominio de
      // `Product` excluye — y el snippet de producto ya no aparece en la SERP.
      "@type": "Service",
      "@id": `${url}#product`,
      name: product.name,
      url,
      ...(product.description ? { description: product.description } : {}),
      provider: { "@id": `${siteUrl}#business` },
      areaServed: site.areaServed.map((c) => ({ "@type": "Country", name: c })),
      ...(product.price
        ? {
            offers: {
              "@type": "Offer",
              price: product.price,
              priceCurrency: site.currency,
              availability: "https://schema.org/InStock",
              url,
            },
          }
        : {}),
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.ratingValue ?? site.rating.value,
        ratingCount: product.ratingCount ?? site.rating.count,
        bestRating: "5",
        reviewCount: product.ratingCount ?? site.rating.count,
      },
    });
  }

  if (faq.length >= 2) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }

  if (steps.length >= 2) {
    graph.push({
      "@type": "HowTo",
      "@id": `${url}#howto`,
      name: `How to start your treatment at ${site.name}`,
      step: steps.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: s.title,
        text: s.text,
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}
