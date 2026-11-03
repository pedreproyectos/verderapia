import { getCollection } from 'astro:content';

export type HeroSlide = {
  id: string;
  title: string;
  eyebrow?: string;
  text?: string;
  image: string;
  alt?: string;
  order: number;
};

/**
 * Devuelve las diapositivas del slider principal, ordenadas por `order`.
 */
export async function getHeroSlides(): Promise<HeroSlide[]> {
  const entries = await getCollection('slides');
  return entries
    .map((entry) => ({ id: entry.id, ...entry.data }))
    .sort((a, b) => a.order - b.order);
}
