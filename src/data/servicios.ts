import { getCollection } from 'astro:content';

export type ServicioClase = { hora?: string; nombre?: string };
export type ServicioHorario = { dia?: string; clases: ServicioClase[] };
export type ServicioPrecio = { nombre?: string; detalle?: string; valor?: string };
export type ServicioItem = {
  nombre: string;
  descripcion?: string;
  duraciones: string[];
  nota?: string;
};

export type ServicioIcono = 'tarot' | 'flor' | 'brote' | 'cuerpo' | 'sistema';
export type ServicioTono = 'amarillo' | 'lavanda' | 'rosa' | 'menta' | 'verde';

export type Servicio = {
  id: string;
  nombre: string;
  subtitulo?: string;
  descripcion?: string;
  icono?: ServicioIcono;
  tono?: ServicioTono;
  imagen?: string;
  horarios: ServicioHorario[];
  precios: ServicioPrecio[];
  detalles: string[];
  items: ServicioItem[];
  nota?: string;
  orden: number;
};

export async function getServicios(): Promise<Servicio[]> {
  const entries = await getCollection('servicios');
  return entries
    .map((entry) => ({ id: entry.id, ...entry.data }))
    .sort(
      (a, b) =>
        (a.orden ?? 0) - (b.orden ?? 0) || a.nombre.localeCompare(b.nombre),
    );
}
