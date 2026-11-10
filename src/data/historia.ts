import { getCollection } from 'astro:content';

export type Historia = {
  eyebrow?: string;
  titulo?: string;
  texto?: string;
  imagen?: string;
  imagen2?: string;
};

/**
 * Devuelve el contenido de la sección "Historia" del home.
 * Es un singleton: si aún no se ha creado, devuelve `undefined`.
 */
export async function getHistoria(): Promise<Historia | undefined> {
  const entries = await getCollection('historia');
  return entries[0]?.data;
}
