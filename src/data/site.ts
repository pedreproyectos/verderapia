/**
 * Datos centrales del sitio Verderapia.
 * Toda la información proviene de `verderapia.md`.
 */
import { galeria } from './images';

export type Pilar = {
  id: 'verde' | 'arte' | 'terapia';
  eyebrow: string;
  titulo: string;
  subtitulo: string;
  descripcion: string;
  items: string[];
  imagen: string;
};

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
  heroTitulo: 'Un lugar de reencuentro y conexión con nuestras raíces',
  heroKicker: 'Parcela sustentable · Terapias · Arte · Quilpué',
  historia:
    'Hace mucho tiempo, en un lugar escondido de la memoria, nació un sueño... esa semilla quedó guardada hasta que encontró agua, tierra, luz y aire en donde pudiera arraigar, y al unir estos cuatro elementos... nace Verderapia.',
  historiaLarga:
    'Hace mucho tiempo, en un lugar escondido de la memoria, nació un sueño, y esa semilla quedó guardada hasta que encontró agua... tierra... luz... aire... en donde se pudiera arraigar. Al unir estos cuatro elementos nació Verderapia.',
  elementos: ['Agua', 'Tierra', 'Luz', 'Aire'],

  contacto: {
    email: 'consultas@verderapia.cl',
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
    titulo: '¡Regala una Gift Card!',
    texto:
      'Regala un momento de descanso y bienestar. Escríbenos y te enviamos una linda Tarjeta de Regalo con el servicio que elijas.',
    canales: ['consultas@verderapia.cl', 'WhatsApp +56 9 8754 8041'],
  },

  promos: [
    { titulo: '10% por pago anticipado', detalle: 'En todas tus terapias y talleres.' },
    {
      titulo: '10% adicional',
      detalle: 'Si inscribes a un@ amig@ junto a ti.',
    },
    {
      titulo: 'Gift Cards',
      detalle: 'Regala una experiencia de bienestar a quien más quieres.',
    },
  ],

  pilares: <Pilar[]>[
    {
      id: 'verde',
      eyebrow: 'Visita nuestra parcela sustentable',
      titulo: 'Verde',
      subtitulo: 'Parcela sustentable',
      descripcion:
        'Contamos con paneles solares y de agua caliente, procesos de reciclaje, creación de compost, talleres de huerta y Lombricultura, venta de productos orgánicos y más.',
      items: [
        'Paneles solares y agua caliente',
        'Reciclaje y compost',
        'Talleres de huerta y Lombricultura',
        'Venta de productos orgánicos',
      ],
      imagen: galeria.verde[0],
    },
    {
      id: 'arte',
      eyebrow: 'Manualidades y talleres',
      titulo: 'Arte',
      subtitulo: 'Manualidades y talleres',
      descripcion:
        '¡Inscríbete en nuestros talleres de manualidades y trabajos artesanales! Además puedes adquirir nuestros productos hechos a mano.',
      items: [
        'Figuras pintadas',
        'Portavelas',
        'Maceteros de botellas',
        'Encuadernación artesanal',
        'Portainciensos',
        'Frascos reciclados',
        'Cajas de madera con hierbas medicinales',
      ],
      imagen: galeria.arte[0],
    },
    {
      id: 'terapia',
      eyebrow: 'YOGA | TAROT | TERAPIAS',
      titulo: 'Terapia',
      subtitulo: 'Yoga, tarot y terapias',
      descripcion:
        'Un espacio para volver al cuerpo y a la calma. Terapias individuales, clases de yoga y acompañamiento terapéutico.',
      items: [
        'Hatha Vinyasa Yoga',
        'Terapia Floral',
        'Tarot Terapéutico',
        'Reiki',
        'Cama de Jade',
        'Reflexología Podal',
        'Masajes Terapéuticos',
        'Drenaje Linfático',
      ],
      imagen: galeria.terapia[0],
    },
  ],

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

  yoga: {
    nombre: 'Hatha Vinyasa Yoga',
    descripcion:
      'Las clases consisten en una etapa de preparación de asanas, pranayamas (respiraciones) activadoras, calmantes y finaliza con una meditación.',
    horarios: [
      { dia: 'Lunes', clases: [{ hora: '9:15', nombre: 'Yoga Restaurativo' }] },
      {
        dia: 'Miércoles',
        clases: [
          { hora: '9:15', nombre: 'Hatha Yoga' },
          { hora: '11:00', nombre: 'Yoga Restaurativo' },
        ],
      },
      { dia: 'Sábado', clases: [{ hora: '10:00', nombre: 'Hatha Yoga' }] },
    ],
    precios: [
      { nombre: 'Clase personalizada', detalle: '80 min', valor: '$16.000' },
      { nombre: '4 clases por mes', detalle: '', valor: '$25.000' },
      { nombre: '8 clases por mes', detalle: '', valor: '$32.000' },
    ],
    nota:
      'Consultar por descuentos de pago anticipado y otros descuentos promocionales.',
  },

  talleres: [
    {
      nombre: 'Taller de Lombricultura',
      descripcion:
        'Aprende a reciclar los desechos orgánicos de tu casa. Parte teórica y práctica de aproximadamente 3 horas.',
      horario: '15:30 a 18:30 hrs',
      fecha: 'Sábado',
      retribucion: '$15.000 · $25.000 si vienes acompañad@',
      expositor: 'ECOFEN ANTU — Luis Estay',
      temas: [
        '¿Qué es la lombricultura?',
        'Características de la lombriz roja californiana',
        'Desechos que se pueden utilizar para el proceso',
        'Estructura y sistema de alimentación',
      ],
    },
  ],

  descuentos: {
    titulo: 'Obtén un 10% de descuento por pago anticipado',
    adicional:
      'Obtén un segundo descuento de un 10% adicional si inscribes a un@ amig@.',
    nota: '* Descuentos válidos sobre terapias y talleres, según disponibilidad.',
  },

  seo: {
    titulo: 'Verderapia — Parcela sustentable, terapias, yoga y arte en Quilpué',
    descripcion:
      'Lugar de reencuentro y conexión con nuestras raíces. Parcela sustentable con terapias, yoga, tarot, arte y talleres en Quilpué.',
  },
};

export type Site = typeof site;
