import { getCollection } from 'astro:content';

export type ServicioClase = { hora?: string; nombre?: string };
export type ServicioHorario = { dia?: string; clases: ServicioClase[] };
export type ServicioPrecio = { nombre?: string; detalle?: string; valor?: string };

export type Servicio = {
  id: string;
  nombre: string;
  descripcion?: string;
  imagen?: string;
  horarios: ServicioHorario[];
  precios: ServicioPrecio[];
  nota?: string;
};

export async function getServicios(): Promise<Servicio[]> {
  const entries = await getCollection('servicios');
  return entries.map((entry) => ({ id: entry.id, ...entry.data }));
}
