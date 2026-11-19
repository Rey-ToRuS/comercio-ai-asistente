import type {
  AIProviderId,
  AppSettings,
  LedgerEntry,
  ParsedAssistantAction,
  Product,
  SheetTemplate,
  SocialDraft,
  WeatherContext,
} from '../types';
import { dataUrlToBase64Payload } from '../utils/image';
import { formatWeatherLocationBadge } from './weatherService';
import { parseCommandLocally } from './localCommandParser';
import { getRelevantManualContextForAI, isHelpOrManualQuery } from '../data/manualKnowledgeBase';

export interface AIProviderMeta {
  id: AIProviderId;
  name: string;
  family: string;
  defaultModel: string;
  models: string[];
  supportsVision: boolean;
  keyHint: string;
  description: string;
}

export const AI_PROVIDERS: AIProviderMeta[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    family: 'Familia Google (Gemini + Drive + Sheets + Docs)',
    defaultModel: 'gemini-2.5-flash',
    models: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'],
    supportsVision: true,
    keyHint: 'Obtené tu clave gratuita en aistudio.google.com',
    description: 'Ideal para foto de productos (Visión), comandos por voz/texto y generación de redes.',
  },
  {
    id: 'groq_meta',
    name: 'Meta Llama (vía Groq)',
    family: 'Familia Meta (Llama 3.3 / Vision)',
    defaultModel: 'llama-3.3-70b-versatile',
    models: ['llama-3.3-70b-versatile', 'llama-3.2-11b-vision-preview', 'llama-3.1-8b-instant'],
    supportsVision: true,
    keyHint: 'Clave gratuita en console.groq.com',
    description: 'Ultra veloz con modelos abiertos de Meta, sin servidores intermedios.',
  },
  {
    id: 'openai',
    name: 'OpenAI (GPT-4o)',
    family: 'OpenAI',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o'],
    supportsVision: true,
    keyHint: 'Clave en platform.openai.com',
    description: 'Excelente comprensión de texto, visión de productos y copys comerciales.',
  },
  {
    id: 'local',
    name: 'Motor Local Offline (Sin API)',
    family: '100% en tu dispositivo',
    defaultModel: 'offline-nlp-es',
    models: ['offline-nlp-es'],
    supportsVision: false,
    keyHint: 'No requiere clave ni conexión a internet',
    description: 'Interpreta ventas, gastos, cambios y regalos en español incluso sin señal en ferias.',
  },
];

function extractJsonBlock(rawText: string): string {
  const fenced = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const firstBrace = rawText.indexOf('{');
  const lastBrace = rawText.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return rawText.slice(firstBrace, lastBrace + 1);
  }
  return rawText.trim();
}

async function callProviderText(
  settings: AppSettings,
  systemPrompt: string,
  userPrompt: string,
  imageDataUrl?: string
): Promise<string> {
  const { aiProvider, aiApiKey, aiModel } = settings;
  if (!aiApiKey.trim()) {
    throw new Error('Falta configurar la API Key del proveedor de IA en Conexiones.');
  }

  if (aiProvider === 'gemini') {
    const model = aiModel || 'gemini-2.5-flash';
    const parts: Array<Record<string, unknown>> = [{ text: `${systemPrompt}\n\n${userPrompt}` }];
    if (imageDataUrl) {
      const { mimeType, data } = dataUrlToBase64Payload(imageDataUrl);
      parts.push({ inline_data: { mime_type: mimeType, data } });
    }
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(
        aiApiKey.trim()
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: { temperature: 0.25 },
        }),
      }
    );
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini (${res.status}): ${errText.slice(0, 180)}`);
    }
    const json = await res.json();
    const out = json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('\n');
    if (!out) throw new Error('Gemini devolvió una respuesta vacía.');
    return out;
  }

  // OpenAI-compatible (OpenAI & Meta Llama vía Groq)
  const endpoint =
    aiProvider === 'groq_meta'
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';

  const model =
    aiModel || (aiProvider === 'groq_meta' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini');

  const userContent: unknown = imageDataUrl
    ? [
        { type: 'text', text: userPrompt },
        { type: 'image_url', image_url: { url: imageDataUrl } },
      ]
    : userPrompt;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${aiApiKey.trim()}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.25,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Proveedor IA (${res.status}): ${errText.slice(0, 180)}`);
  }
  const json = await res.json();
  const out = json?.choices?.[0]?.message?.content;
  if (!out) throw new Error('El proveedor de IA devolvió una respuesta vacía.');
  return out;
}

export async function testAiProviderConnection(settings: AppSettings): Promise<string> {
  if (settings.aiProvider === 'local') {
    return 'Motor Local Offline activo (no requiere conexión ni API key).';
  }
  const reply = await callProviderText(
    settings,
    'Respondé solo con una frase breve de confirmación en español.',
    'Confirmá que estás listo para asistir a un comercio.'
  );
  return reply.trim();
}

export async function interpretMerchantCommand(
  command: string,
  settings: AppSettings,
  products: Product[],
  ledger: LedgerEntry[],
  template: SheetTemplate
): Promise<ParsedAssistantAction> {
  // Si está offline o en modo local o sin API key, usar el motor local instantáneo
  if (!navigator.onLine || settings.aiProvider === 'local' || !settings.aiApiKey.trim()) {
    return parseCommandLocally(command, products, ledger, template);
  }

  const catalogSample = products
    .slice(0, 40)
    .map((p) => `- id:${p.id} | ${p.name} | $${p.price} | stock:${p.stock}${p.barcode ? ` | cod:${p.barcode}` : ''}`)
    .join('\n');

  const manualContext = isHelpOrManualQuery(command)
    ? `\n\nManual oficial relevante para responder dudas o configuraciones del usuario:\n${getRelevantManualContextForAI(command)}`
    : '';

  const systemPrompt = `Sos un asistente comercial para control interno (sin impuestos ni ARCA) de "${settings.businessName}" (rubro: ${template.name}).
Tu tarea es interpretar el comando de voz/texto del comerciante y devolver EXCLUSIVAMENTE un JSON válido (sin texto adicional) con uno de estos 3 formatos:

1) Registrar movimiento en Libro Diario:
{
  "kind": "movement",
  "summary": "Resumen breve en 1 línea",
  "data": {
    "direction": "ingreso" | "egreso" | "neutro",
    "type": "venta" | "cambio" | "regalo" | "ingreso_extra" | "gasto_general" | "proveedor" | "devolucion" | "retiro" | "otro",
    "reason": "Motivo concreto",
    "description": "Descripción clara",
    "amount": 0,
    "paymentMethod": "efectivo" | "transferencia" | "tarjeta" | "qr" | "mixto" | "sin_cargo" | "cuenta_corriente",
    "productId": "id exacto del catálogo si coincide, o null",
    "productName": "nombre del producto si aplica",
    "quantity": 1,
    "counterparty": "proveedor o cliente si se menciona, o null",
    "notes": "nota breve"
  }
}

2) Crear nuevo producto en stock:
{
  "kind": "product",
  "summary": "Resumen breve",
  "data": {
    "name": "Nombre del producto",
    "category": "Una categoría de: ${template.categories.join(', ')}",
    "price": 0,
    "cost": 0,
    "stock": 1,
    "unit": "u",
    "description": "Descripción"
  }
}

3) Consulta de información, dudas de uso, ayuda o configuración de la app:
{
  "kind": "answer",
  "answer": "Respuesta clara, paso a paso y concisa en español rioplatense basada en el manual oficial"
}

Stock actual:
${catalogSample || '(sin productos cargados todavía)'}${manualContext}`;

  try {
    const raw = await callProviderText(settings, systemPrompt, `Comando del comerciante: "${command}"`);
    const parsed = JSON.parse(extractJsonBlock(raw));

    if (parsed.kind === 'movement' && parsed.data) {
      return {
        kind: 'movement',
        confidence: 'high',
        source: 'ai',
        rawCommand: command,
        summary: parsed.summary || parsed.data.description || command,
        data: {
          direction: parsed.data.direction || 'ingreso',
          type: parsed.data.type || 'venta',
          reason: parsed.data.reason || template.movementReasons[0] || 'Venta',
          description: parsed.data.description || command,
          amount: Number(parsed.data.amount) || 0,
          paymentMethod: parsed.data.paymentMethod || 'efectivo',
          productId: parsed.data.productId || undefined,
          productName: parsed.data.productName || undefined,
          quantity: parsed.data.quantity ? Number(parsed.data.quantity) : undefined,
          counterparty: parsed.data.counterparty || undefined,
          notes: parsed.data.notes || command,
        },
      };
    }

    if (parsed.kind === 'product' && parsed.data) {
      return {
        kind: 'product',
        confidence: 'high',
        source: 'ai',
        rawCommand: command,
        summary: parsed.summary || `Nuevo producto: ${parsed.data.name}`,
        data: {
          name: parsed.data.name || 'Producto',
          category: parsed.data.category || template.categories[0] || 'General',
          price: Number(parsed.data.price) || 0,
          cost: parsed.data.cost ? Number(parsed.data.cost) : undefined,
          stock: Number(parsed.data.stock) || 1,
          unit: parsed.data.unit || 'u',
          description: parsed.data.description || '',
        },
      };
    }

    if (parsed.kind === 'answer' && parsed.answer) {
      return {
        kind: 'answer',
        source: 'ai',
        rawCommand: command,
        answer: String(parsed.answer),
      };
    }
  } catch {
    // Fallback transparente al motor local si la IA falla o devuelve JSON inválido
  }

  return parseCommandLocally(command, products, ledger, template);
}

export async function analyzeProductPhotoWithAI(
  imageDataUrl: string,
  settings: AppSettings,
  template: SheetTemplate
): Promise<{
  name: string;
  category: string;
  description: string;
  suggestedPrice?: number;
}> {
  if (!navigator.onLine || settings.aiProvider === 'local' || !settings.aiApiKey.trim()) {
    throw new Error('Para analizar fotos con Visión IA, conectá Gemini, OpenAI o Llama Vision y asegurate de tener internet.');
  }

  const systemPrompt = `Sos un catalogador comercial experto para el rubro "${template.name}".
Analizá la foto del producto y devolvé EXCLUSIVAMENTE un JSON válido:
{
  "name": "Nombre comercial corto y claro del producto",
  "category": "Elegí la mejor categoría de: ${template.categories.join(', ')}",
  "description": "Descripción breve y atractiva (1 a 2 líneas) para catálogo y redes",
  "suggestedPrice": null
}`;

  const raw = await callProviderText(
    settings,
    systemPrompt,
    'Identificá el producto en esta foto para cargarlo al stock.',
    imageDataUrl
  );

  const parsed = JSON.parse(extractJsonBlock(raw));
  return {
    name: parsed.name || 'Producto identificado',
    category: parsed.category || template.categories[0] || 'General',
    description: parsed.description || '',
    suggestedPrice: parsed.suggestedPrice ? Number(parsed.suggestedPrice) : undefined,
  };
}

export async function generateSocialContent(params: {
  products: Product[];
  format: SocialDraft['format'];
  tone: SocialDraft['tone'];
  includeWeatherLocation: boolean;
  weather: WeatherContext;
  settings: AppSettings;
  template: SheetTemplate;
  customNote?: string;
}): Promise<{ caption: string; hashtags: string[]; hook?: string; source: 'ai' | 'local' }> {
  const { products, format, tone, includeWeatherLocation, weather, settings, template, customNote } = params;
  const nowStr = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  const weatherBadge = includeWeatherLocation ? formatWeatherLocationBadge(weather) : '';
  const productSummary = products
    .map((p) => `- ${p.name} ($${p.price.toLocaleString('es-AR')}, ${p.category}${p.description ? `, ${p.description}` : ''})`)
    .join('\n');

  // Generador offline instantáneo si no hay internet o está en modo local
  if (!navigator.onLine || settings.aiProvider === 'local' || !settings.aiApiKey.trim()) {
    const main = products[0];
    const placeIntro = weatherBadge ? `Hoy en ${weatherBadge} (${nowStr} hs)` : `Hoy a las ${nowStr} hs`;
    const priceLine = products
      .map((p) => `• ${p.name} — $${p.price.toLocaleString('es-AR')}`)
      .join('\n');

    let hook = `${placeIntro}, mirá lo que recién salió a la mesa`;
    let caption = '';

    if (format === 'reel_script') {
      hook = `Plano detalle de ${main?.name || 'tus productos'} con luz natural (${weatherBadge || 'en el puesto'}).`;
      caption = `🎬 GUIÓN REEL / TIKTOK (15 seg)\n\n1. [0-3s] Gancho: "${placeIntro} te muestro esto que vuela..."\n2. [3-10s] Mostrar en mano:\n${priceLine}\n3. [10-15s] Cierre: "${customNote || 'Escribinos o pasá hoy mismo por ' + settings.businessName}!"`;
    } else if (format === 'whatsapp_status') {
      caption = `${placeIntro} ✨\n${priceLine}\n\n${customNote || 'Consultanos por acá, stock del día disponible.'}\n— ${settings.businessName}`;
    } else if (format === 'fair_promo') {
      caption = `📍 ${placeIntro} ya estamos atendiendo en ${settings.businessName}.\n\nDestacados de hoy:\n${priceLine}\n\n${customNote || '¡Pasá a verlos en persona antes de que se agoten!'}`;
    } else {
      caption = `${placeIntro} ✨\nEn ${settings.businessName} tenemos disponible:\n\n${priceLine}\n\n${customNote || 'Stock actualizado al momento. Consultanos por mensaje directo.'}`;
    }

    const hashtags = [
      `#${settings.businessName.replace(/[^a-zA-Z0-9]/g, '') || 'ComercioLocal'}`,
      `#${template.businessType}`,
      ...(weather.city ? [`#${weather.city.replace(/[^a-zA-Z0-9]/g, '')}`] : []),
      '#Emprendedores',
      '#StockDisponible',
    ];

    return { caption, hashtags, hook, source: 'local' };
  }

  const formatLabels: Record<SocialDraft['format'], string> = {
    instagram_post: 'Post de Instagram listo para publicar',
    reel_script: 'Guión corto (15-20s) para Reel / TikTok con escenas y texto en pantalla',
    whatsapp_status: 'Texto breve y directo para Estado de WhatsApp',
    fair_promo: 'Anuncio en vivo para atraer gente al puesto / feria hoy',
  };

  const systemPrompt = `Sos un creador de contenido comercial especialista en redes locales argentinas para "${settings.businessName}" (rubro: ${template.name}).
Devolvé EXCLUSIVAMENTE un JSON válido:
{
  "hook": "Frase gancho corta de apertura",
  "caption": "Texto completo listo para copiar o compartir",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
}`;

  const userPrompt = `Formato: ${formatLabels[format]}
Tono: ${tone}
Hora actual: ${nowStr} hs
${weatherBadge ? `Contexto real de ubicación y clima (aprovechalo con naturalidad): ${weatherBadge}` : 'Sin datos de clima/ubicación.'}
${customNote ? `Nota del comerciante: ${customNote}` : ''}
Productos del stock real:
${productSummary}`;

  const raw = await callProviderText(settings, systemPrompt, userPrompt);
  const parsed = JSON.parse(extractJsonBlock(raw));
  return {
    hook: parsed.hook || undefined,
    caption: parsed.caption || '',
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
    source: 'ai',
  };
}
