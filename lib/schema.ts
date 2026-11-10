
import { site } from '@agenciaweb/kit-site';

export type SchemaNode = Record<string, unknown> & { "@type": string; "@id"?: string };

const { geo, medicalSpecialty, openingHoursSpec } = site as {
  geo?: { lat: number; lng: number };
  medicalSpecialty?: string;
  openingHoursSpec?: { days: string[]; opens: string; closes: string }[];
};

interface GraphInput {
  url: string;
  title: string;
  description: string;
  breadcrumb?: { name: string; item?: string }[];
  faq?: readonly { q: string; a: string }[];
  steps?: readonly { title: string; text: string }[];
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
    worksFor: { "@id": `${siteUrl}#business` },
  });

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
    ...(geo ? { geo: { "@type": "GeoCoordinates", latitude: geo.lat, longitude: geo.lng } } : {}),
    ...(medicalSpecialty ? { medicalSpecialty } : {}),
    knowsLanguage: [...site.languages],
    paymentAccepted: [...site.paymentAccepted],
    currenciesAccepted: site.currency,
    founder: { "@id": `${siteUrl}#author` },
    ...(site.sameAs && site.sameAs.length > 0 ? { sameAs: [...site.sameAs] } : {}),
    // Service y no Product: conserva provider/areaServed; DentalProcedure no existe.
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: (site as { offerCatalogName?: string }).offerCatalogName ?? `Services — ${site.name}`,
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

  if (product) {
    graph.push({
      // Sin aggregateRating: Google invalida Service y tumba el nodo entero.
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
      name: (site as { howToName?: string }).howToName ?? `How it works at ${site.name}`,
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
