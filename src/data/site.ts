/**
 * Datos centrales del sitio Verderapia.
 * Toda la información proviene de `verderapia.md`.
 */
export const site = {
  nombre: 'Verderapia',
  tagline: 'Lugar de reencuentro y conexión con nuestras raíces',
  elementos: ['Agua', 'Tierra', 'Luz', 'Aire'],

  contacto: {
    email: 'verderapia@gmail.com',
    whatsapp: '+56 9 8754 8041',
    whatsappLink: 'https://wa.me/56987548041',
    direccion: 'La Bodega 16137, Condominio Los Quillayes etapa III, Quilpué',
    comuna: 'Quilpué, Región de Valparaíso',
    instagram: 'verderapia',
    instagramUrl: 'https://www.instagram.com/verderapia/',
    facebookUrl: 'https://www.facebook.com/verderapia',
    mapsCoords: '-33.1512548,-71.3407261',
    mapsUrl: 'https://maps.app.goo.gl/1kfs5oR9VqbyYRRH8',
  },

  giftCard: {
    texto:
      'Regala un momento de descanso y bienestar. Escríbenos y te enviamos una linda Tarjeta de Regalo con el servicio que elijas.',
  },

  /**
   * Datos para pagar cursos por transferencia bancaria.
   *
   * Completa `banco`, `numeroCuenta` y `titular` para mostrar la cuenta en la
   * página del curso y en el correo de instrucciones. Mientras estén vacíos,
   * la página invita a coordinar la transferencia por WhatsApp.
   */
  pagos: {
    transferencia: {
      banco: '',
      tipoCuenta: '',
      numeroCuenta: '',
      titular: '',
      rut: '',
      emailComprobante: 'verderapia@gmail.com',
      plazoHoras: 24,
    },
  },

  seo: {
    titulo: 'Verderapia — Parcela sustentable, terapias, yoga y arte en Quilpué',
    descripcion:
      'Lugar de reencuentro y conexión con nuestras raíces. Parcela sustentable con terapias, yoga, tarot, arte y talleres en Quilpué.',
  },
};

export type Site = typeof site;
