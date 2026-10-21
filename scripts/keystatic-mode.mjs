import { writeFileSync } from 'node:fs';

// Genera un módulo con valores estáticos para Keystatic. Se ejecuta antes de
// `astro dev` / `astro build`. Así el cliente (navegador) no necesita leer
// `process.env`, que no existe en el navegador.
const production =
  process.argv.includes('--production') || process.env.NODE_ENV === 'production';
const mode = process.env.KEYSTATIC_STORAGE ?? (production ? 'github' : 'local');
const repo = process.env.KEYSTATIC_REPO ?? 'pedreproyectos/verderapia';

const content = `// Generado por scripts/keystatic-mode.mjs — no editar a mano.
export const keystaticMode = ${JSON.stringify(mode)};
export const keystaticRepo = ${JSON.stringify(repo)};
`;

writeFileSync(new URL('../src/data/keystatic-mode.ts', import.meta.url), content);
console.log(`[keystatic] modo=${mode} repo=${repo}`);
