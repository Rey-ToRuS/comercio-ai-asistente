export interface ManualSection {
  id: string;
  number: number;
  title: string;
  category: 'inicio' | 'operacion' | 'hardware' | 'planillas' | 'ia_nube' | 'soporte';
  keywords: string[];
  summary: string;
  steps: string[];
  tips?: string[];
  voiceExamples?: string[];
}

export const MANUAL_SECTIONS: ManualSection[] = [
  {
    id: 'vision-general',
    number: 1,
    title: 'Qué es la app y cómo funciona (Offline-First y sin ARCA)',
    category: 'inicio',
    keywords: [
      'que es',
      'como funciona',
      'empezar',
      'inicio',
      'arca',
      'afip',
      'factura',
      'impuestos',
      'servidor',
      'n8n',
      'privacidad',
      'manual',
      'ayuda',
    ],
    summary:
      'Es un asistente comercial comandado por voz, texto y código de barras pensado para locales chicos, puestos y ferias. Funciona 100% offline en tu dispositivo y sincroniza directo con tus propias cuentas (Google, IA elegida) sin servidores externos ni facturación ARCA.',
    steps: [
      'Todos tus datos (stock, fotos, libro diario y planillas) se guardan primero en el dispositivo para que puedas vender y anotar incluso sin WiFi ni señal.',
      'Es exclusivamente para control interno diario y mensual: no emite facturas fiscales ni se conecta a ARCA/AFIP.',
      'No depende de n8n ni servidores intermedios: vos elegís tu proveedor de IA y tu cuenta de Google/herramientas desde la pestaña Planillas.',
      'La barra superior muestra siempre la hora exacta, el clima y ubicación (si la activás), el acceso al escáner y el estado Online/Offline con tus cambios pendientes.',
    ],
    tips: [
      'Podés usar la app desde el primer minuto sin crear cuentas ni cargar claves API usando el Motor Local Offline.',
    ],
  },
  {
    id: 'asistente-voz-texto',
    number: 2,
    title: 'Asistente por Voz y Texto (Comandos de Mostrador)',
    category: 'operacion',
    keywords: [
      'voz',
      'microfono',
      'hablar',
      'dictar',
      'texto',
      'comando',
      'asistente',
      'confirmar',
      'como vender',
      'anotar',
      'preguntar',
    ],
    summary:
      'En la pestaña Asistente podés hablarle o escribirle en español natural para registrar ventas, gastos, cambios, regalos, cargar productos o hacer preguntas sobre tu caja y sobre cómo usar la app.',
    steps: [
      'Tocá el botón verde del micrófono y hablá con naturalidad (o escribí la frase en el cuadro de texto y tocá Enviar).',
      'La app interpreta tu frase (con IA si tenés conexión y clave configurada, o con el Motor Local Offline si estás sin señal).',
      'Siempre verás una Tarjeta de Confirmación antes de guardar: ahí podés revisar o corregir el monto y el medio de pago en 1 segundo.',
      'Tocá "Confirmar y guardar" para registrarlo en el Libro Diario y descontar stock automáticamente si mencionó un producto cargado.',
      'También podés hacer preguntas de consulta ("¿Cuánto vendí hoy?") o preguntas de uso ("¿Cómo conecto la pistola USB?").',
    ],
    voiceExamples: [
      '“Vendí 2 mates a 12 mil en efectivo”',
      '“Gasto 4500 bolsas proveedor Juan transferencia”',
      '“Regalé 1 llavero por cortesía”',
      '“Cambié remera M por L diferencia 3000 QR”',
      '“Agregar producto termo de acero a 25000 stock 5”',
      '“¿Cuánto vendí hoy?” o “¿Cómo vamos este mes?”',
    ],
    tips: [
      'Si el micrófono está en rojo, está escuchando. Si estás en un lugar muy ruidoso de feria, usá los 5 botones rápidos de 1 toque debajo del buscador.',
    ],
  },
  {
    id: 'escaner-codigo-barras',
    number: 3,
    title: 'Escáner de Código de Barras (Cámara del celular y Pistola USB / OTG)',
    category: 'hardware',
    keywords: [
      'codigo de barras',
      'escaner',
      'pistola',
      'usb',
      'otg',
      'adaptador',
      'samsung',
      'camara',
      'ean',
      'qr',
      'lector',
    ],
    summary:
      'Soporta dos modos simultáneos: la cámara de tu celular (EAN-13, EAN-8, UPC, Code128 y QR) y pistolas escáner USB conectadas a PC o al celular mediante adaptador USB a USB-C (OTG).',
    steps: [
      'Para Pistola USB / USB-C OTG: conectá la pistola con tu adaptador USB-C al celular o PC. Verificá que en Planillas → Escáner y Respaldo esté tildado "Escucha global de pistola USB / OTG".',
      'Con la app abierta en cualquier pestaña, apuntá al producto y dispará la pistola: el sistema detecta la ráfaga rápida y emite un beep de confirmación.',
      'Si el código ya existe en tu Stock, aparece una tarjeta inmediata con el producto, precio y stock actual para elegir "Registrar Venta" o "Cambio / Regalo".',
      'Si el código es nuevo, aparece un aviso con el botón "Crear producto con este código" para darlo de alta con el código ya precargado.',
      'Para usar la cámara del celular: tocá "Escáner listo" en la barra superior (o "Escanear Código") y apuntá al código dentro del recuadro blanco. Podés alternar entre cámara trasera y delantera.',
    ],
    tips: [
      'La pistola USB debe enviar un salto de línea (Enter) al terminar de leer (es la configuración de fábrica de casi todos los lectores HID). Podés probarla en Planillas → Escáner y Respaldo → Zona de prueba.',
    ],
  },
  {
    id: 'libro-diario',
    number: 4,
    title: 'Libro Diario Interno (Ventas, Cambios, Regalos, Gastos y Proveedores)',
    category: 'operacion',
    keywords: [
      'libro diario',
      'caja',
      'ventas',
      'gastos',
      'proveedores',
      'cambios',
      'regalos',
      'egresos',
      'ingresos',
      'pago mixto',
      'efectivo',
      'transferencia',
      'qr',
      'csv',
      'excel',
      'doc',
    ],
    summary:
      'Lleva el registro detallado diario y mensual de todo lo que entra y sale del puesto o local: ventas, cambios, regalos, ingresos extra, gastos generales, pagos a proveedores, devoluciones y retiros.',
    steps: [
      'En la pestaña Libro Diario elegí el período arriba a la derecha: Hoy, Mes o Todo. Verás Ingresos, Egresos, Balance Neto y Cantidad de movimientos.',
      'Usá los filtros para buscar por producto, motivo, proveedor, tipo de movimiento o medio de pago (Efectivo, Transferencia, QR, Tarjeta, Mixto, Sin cargo o Cuenta corriente).',
      'Para registrar un pago combinado (ej. mitad efectivo y mitad transferencia), elegí "Mixto" en Tipo de pago y completá Parte 1 y Parte 2: el monto total se suma solo.',
      'Si vinculás un producto del stock al movimiento, la app descuenta stock en ventas/regalos y suma stock en devoluciones o compras a proveedor.',
      'Tocá "CSV" para descargar tu planilla lista para Excel/Sheets incluso sin internet, o "Doc" para crear un resumen ordenado en Google Docs.',
    ],
    tips: [
      'Los regalos y cambios sin diferencia de dinero se registran como impacto "Neutro" y pago "Sin cargo" para no distorsionar tu caja real pero sí dejar rastro de la mercadería.',
    ],
  },
  {
    id: 'stock-productos-fotos',
    number: 5,
    title: 'Stock, Fotos de Productos y Visión con IA',
    category: 'operacion',
    keywords: [
      'stock',
      'inventario',
      'producto',
      'foto',
      'imagen',
      'camara',
      'completar con ia',
      'vision',
      'precio',
      'costo',
      'stock bajo',
    ],
    summary:
      'Administrá tus productos con foto, precio, costo interno, stock mínimo, código de barras y los campos personalizados de tu rubro.',
    steps: [
      'Entrá a la pestaña Stock y tocá "Nuevo Producto" (o desde Asistente → "Producto + Foto").',
      'Tocá "Sacar / Subir foto": la imagen se comprime automáticamente para ocupar poco espacio offline y queda en cola para subirse a tu carpeta de Google Drive.',
      'Si conectaste Gemini, OpenAI o Llama Vision y tenés internet, tocá "Completar con IA" para que analice la foto y complete nombre, categoría y descripción comercial automáticamente.',
      'Podés asignar el código de barras tocando el ícono de escáner al lado del campo código o disparando la pistola USB.',
      'En la grilla de Stock podés ajustar cantidades rápido con los botones − y + o tocar "Vender" para registrar la salida al instante.',
    ],
    tips: [
      'Cuando el stock llega o baja del número de "Aviso stock bajo", la cantidad se resalta en color terracota para avisarte que hay que reponer.',
    ],
  },
  {
    id: 'planillas-por-rubro',
    number: 6,
    title: 'Planillas Configurables y Editables por Tipo de Negocio',
    category: 'planillas',
    keywords: [
      'planilla',
      'plantilla',
      'rubro',
      'negocio',
      'columna',
      'campo',
      'personalizar',
      'editar',
      'feria',
      'kiosco',
      'indumentaria',
      'gastronomia',
      'servicios',
      'taller',
      'categoria',
      'motivo',
    ],
    summary:
      'Incluye 6 plantillas listas para usar según tu rubro (Feria/Artesanías, Kiosco/Almacén, Indumentaria/Calzado, Gastronomía/Puesto, Servicios/Taller y Comercio General) y un editor completo para adaptarlas a medida.',
    steps: [
      'Entrá a Planillas → pestaña "Planillas". Cambiá el nombre de tu comercio, la moneda (ARS, USD, UYU, CLP, MXN) y elegí el rubro más cercano al tuyo.',
      'Debajo podés renombrar las 3 pestañas que se crean en Google Sheets (Libro Diario, Stock y Gastos/Proveedores).',
      'En "Columnas adicionales de Stock" y "Columnas adicionales de Libro Diario" podés tildar/destildar columnas, cambiarles el nombre, elegir su tipo (Texto, Número, Fecha o Lista) o eliminar las que no uses.',
      'Para agregar una columna nueva (ej. "Vencimiento", "Talle", "Lote", "Vendedor"), escribí el nombre, elegí el tipo y tocá "Agregar columna".',
      'También podés agregar o quitar Categorías de Stock y Motivos frecuentes. Al final tenés una vista previa en vivo de cómo quedarán las columnas en tu Google Sheet.',
    ],
    tips: [
      'Cada cambio que hacés en las columnas aparece inmediatamente en los formularios de Nuevo Producto, Registrar Movimiento, exportación CSV y Google Sheets.',
    ],
  },
  {
    id: 'redes-clima-ubicacion',
    number: 7,
    title: 'Contenido Automático para Redes, Hora, Ubicación y Clima',
    category: 'operacion',
    keywords: [
      'redes',
      'instagram',
      'whatsapp',
      'tiktok',
      'reel',
      'facebook',
      'meta',
      'publicacion',
      'post',
      'clima',
      'tiempo',
      'ubicacion',
      'gps',
      'hora',
      'compartir',
    ],
    summary:
      'Genera posts de Instagram, guiones de Reels/TikTok, estados de WhatsApp y avisos de feria usando tu stock real más la hora exacta, ubicación y clima del lugar.',
    steps: [
      'Para activar ubicación y clima: tocá "Activar clima/ubicación" en la barra superior y aceptá el permiso GPS. Usa Open-Meteo (gratuito, sin claves) y guarda el último clima en caché para usarlo offline.',
      'Entrá a la pestaña Redes y seleccioná entre 1 y 5 productos de tu Stock (si no marcás ninguno, toma los primeros 3 disponibles).',
      'Elegí el Formato (Post Instagram, Guión Reel/TikTok, Estado WhatsApp o Aviso de Feria), el Estilo y dejá tildado "Incluir ubicación y clima actual" si querés aprovechar el contexto del día.',
      'Agregá una nota opcional (ej. "Hasta las 19 hs en Plaza Francia, 10% off efectivo") y tocá "Generar contenido automático".',
      'Revisá o editá el texto generado y tocá "Compartir (IG / WhatsApp / Meta)" para enviarlo en 1 toque con la foto del producto, o "Copiar texto".',
    ],
    tips: [
      'Incluso sin internet ni API Key de IA, el generador arma textos prolijos con tus precios, horarios y clima usando plantillas offline.',
    ],
  },
  {
    id: 'proveedores-ia',
    number: 8,
    title: 'Cómo Elegir e Intercambiar tu Proveedor de IA (Gemini, Meta Llama, OpenAI o Local)',
    category: 'ia_nube',
    keywords: [
      'ia',
      'inteligencia artificial',
      'gemini',
      'meta',
      'llama',
      'groq',
      'openai',
      'gpt',
      'api key',
      'clave',
      'modelo',
      'cambiar proveedor',
      'local',
    ],
    summary:
      'La app funciona como un centro de comando modular: podés cambiar de IA en segundos sin perder tus datos ni cambiar de aplicación.',
    steps: [
      'Entrá a Planillas → subpestaña "IA".',
      'Elegí tu proveedor preferido: Google Gemini (recomendado para fotos y voz, clave gratis en aistudio.google.com), Meta Llama vía Groq (gratis y muy rápido en console.groq.com), OpenAI (platform.openai.com) o Motor Local Offline (sin clave ni internet).',
      'Pegá tu API Key y elegí el modelo deseado en la lista.',
      'Tocá "Probar conexión de IA" para confirmar que responde correctamente.',
    ],
    tips: [
      'Tu API Key se guarda exclusivamente en tu dispositivo y nunca se incluye al exportar un respaldo JSON.',
      'Si te quedás sin internet en medio de la jornada, la app cambia automáticamente al Motor Local Offline para no frenarte.',
    ],
  },
  {
    id: 'google-workspace',
    number: 9,
    title: 'Conectar Google (Drive, Sheets, Docs y Gmail) Sin Servidores Externos',
    category: 'ia_nube',
    keywords: [
      'google',
      'drive',
      'sheets',
      'hoja de calculo',
      'docs',
      'gmail',
      'oauth',
      'client id',
      'sincronizar',
      'sync',
      'nube',
      'carpeta',
    ],
    summary:
      'La app se conecta directamente a tu cuenta de Google desde el navegador/celular. Crea su propia carpeta aislada y una planilla con tus columnas personalizadas.',
    steps: [
      'En Google Cloud Console creá un proyecto gratuito, habilitá las APIs de Google Drive, Google Sheets y Google Docs, y generá un "ID de cliente OAuth" de tipo Aplicación Web.',
      'En la app, andá a Planillas → "Google / Redes", pegá ese Google OAuth Client ID y tocá "Conectar cuenta de Google".',
      'Al iniciar sesión, la app crea automáticamente en tu Drive una carpeta propia ("ComercioAI - Tu Nombre"), una subcarpeta "Fotos Productos" y tu Google Sheet con las pestañas de tu plantilla activa.',
      'Cada vez que tengas conexión, tocá el botón "Sync" en la barra superior (o "Sincronizar ahora") para subir fotos pendientes a Drive y agregar las filas nuevas a Sheets.',
      'Tocá "Abrir mi Google Sheet" para ver o compartir tus planillas directo en Google.',
    ],
    tips: [
      'El traslado de archivos dentro de Drive se hace de forma atómica (sin duplicar archivos) y las fotos quedan listas con enlace directo de vista rápida.',
    ],
  },
  {
    id: 'modo-offline-ferias',
    number: 10,
    title: 'Trabajo 100% Offline en Ferias y Sincronización Posterior',
    category: 'operacion',
    keywords: [
      'offline',
      'sin internet',
      'sin wifi',
      'sin señal',
      'feria',
      'cola',
      'pendiente',
      'sincronizacion',
      'datos moviles',
    ],
    summary:
      'Diseñada para funcionar todo el día sin señal. Cada venta, cambio, gasto o foto se guarda en el dispositivo y se encola automáticamente.',
    steps: [
      'Cuando se corta internet, la barra superior cambia a "Offline" y te muestra cuántos registros pendientes tenés entre paréntesis (ej. "Offline (4)").',
      'Seguí trabajando normal: botones rápidos, pistola USB, cámara para códigos/fotos, Libro Diario, Stock, CSV y comandos de texto/voz locales siguen operando sin interrupciones.',
      'Cuando vuelvas a tener WiFi o 4G, el indicador cambia a "En línea / Sync (N)". Tocá ese botón para enviar toda la cola pendiente a tu Google Drive y Sheets.',
    ],
    tips: [
      'Para dictar por voz sin internet en celulares Android, descargá el paquete de idioma "Español (Argentina)" en Ajustes de Google → Voz → Reconocimiento de voz sin conexión.',
      'Podés instalar la app en la pantalla de inicio desde Chrome ("Agregar a pantalla principal") para abrirla offline como una app nativa.',
    ],
  },
  {
    id: 'respaldo-backup',
    number: 11,
    title: 'Respaldo Local (Exportar e Importar Backup JSON)',
    category: 'soporte',
    keywords: [
      'respaldo',
      'backup',
      'copia de seguridad',
      'exportar',
      'importar',
      'restaurar',
      'cambiar de celular',
      'json',
    ],
    summary:
      'Podés guardar una copia completa de tu Stock, Libro Diario y Planillas personalizadas en un archivo JSON para resguardarlo o pasarlo a otro teléfono.',
    steps: [
      'Entrá a Planillas → "Escáner y Respaldo".',
      'Tocá "Descargar respaldo JSON" para guardar el archivo en tu celular o PC (podés enviártelo por WhatsApp o guardarlo en Drive).',
      'Para restaurar en otro equipo, tocá "Restaurar desde JSON" y seleccioná el archivo descargado.',
    ],
    tips: [
      'Por seguridad, el respaldo JSON nunca exporta tus API Keys privadas.',
    ],
  },
  {
    id: 'solucion-problemas',
    number: 12,
    title: 'Solución de Problemas y Preguntas Frecuentes',
    category: 'soporte',
    keywords: [
      'error',
      'problema',
      'no funciona',
      'no anda',
      'no lee',
      'no escucha',
      'permiso',
      'sesion vencida',
      'ayuda',
      'falla',
      'faq',
    ],
    summary:
      'Respuestas rápidas a los inconvenientes más comunes de micrófono, cámara, pistola USB, clima y conexión con Google.',
    steps: [
      'El micrófono no escucha: verificá que le diste permiso de micrófono al navegador (ícono del candado junto a la dirección) y que usás Chrome o Edge.',
      'La cámara no abre al escanear: confirmá el permiso de cámara; si tu navegador bloquea cámara en red local, usá la pestaña "Pistola USB / Manual" dentro del escáner.',
      'La pistola USB escribe números pero no dispara la búsqueda: asegurate de que no estés escribiendo dentro de otro campo de texto común y verificá en Planillas → Escáner y Respaldo que esté activo el listener global.',
      'Google pide reconectar ("sesión vencida"): al no usar servidor propio, el token web de Google expira aproximadamente a la hora. Solo tocá "Conectar cuenta de Google" de nuevo y tocá "Sync".',
      'El clima no se muestra: tocá el botón de ubicación en la barra superior y aceptá el permiso de GPS (requiere internet solo en el momento de actualizar).',
    ],
  },
];

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Detecta si el comerciante está haciendo una consulta de ayuda, duda o configuración
 * (para evitar interpretarlo como una venta o gasto).
 */
export function isHelpOrManualQuery(rawText: string): boolean {
  const norm = normalizeText(rawText);

  // Evitar capturar consultas numéricas de caja ("cuanto vendi hoy")
  if (/(cuanto vendi|cuanto gaste|balance|resumen de hoy|resumen del mes|como vamos)/.test(norm)) {
    return false;
  }

  const strongHelpPatterns = [
    /^como\s+(se\s+)?(hace|hago|uso|usar|conecto|conectar|configuro|configurar|agrego|agregar|edito|editar|cambio|cambiar|cargo|cargar|escaneo|escanear|registro|registrar|exporto|exportar|sincronizo|sincronizar|activo|activar|hago un|borro|guardo)/,
    /\b(manual|ayuda|tutorial|guia|instrucciones|explicame|enseñame|enseñame|duda|no se como|no funciona|no anda|no me anda|no lee|error con|problema con|para que sirve|que es|donde esta|donde encuentro|donde configuro)\b/,
    /\b(pistola usb|escaner usb|adaptador otg|api key|oauth|client id|google drive|google sheets|sin internet|modo offline|backup|respaldo|plantilla|planilla|columnas|arca|afip)\b.*\?/,
    /\?.*(pistola|escaner|usb|otg|gemini|groq|llama|openai|drive|sheets|docs|clima|ubicacion|offline|planilla|columna|respaldo|backup|redes|microfono|camara)/,
  ];

  if (strongHelpPatterns.some((re) => re.test(norm))) {
    return true;
  }

  // Preguntas explícitas con signo ? que no mencionan montos ni verbos de transacción
  if (
    norm.includes('?') &&
    !/(vendi|vendimos|gaste|pague|compre|regale|cambie|\$|\d{3,})/.test(norm) &&
    /(como|donde|puedo|se puede|funciona|sirve|hago|conectar|configurar|usar|cambiar|agregar|activar)/.test(norm)
  ) {
    return true;
  }

  return false;
}

export function searchManualSections(query: string, limit = 3): ManualSection[] {
  const norm = normalizeText(query);
  if (!norm) return MANUAL_SECTIONS.slice(0, limit);

  const tokens = norm
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !['como', 'para', 'esta', 'este', 'unas', 'unos', 'donde', 'puedo', 'quiero', 'hacer'].includes(t));

  const scored = MANUAL_SECTIONS.map((section) => {
    let score = 0;
    const titleNorm = normalizeText(section.title);
    const summaryNorm = normalizeText(section.summary);
    const bodyNorm = normalizeText(
      `${section.steps.join(' ')} ${(section.tips || []).join(' ')}`
    );

    for (const kw of section.keywords) {
      const kwNorm = normalizeText(kw);
      if (norm.includes(kwNorm)) score += 6;
    }

    for (const token of tokens) {
      if (titleNorm.includes(token)) score += 4;
      if (section.keywords.some((k) => normalizeText(k).includes(token))) score += 3;
      if (summaryNorm.includes(token)) score += 2;
      if (bodyNorm.includes(token)) score += 1;
    }

    return { section, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((item) => item.section);
}

/**
 * Construye una respuesta clara, accionable y directa desde el manual interno
 * (funciona 100% offline por voz o texto).
 */
export function buildManualAnswerOffline(query: string): string {
  const matches = searchManualSections(query, 2);
  if (matches.length === 0) {
    return [
      'Podés consultarme sobre cualquiera de estas funciones:',
      '• Voz y texto (cómo dictar ventas, gastos, cambios y regalos)',
      '• Escáner de código de barras (cámara o pistola USB/OTG)',
      '• Planillas editables por rubro (cómo agregar o editar columnas)',
      '• Stock con foto + IA y Libro Diario interno',
      '• Redes sociales + clima y ubicación',
      '• Conexión de IA (Gemini, Meta Llama, OpenAI) y Google Drive/Sheets',
      '• Modo offline en ferias y respaldo JSON.',
      '',
      'También podés abrir el botón "Manual" arriba a la derecha para ver la guía completa.',
    ].join('\n');
  }

  const primary = matches[0];
  const lines = [
    `📘 ${primary.number}. ${primary.title}`,
    primary.summary,
    '',
    'Paso a paso:',
    ...primary.steps.map((step, i) => `${i + 1}. ${step}`),
  ];

  if (primary.voiceExamples && primary.voiceExamples.length > 0) {
    lines.push('', 'Ejemplos por voz o texto:', ...primary.voiceExamples.slice(0, 4).map((e) => `• ${e}`));
  }

  if (primary.tips && primary.tips.length > 0) {
    lines.push('', `Tip: ${primary.tips[0]}`);
  }

  return lines.join('\n');
}

/**
 * Prepara contexto compacto del manual para inyectarlo en el prompt del proveedor de IA
 * y responder dudas del cliente con precisión total sobre la app.
 */
export function getRelevantManualContextForAI(query: string): string {
  const matches = searchManualSections(query, 2);
  const selected = matches.length > 0 ? matches : MANUAL_SECTIONS.slice(0, 2);
  return selected
    .map(
      (s) =>
        `[${s.number}. ${s.title}]\n${s.summary}\nPasos:\n${s.steps
          .map((st, idx) => `${idx + 1}) ${st}`)
          .join('\n')}${s.tips ? `\nTips: ${s.tips.join(' ')}` : ''}`
    )
    .join('\n\n');
}
