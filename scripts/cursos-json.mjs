import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parse } from 'yaml';

// Genera src/data/cursos.server.json con TODOS los cursos (incluidos los no
// publicados y los hashes privados de Vimeo). Ese archivo lo importan solo las
// rutas de servidor (área protegida y checkout); nunca debe usarse en páginas
// públicas ni en componentes de cliente.
//
// Se ejecuta antes de `astro dev` y de `astro build`.

const contentDir = new URL('../src/content/cursos/', import.meta.url);
const outputFile = new URL('../src/data/cursos.server.json', import.meta.url);

function leerCursos() {
  let archivos = [];
  try {
    archivos = readdirSync(contentDir).filter(
      (nombre) => nombre.endsWith('.yaml') || nombre.endsWith('.yml'),
    );
  } catch {
    archivos = [];
  }

  return archivos
    .map((archivo) => {
      const raw = readFileSync(new URL(archivo, contentDir), 'utf8');
      const data = parse(raw) ?? {};
      const id = archivo.replace(/\.ya?ml$/, '');
      return {
        id,
        titulo: String(data.titulo ?? id),
        resumen: data.resumen ? String(data.resumen) : undefined,
        descripcion: data.descripcion ? String(data.descripcion) : undefined,
        precio: Number(data.precio) || 0,
        moneda: String(data.moneda ?? 'CLP'),
        publicado: Boolean(data.publicado),
        orden: Number(data.orden) || 0,
        portada: data.portada ? String(data.portada) : undefined,
        previewVimeoId: data.previewVimeoId ? String(data.previewVimeoId) : undefined,
        partes: Array.isArray(data.partes)
          ? data.partes.map((parte) => ({
              titulo: String(parte?.titulo ?? ''),
              descripcion: parte?.descripcion ? String(parte.descripcion) : undefined,
              videos: Array.isArray(parte?.videos)
                ? parte.videos.map((video) => ({
                    videoId: video?.videoId ? String(video.videoId) : undefined,
                    titulo: String(video?.titulo ?? ''),
                    vimeoId: video?.vimeoId ? String(video.vimeoId) : undefined,
                    vimeoHash: video?.vimeoHash ? String(video.vimeoHash) : undefined,
                    duracionMin: Number(video?.duracionMin) || 0,
                    descripcion: video?.descripcion ? String(video.descripcion) : undefined,
                  }))
                : [],
            }))
          : [],
      };
    })
    .sort((a, b) => a.orden - b.orden || a.titulo.localeCompare(b.titulo));
}

const cursos = leerCursos();
mkdirSync(new URL('../src/data/', import.meta.url), { recursive: true });
writeFileSync(outputFile, `${JSON.stringify(cursos, null, 2)}\n`);
console.log(`[cursos] ${cursos.length} curso(s) → src/data/cursos.server.json`);
