import { getCollection } from 'astro:content';

/**
 * Cursos en video (asincrónicos).
 *
 * El contenido se administra desde Keystatic y se compila en el build.
 * Los hashes privados de Vimeo NO se deben usar en páginas públicas: solo en
 * el área protegida `/curso/[slug]/ver`.
 */

export type CursoVideo = {
  videoId?: string;
  titulo: string;
  vimeoId?: string;
  vimeoHash?: string;
  duracionMin: number;
  descripcion?: string;
};

export type CursoParte = {
  titulo: string;
  descripcion?: string;
  videos: CursoVideo[];
};

export type Curso = {
  id: string;
  titulo: string;
  resumen?: string;
  descripcion?: string;
  precio: number;
  moneda: string;
  publicado: boolean;
  orden: number;
  portada?: string;
  previewVimeoId?: string;
  partes: CursoParte[];
};

function normalizar(entry: {
  id: string;
  data: {
    titulo: string;
    resumen?: string;
    descripcion?: string;
    precio: number;
    moneda?: string;
    publicado?: boolean;
    orden?: number;
    portada?: string;
    previewVimeoId?: string;
    partes?: CursoParte[];
  };
}): Curso {
  return {
    id: entry.id,
    titulo: entry.data.titulo,
    resumen: entry.data.resumen,
    descripcion: entry.data.descripcion,
    precio: entry.data.precio,
    moneda: entry.data.moneda ?? 'CLP',
    publicado: entry.data.publicado ?? false,
    orden: entry.data.orden ?? 0,
    portada: entry.data.portada,
    previewVimeoId: entry.data.previewVimeoId,
    partes: entry.data.partes ?? [],
  };
}

/** Cursos publicados, ordenados para el listado. */
export async function getCursos(): Promise<Curso[]> {
  const entries = await getCollection('cursos');
  return entries
    .map(normalizar)
    .filter((curso) => curso.publicado)
    .sort((a, b) => a.orden - b.orden || a.titulo.localeCompare(b.titulo));
}

/** Todos los cursos, incluidos los no publicados (para el área protegida). */
export async function getTodosLosCursos(): Promise<Curso[]> {
  const entries = await getCollection('cursos');
  return entries
    .map(normalizar)
    .sort((a, b) => a.orden - b.orden || a.titulo.localeCompare(b.titulo));
}

export function formatPrecio(precio: number, moneda = 'CLP'): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(precio);
}

export function contarVideos(curso: Curso): number {
  return curso.partes.reduce((total, parte) => total + parte.videos.length, 0);
}

export function duracionTotalMin(curso: Curso): number {
  return curso.partes.reduce(
    (total, parte) =>
      total + parte.videos.reduce((suma, video) => suma + (video.duracionMin || 0), 0),
    0,
  );
}

/** "3 h 20 min" o "45 min". */
export function formatDuracion(minutos: number): string {
  if (!minutos) return '';
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (!horas) return `${resto} min`;
  if (!resto) return `${horas} h`;
  return `${horas} h ${resto} min`;
}
