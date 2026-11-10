import { getCollection } from 'astro:content';

export type Promo = { titulo?: string; detalle?: string };

export type GiftCard = {
  imagen?: string;
  titulo?: string;
  descuentoTitulo?: string;
  descuentoAdicional?: string;
  descuentoNota?: string;
  promos: Promo[];
};

export async function getGiftCard(): Promise<GiftCard | undefined> {
  const entries = await getCollection('giftcard');
  return entries[0]?.data;
}
