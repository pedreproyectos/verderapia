import { getCollection } from 'astro:content';

export type Pilar = {
  id: string;
  titulo: string;
  eyebrow?: string;
  subtitulo?: string;
  descripcion?: string;
  items: string[];
  imagen: string;
  order: number;
};

/**
 * Devuelve los pilares del sitio (Verde, Arte, Terapia), ordenados por `order`.
 * El `id` coincide con el nombre del archivo y define el ancla (#verde, #arte, #terapia).
 */
export async function getPilares(): Promise<Pilar[]> {
  const entries = await getCollection('pilares');
  return entries
    .map((entry) => ({ id: entry.id, ...entry.data }))
    .sort((a, b) => a.order - b.order);
}
