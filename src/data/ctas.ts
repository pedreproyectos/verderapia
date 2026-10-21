import { getCollection } from 'astro:content';

export type Cta = {
  id: string;
  label: string;
  href: string;
  principal: boolean;
  order: number;
  external: boolean;
};

/**
 * Devuelve los call to action del sitio.
 * El principal va primero; el resto se ordena con `order`.
 */
export async function getCtas(): Promise<Cta[]> {
  const entries = await getCollection('ctas');
  return entries
    .map((entry) => ({ id: entry.id, ...entry.data }))
    .sort((a, b) => {
      if (a.principal !== b.principal) return a.principal ? -1 : 1;
      return a.order - b.order;
    });
}

/** El call to action principal (o el primero por orden si no hay ninguno marcado). */
export async function getMainCta(): Promise<Cta | undefined> {
  const [first] = await getCtas();
  return first;
}
