import { getServicios } from './servicios';

/**
 * La sección "Terapias y masajes" se genera a partir de los mismos servicios
 * que la sección "Servicios", para que ambas coincidan siempre.
 *
 * Cada servicio (item) se convierte en una fila con su precio y duraciones.
 */
export type Terapia = {
  id: string;
  nombre: string;
  descripcion: string;
  duracion: string;
  precio: string;
  extra?: string;
  orden: number;
};

export async function getTerapias(): Promise<Terapia[]> {
  const servicios = await getServicios();

  return servicios.flatMap((servicio) =>
    servicio.items.map((item, indice) => ({
      id: `${servicio.id}-${indice + 1}`,
      nombre: item.nombre,
      descripcion: item.descripcion ?? '',
      duracion: item.duraciones.join(' · '),
      precio: item.precio ?? '',
      // La categoría acompaña al servicio en la lista de precios.
      extra: servicio.nombre,
      orden: servicio.orden * 100 + indice,
    })),
  );
}
