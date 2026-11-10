import instagramConfig from './instagram.json';

export type InstaPost = {
  image: string;
  text?: string;
  href?: string;
  alt?: string;
};

const API_VERSION = 'v21.0';
const FIELDS = 'id,caption,media_type,media_url,permalink,thumbnail_url';

/**
 * Obtiene las publicaciones reales de Instagram a través de la API de Meta
 * (Instagram Graph API) durante el build. Si no hay token configurado, usa
 * el respaldo estático de `instagram.json`.
 *
 * Variables de entorno necesarias:
 *   INSTAGRAM_ACCESS_TOKEN = token de larga duración de Meta
 *   INSTAGRAM_BUSINESS_ID  = id del Instagram Business Account
 */
export async function getInstagramPosts(): Promise<InstaPost[]> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const igUserId = process.env.INSTAGRAM_BUSINESS_ID;

  if (!token || !igUserId) {
    return instagramConfig.posts;
  }

  try {
    const url =
      `https://graph.facebook.com/${API_VERSION}/${igUserId}/media` +
      `?fields=${FIELDS}&limit=6&access_token=${encodeURIComponent(token)}`;

    const res = await fetch(url);
    if (!res.ok) return instagramConfig.posts;

    const data = (await res.json()) as {
      data?: Array<Record<string, string>>;
    };

    const media = (data.data ?? []).filter((m) =>
      ['IMAGE', 'CAROUSEL_ALBUM', 'VIDEO'].includes(m.media_type),
    );

    return media.map((m) => ({
      image: m.thumbnail_url || m.media_url,
      text: m.caption || '',
      href: m.permalink || '',
      alt: m.caption || '',
    }));
  } catch {
    return instagramConfig.posts;
  }
}
