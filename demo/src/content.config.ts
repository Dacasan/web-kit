import { defineCollection, z } from 'astro:content';
import type { Loader } from 'astro/loaders';

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
    href: z.string(),
    title: z.string().min(3).max(60),
    excerpt: z.string().min(20).max(200),
    image: z.string().optional(),
    order: z.number().optional(),
  }),
});

export const collections = { paginas: paginasCollection };
