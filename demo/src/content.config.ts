// Colección de contenido: el índice de páginas del sitio.
//
// POR QUÉ UN LOADER PROPIO Y NO glob(). Los loaders que trae Astro cargan
// ARCHIVOS DE CONTENIDO —.md, .json, .yaml—. Aquí el contenido no vive en
// archivos aparte: vive en las páginas, que son .astro. Sacar los excerpts a
// un JSON los alejaría de la página que describen, y ese es exactamente el
// problema que veníamos a resolver: un título que se cambia en la página y
// se queda viejo en los veinte sitios que la enlazan.
//
// El loader lee lo que cada página exporta en su frontmatter:
//
//   export const meta = {
//     title: "All-on-4 Mexico Cost",
//     excerpt: "From $14,990 all-inclusive. Fixed teeth day 1.",
//     image: "/gallery/gallery-1.webp",
//   };
//
// Una página nueva entra en el índice por existir; una que se borra
// desaparece sola. Y el esquema de Zod hace que un excerpt que falta rompa
// el build en vez de dejar una tarjeta con el hueco en blanco.
import { defineCollection, z } from 'astro:content';
import type { Loader } from 'astro/loaders';

// import.meta.glob lo resuelve Vite en tiempo de compilación, así que no hay
// que leer ni parsear archivos a mano: Astro compila las páginas y aquí
// llegan sus exports ya evaluados.
//
// SIN eager, y no es un detalle: con eager las páginas se importarían al
// evaluar este módulo, y una página que consume la colección importa
// astro:content, que necesita esta configuración. Ciclo. Importándolas
// dentro de load() el ciclo no llega a formarse.
const paginas = import.meta.glob<{ meta?: Record<string, unknown> }>('./pages/*.astro');

const hrefDe = (ruta: string) => {
  const slug = ruta.replace('./pages/', '').replace(/\.astro$/, '');
  return slug === 'index' ? '/' : `/${slug}`;
};

const loaderDePaginas: Loader = {
  name: 'paginas-astro',
  load: async ({ store, parseData }) => {
    store.clear();
    for (const [ruta, importar] of Object.entries(paginas)) {
      const mod = await importar();
      if (!mod?.meta) continue;   // una página sin `meta` simplemente no se enlaza
      const id = hrefDe(ruta);
      const data = await parseData({ id, data: { ...mod.meta, href: id }, filePath: ruta });
      store.set({ id, data });
    }
  },
};

const paginasCollection = defineCollection({
  loader: loaderDePaginas,
  schema: z.object({
    /** Ruta desde la raíz. La pone el loader con el nombre del archivo. */
    href: z.string(),
    /**
     * Título CORTO, para leer dentro de una tarjeta. No es el <title>: aquel
     * es texto para la SERP, donde hay que ganarse el clic de un
     * desconocido; este es un enlace interno, donde el visitante ya está
     * dentro y solo quiere saber si es la página que busca.
     */
    title: z.string().min(3).max(60),
    /** Una frase. La que decide el clic. */
    excerpt: z.string().min(20).max(200),
    image: z.string().optional(),
    /** Orden en el índice. Sin él, alfabético por ruta. */
    order: z.number().optional(),
  }),
});

export const collections = { paginas: paginasCollection };
