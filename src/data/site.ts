/**
 * Datos centrales del sitio Verderapia.
 * Toda la información proviene de `verderapia.md`.
 */
export type Terapia = {
  nombre: string;
  descripcion: string;
  duracion: string;
  precio: string;
  extra?: string;
};

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
    mapsQuery: 'La Bodega 16137 Condominio Los Quillayes etapa III Quilpué',
  },

  giftCard: {
    texto:
      'Regala un momento de descanso y bienestar. Escríbenos y te enviamos una linda Tarjeta de Regalo con el servicio que elijas.',
  },

  terapias: <Terapia[]>[
    {
      nombre: 'Masaje de relajación',
      descripcion:
        'Relaja la musculatura, disminuye el estrés, mejora el descanso y equilibra el sistema nervioso.',
      duracion: '75 min',
      precio: '$25.000',
      extra: 'Masaje + Cama de Jade: $28.000',
    },
    {
      nombre: 'Cama de Jade',
      descripcion:
        'La cama de piedras Jade actúa a través del movimiento de sus rodillos y del calor que transmiten éstos, recorriendo toda la columna vertebral.',
      duracion: '75 min',
      precio: '$28.000',
    },
    {
      nombre: 'Masaje Descontracturante',
      descripcion:
        'Con o sin ventosas. Alivia las contracturas musculares, entregando relajo, descanso y disminución de las dolencias.',
      duracion: '90 min',
      precio: '$30.000',
      extra: 'Masaje + Cama de Jade: $36.000',
    },
    {
      nombre: 'Drenaje Linfático',
      descripcion:
        'Masaje suave, rítmico y sutil, que activa y respeta la circulación de la linfa y su mecanismo fisiológico.',
      duracion: '90 min',
      precio: '$30.000',
    },
    {
      nombre: 'Masaje Champi Hindú',
      descripcion:
        'Masaje de la Medicina Ayurvédica de la cultura hindú: espalda alta, cuello, cabeza y rostro. Entrega armonía a nivel físico, mental y energético.',
      duracion: '40 min',
      precio: '$18.500',
    },
    {
      nombre: 'Masaje Abdominal (Colon)',
      descripcion:
        'Masaje para aliviar la hinchazón, dolores y molestias intestinales. Ayuda a mejorar la digestión.',
      duracion: '45 min',
      precio: '$18.500',
    },
    {
      nombre: 'Reflexología Podal',
      descripcion:
        'Estimula el organismo mediante presiones manuales en las zonas reflejas de los pies, activando el proceso de autocuración del cuerpo.',
      duracion: '60 min',
      precio: '$20.000',
    },
    {
      nombre: 'Terapia Floral',
      descripcion:
        'Trabajamos con los Sistemas Florales de Bach, California y Bush. Medicina vibracional que nos conecta con nuestro cuerpo emocional, mental, físico y energético, otorgándonos calma, coraje, voluntad y alegría.',
      duracion: '60 min',
      precio: '$20.000',
    },
    {
      nombre: 'Tarot Terapéutico',
      descripcion:
        'Herramienta ancestral que nos entrega guía y entendimiento de bloqueos que dificultan nuestro avanzar. También podemos analizar y limpiar nuestros chakras con barra de Selenita.',
      duracion: '60 min',
      precio: '$20.000',
      extra: 'Tarot + Terapia Floral: $30.000 (90 min)',
    },
  ],

  seo: {
    titulo: 'Verderapia — Parcela sustentable, terapias, yoga y arte en Quilpué',
    descripcion:
      'Lugar de reencuentro y conexión con nuestras raíces. Parcela sustentable con terapias, yoga, tarot, arte y talleres en Quilpué.',
  },
};

export type Site = typeof site;
