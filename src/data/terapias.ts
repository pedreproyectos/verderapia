import { getCollection } from 'astro:content';

export type Terapia = {
  id: string;
  nombre: string;
  descripcion: string;
  duracion: string;
  precio: string;
  extra?: string;
  orden: number;
};

export async function getTerapias(): Promise<Terapia[]> {
  const entries = await getCollection('terapias');
  return entries
    .map((entry) => ({ id: entry.id, ...entry.data }))
    .sort(
      (a, b) =>
        (a.orden ?? 0) - (b.orden ?? 0) || a.nombre.localeCompare(b.nombre),
    );
}
