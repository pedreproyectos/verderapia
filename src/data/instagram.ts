import instagramConfig from './instagram.json';

export type InstaPost = {
  image: string;
  text?: string;
  href?: string;
  alt?: string;
};

const API_VERSION = 'v21.0';
const FIELDS = 'id,caption,media_type,media_url,permalink,thumbnail_url';

type BeholdPost = {
  permalink?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  sizes?: Partial<
    Record<'small' | 'medium' | 'large' | 'full', { mediaUrl?: string }>
  >;
  caption?: string;
  prunedCaption?: string;
  altText?: string;
};

type BeholdFeed = {
  posts?: BeholdPost[];
};

/** Lee un feed JSON de Behold y lo adapta al formato que usa el sitio. */
async function getBeholdPosts(url: string): Promise<InstaPost[] | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[instagram] Behold respondió ${res.status}; usando respaldo local.`);
      return null;
    }

    const feed = (await res.json()) as BeholdFeed;
    const posts = (feed.posts ?? [])
      .map((post) => ({
        image:
          post.sizes?.medium?.mediaUrl ??
          post.sizes?.large?.mediaUrl ??
          post.sizes?.small?.mediaUrl ??
          post.thumbnailUrl ??
          post.mediaUrl ??
          '',
        text: post.prunedCaption || post.caption || '',
        href: post.permalink ?? '',
        alt:
          post.altText ||
          post.prunedCaption ||
          post.caption ||
          'Publicación de Instagram de Verderapia',
      }))
      .filter((post) => post.image);

    return posts.length > 0 ? posts : null;
  } catch (error) {
    console.warn('[instagram] No se pudo leer el feed de Behold; usando respaldo local.', error);
    return null;
  }
}

/**
 * Obtiene las publicaciones de Instagram durante el build.
 *
 * Prioridad:
 *   1. Feed JSON de Behold (`INSTAGRAM_FEED_URL`), sin tokens ni app de Meta.
 *   2. Instagram Graph API (`INSTAGRAM_ACCESS_TOKEN` + `INSTAGRAM_BUSINESS_ID`).
 *   3. Respaldo estático de `instagram.json`.
 */
export async function getInstagramPosts(): Promise<InstaPost[]> {
  const feedUrl = process.env.INSTAGRAM_FEED_URL || instagramConfig.feed_url;

  if (feedUrl) {
    const beholdPosts = await getBeholdPosts(feedUrl);
    if (beholdPosts) return beholdPosts;
  }

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
