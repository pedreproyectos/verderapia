export type NavLink = { label: string; href: string };

/**
 * Menú principal para páginas internas (Cursos, Novedades, Acceso).
 * Usa los mismos ítems que el landing, con enlaces absolutos a sus secciones.
 */
export const navLinks: NavLink[] = [
  { label: 'Talleres y Servicios', href: '/#servicios' },
  { label: 'Cursos', href: '/cursos/' },
  { label: 'Novedades', href: '/#novedades' },
  { label: 'Contacto', href: '/#contacto' },
];
