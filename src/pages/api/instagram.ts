import type { APIRoute } from 'astro';
import instagramConfig from '../../data/instagram.json';
import {
  getBeholdPosts,
  getInstagramPosts,
  type InstaPost,
} from '../../data/instagram';

/**
 * Endpoint de tiempo de ejecución para las publicaciones de Instagram.
 *
 * El HTML de la home se genera en el build, pero este endpoint permite que la
 * sección Novedades se actualice sin volver a desplegar el sitio. Behold (plan
 * free) refresca su feed una vez al día, así que cachear 3 horas no agrega una
 * demora perceptible y mantiene el consumo muy por debajo de las 1.200 vistas
 * mensuales del plan gratuito.
 */
export const prerender = false;

const CACHE_TTL_SECONDS = 3 * 60 * 60;
const FALLBACK_TTL_SECONDS = 5 * 60;
const MEMORY_TTL_MS = 60 * 1000;
const CACHE_PATH = '/__cache/instagram';

type CacheLike = {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
};

let memory: { posts: InstaPost[]; expiresAt: number } | null = null;

function getCache(): CacheLike | undefined {
  return (globalThis as unknown as { caches?: { default?: CacheLike } }).caches
    ?.default;
}

function cacheRequest(url: URL): Request {
  return new Request(new URL(CACHE_PATH, url), { method: 'GET' });
}

async function readCache(url: URL): Promise<InstaPost[] | null> {
  if (memory && memory.expiresAt > Date.now()) return memory.posts;

  const cache = getCache();
  if (!cache) return null;

  try {
    const cached = await cache.match(cacheRequest(url));
    if (!cached) return null;

    const posts = (await cached.json()) as InstaPost[];
    memory = { posts, expiresAt: Date.now() + MEMORY_TTL_MS };
    return posts;
  } catch {
    return null;
  }
}

async function writeCache(
  url: URL,
  posts: InstaPost[],
  ttlSeconds: number,
): Promise<void> {
  memory = { posts, expiresAt: Date.now() + MEMORY_TTL_MS };

  const cache = getCache();
  if (!cache) return;

  try {
    await cache.put(
      cacheRequest(url),
      new Response(JSON.stringify(posts), {
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': `public, max-age=${ttlSeconds}`,
        },
      }),
    );
  } catch {
    // Si la caché no está disponible, igual servimos el feed.
  }
}

function jsonResponse(posts: InstaPost[], cached: boolean): Response {
  return new Response(JSON.stringify({ posts }), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=60',
      'x-instagram-cache': cached ? 'hit' : 'miss',
    },
  });
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);

  const cached = await readCache(url);
  if (cached) return jsonResponse(cached, true);

  const feedUrl = process.env.INSTAGRAM_FEED_URL || instagramConfig.feed_url;

  let posts: InstaPost[] | null = null;
  if (feedUrl) posts = await getBeholdPosts(feedUrl);

  const fromFeed = posts !== null;
  if (!posts) posts = await getInstagramPosts({ skipBehold: true });
  if (posts.length === 0) posts = instagramConfig.posts as InstaPost[];

  await writeCache(
    url,
    posts,
    fromFeed ? CACHE_TTL_SECONDS : FALLBACK_TTL_SECONDS,
  );

  return jsonResponse(posts, false);
};
