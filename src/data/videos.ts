import { getCollection } from 'astro:content';

export type Video = {
  id: string;
  titulo: string;
  descripcion?: string;
  vimeoId: string;
  vimeoHash?: string;
  orden: number;
};

type VimeoRef = Pick<Video, 'vimeoId' | 'vimeoHash'>;

/**
 * Extrae el ID y, si existe, el hash privado de un enlace de Vimeo.
 * Acepta el enlace público, el de embed o el ID suelto:
 *   https://vimeo.com/123456789
 *   https://vimeo.com/123456789/abc123def
 *   https://player.vimeo.com/video/123456789?h=abc123def
 *   123456789
 */
export function parseVimeo(value: string): VimeoRef | null {
  const input = value.trim();
  if (!input) return null;

  if (/^\d+$/.test(input)) return { vimeoId: input };

  const player = input.match(/player\.vimeo\.com\/video\/(\d+)(?:[?&]h=([A-Za-z0-9]+))?/);
  if (player) return { vimeoId: player[1], vimeoHash: player[2] };

  const page = input.match(/vimeo\.com\/(\d+)(?:\/([A-Za-z0-9]+))?/);
  if (page) return { vimeoId: page[1], vimeoHash: page[2] };

  // ID + hash sin dominio, por ejemplo "123456789/abc123def".
  const bare = input.match(/^(\d+)\/([A-Za-z0-9]+)$/);
  if (bare) return { vimeoId: bare[1], vimeoHash: bare[2] };

  return null;
}

/** URL del reproductor de Vimeo con la configuración de marca del sitio. */
export function vimeoEmbedUrl(video: VimeoRef): string {
  const params = new URLSearchParams({
    dnt: '1',
    title: '0',
    byline: '0',
    portrait: '0',
  });
  if (video.vimeoHash) params.set('h', video.vimeoHash);
  return `https://player.vimeo.com/video/${video.vimeoId}?${params.toString()}`;
}

/** Máximo de videos visibles en la sección "Conócenos". */
export const MAX_VIDEOS = 4;

/**
 * Devuelve los videos de la sección "Conócenos", ordenados por `orden`.
 * Las entradas sin un enlace de Vimeo válido se omiten y solo se muestran
 * los primeros MAX_VIDEOS.
 */
export async function getVideos(): Promise<Video[]> {
  const entries = await getCollection('videos');

  const videos = entries
    .flatMap((entry) => {
      const vimeo = parseVimeo(entry.data.vimeo);
      if (!vimeo) {
        console.warn(
          `[videos] "${entry.id}" no tiene un enlace de Vimeo válido: ${entry.data.vimeo}`
        );
        return [];
      }
      return [
        {
          id: entry.id,
          titulo: entry.data.titulo,
          descripcion: entry.data.descripcion,
          orden: entry.data.orden,
          ...vimeo,
        },
      ];
    })
    .sort((a, b) => a.orden - b.orden);

  if (videos.length > MAX_VIDEOS) {
    console.warn(
      `[videos] Hay ${videos.length} videos cargados; la sección solo muestra los primeros ${MAX_VIDEOS} según el orden.`
    );
  }

  return videos.slice(0, MAX_VIDEOS);
}
