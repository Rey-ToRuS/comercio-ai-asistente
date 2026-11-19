import type { BusinessTypeId, Product, WeatherContext } from '../types';

export interface ContextualAnalysis {
  timeOfDay: 'manana' | 'mediodia' | 'tarde' | 'noche';
  timeLabel: string;
  isWeekend: boolean;
  dayLabel: string;
  climateState: 'calor_extremo' | 'calor_moderado' | 'templado' | 'fresco' | 'frio_intenso' | 'desconocido';
  isRaining: boolean;
  temperatureC?: number;
  locationLabel: string;
  marketingFocus: string;
  suggestedKeywords: string[];
  suggestedHooks: string[];
}

export function analyzeCurrentContext(
  businessType: BusinessTypeId,
  weather: WeatherContext,
  businessName: string
): ContextualAnalysis {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Domingo, 6 = Sábado
  const isWeekend = day === 0 || day === 6;

  const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayLabel = daysOfWeek[day];

  let timeOfDay: ContextualAnalysis['timeOfDay'] = 'tarde';
  let timeLabel = 'la tarde';
  if (hour >= 6 && hour < 12) {
    timeOfDay = 'manana';
    timeLabel = 'la mañana';
  } else if (hour >= 12 && hour < 15) {
    timeOfDay = 'mediodia';
    timeLabel = 'el mediodía';
  } else if (hour >= 15 && hour < 20) {
    timeOfDay = 'tarde';
    timeLabel = 'la tarde';
  } else {
    timeOfDay = 'noche';
    timeLabel = 'la noche';
  }

  const temp = weather.enabled && weather.tempC !== undefined ? weather.tempC : undefined;
  const conditionLower = (weather.condition || '').toLowerCase();
  const isRaining =
    conditionLower.includes('lluvia') ||
    conditionLower.includes('llovizna') ||
    conditionLower.includes('tormenta') ||
    conditionLower.includes('chubasco');

  let climateState: ContextualAnalysis['climateState'] = 'templado';
  if (temp !== undefined) {
    if (temp >= 30) climateState = 'calor_extremo';
    else if (temp >= 24) climateState = 'calor_moderado';
    else if (temp >= 18) climateState = 'templado';
    else if (temp >= 12) climateState = 'fresco';
    else climateState = 'frio_intenso';
  }

  const locationLabel = [weather.neighborhood, weather.city].filter(Boolean).join(', ') || 'la zona';

  // Lógica contextual especializada por tipo de negocio
  let marketingFocus = '';
  const suggestedKeywords: string[] = [];
  const suggestedHooks: string[] = [];

  switch (businessType) {
    case 'kiosco':
      if (climateState === 'calor_extremo' || climateState === 'calor_moderado') {
        marketingFocus = `Ola de calor (${temp ? `${temp}°C` : 'alta temperatura'}). Prioridad máxima: bebidas heladas, gaseosas, cervezas en lata, aguas saborizadas, hielo en bolsa y helados.`;
        suggestedKeywords.push('bebida', 'gaseosa', 'agua', 'cerveza', 'hielo', 'helado', 'fria', 'frio', 'lata', 'botella', 'jugo', 'palito', 'refresco');
        suggestedHooks.push(
          `¡${temp ? `${temp}°C` : 'Calor insoportable'} en ${locationLabel}! 🔥 Las heladeras de ${businessName} están al palo: bebidas bien frías y helados al paso.`,
          `No te deshidrates: pasate por ${businessName} a buscar tu gaseosa o agua helada en un toque.`
        );
      } else if (climateState === 'frio_intenso' || climateState === 'fresco') {
        marketingFocus = `Clima frío (${temp ? `${temp}°C` : 'baja temperatura'}). Prioridad: chocolates, alfajores triples, café al paso, galletitas dulces y golosinas calóricas.`;
        suggestedKeywords.push('chocolate', 'alfajor', 'cafe', 'galletita', 'oblea', 'turron', 'bombones', 'dulce');
        suggestedHooks.push(
          `Con este frío en ${locationLabel}, nada mejor que un buen alfajor con café o tu chocolate favorito en ${businessName}.`,
          `Tentate hoy: surtido completo de chocolates y alfajores para combatir el frío.`
        );
      } else if (isRaining) {
        marketingFocus = 'Día de lluvia: snacks, papas fritas, golosinas para maratón de series y fiado / pedidos rápidos.';
        suggestedKeywords.push('papas', 'snack', 'chocolate', 'gomitas', 'galletitas');
        suggestedHooks.push(`Tarde de lluvia ideal para pelis y picoteo. Llevate tus snacks preferidos en ${businessName}.`);
      } else {
        marketingFocus = 'Atención rápida de mostrador: golosinas, cigarrillos, bebidas y snacks del día.';
        suggestedKeywords.push('bebida', 'snack', 'alfajor', 'caramelos');
        suggestedHooks.push(`¡Buenas tardes! Tenemos todo listo para tu pausa del día en ${businessName}.`);
      }
      break;

    case 'gastronomia':
      if (climateState === 'calor_extremo' || climateState === 'calor_moderado') {
        marketingFocus = 'Calor: cervezas artesanales bien frías, licuados naturales, ensaladas frescas, postres helados y mesas al aire libre.';
        suggestedKeywords.push('cerveza', 'fresco', 'ensalada', 'licuado', 'limonada', 'helado', 'tirada', 'pinta');
        suggestedHooks.push(
          `Con estos ${temp ? `${temp}°C` : 'días de calor'}, bajá el ritmo con una birra bien helada o un licuado fresco en ${businessName}.`,
          `Menú fresco del día: platos livianos y bebidas al hielo para disfrutar en ${businessName}.`
        );
      } else if (climateState === 'frio_intenso' || isRaining) {
        marketingFocus = 'Frío / Lluvia: platos calientes de olla, empanadas recién horneadas, café de especialidad y delivery.';
        suggestedKeywords.push('empanada', 'caliente', 'guiso', 'cafe', 'horno', 'sopa', 'medialuna');
        suggestedHooks.push(
          `Empanadas y platos humeantes recién salidos de la cocina. ¡Vení a refugiarte del frío en ${businessName}!`,
          `Hacé tu pedido directo y te lo llevamos calentito a tu casa.`
        );
      } else {
        marketingFocus = 'Comidas del día, promociones por turno y pedidos para llevar.';
        suggestedKeywords.push('combo', 'almuerzo', 'cena', 'promo', 'comida');
        suggestedHooks.push(`Cocinamos por vos hoy en ${businessName}. ¡Mirá los recomendados del menú!`);
      }
      break;

    case 'feria':
      if (isWeekend) {
        marketingFocus = 'Fin de semana de feria: paseo al aire libre, artesanías únicas, mates para la plaza y regalos.';
        suggestedKeywords.push('mate', 'termo', 'cuero', 'artesania', 'madera', 'regalo', 'feria', 'puesto');
        suggestedHooks.push(
          `¡Hermoso ${dayLabel} en ${locationLabel}! Vení a pasear por la feria y pasá por el puesto de ${businessName}.`,
          `Piezas únicas hechas a mano esperándote en ${businessName}. ¡Aceptamos todos los medios de pago!`
        );
      } else {
        marketingFocus = 'Producción del taller, encargos personalizados y envíos para el fin de semana.';
        suggestedKeywords.push('taller', 'hechoamano', 'artesanal', 'pedido', 'mate');
        suggestedHooks.push(`Directo desde nuestro taller: conocé lo nuevo que preparamos en ${businessName}.`);
      }
      break;

    case 'indumentaria':
      if (climateState === 'calor_extremo' || climateState === 'calor_moderado') {
        marketingFocus = 'Ropa liviana de verano: remeras de algodón peinado, lino, shorts, vestidos frescos y musculosas.';
        suggestedKeywords.push('remera', 'short', 'lino', 'vestido', 'musculosa', 'liviano', 'verano');
        suggestedHooks.push(
          `Looks frescos para sobrevivir a los ${temp ? `${temp}°C` : 'días de calor'}. Probate lo nuevo en ${businessName}.`,
          `Ropa liviana y cómoda para ${timeLabel} en ${businessName}.`
        );
      } else {
        marketingFocus = 'Ropa de abrigo, buzos confortables, camperas y prendas de temporada.';
        suggestedKeywords.push('buzo', 'campera', 'abrigo', 'pantalon', 'invierno');
        suggestedHooks.push(`Abrigate con estilo: nuevos ingresos de temporada en ${businessName}.`);
      }
      break;

    case 'servicios':
      marketingFocus = 'Turnos disponibles, presupuestos sin cargo y soluciones rápidas en el taller.';
      suggestedKeywords.push('taller', 'reparacion', 'servicio', 'turno', 'garantia');
      suggestedHooks.push(`¿Necesitás resolverlo hoy? En ${businessName} te damos presupuesto en el acto.`);
      break;

    default: // general
      marketingFocus = `Atención al cliente en ${locationLabel}, stock disponible y promociones vigentes.`;
      suggestedKeywords.push('promo', 'oferta', 'calidad', 'stock', 'precio');
      suggestedHooks.push(`Lo que necesitás para tu día está en ${businessName}. ¡Consultanos sin compromiso!`);
      break;
  }

  return {
    timeOfDay,
    timeLabel,
    isWeekend,
    dayLabel,
    climateState,
    isRaining,
    temperatureC: temp,
    locationLabel,
    marketingFocus,
    suggestedKeywords,
    suggestedHooks,
  };
}

/**
 * Selecciona inteligentemente productos del stock real que coincidan con el contexto actual.
 * Por ejemplo: si hace 34°C en un kiosco, prioriza bebidas, helados o cervezas si existen en stock.
 */
export function filterProductsByContext(
  products: Product[],
  context: ContextualAnalysis
): Product[] {
  if (products.length === 0) return [];

  const inStock = products.filter((p) => p.stock > 0);
  const candidates = inStock.length > 0 ? inStock : products;

  if (context.suggestedKeywords.length === 0) {
    return candidates.slice(0, 3);
  }

  // Puntuación por coincidencia de palabras clave contextuales
  const scored = candidates.map((prod) => {
    const textToMatch = `${prod.name} ${prod.category} ${prod.description || ''}`.toLowerCase();
    let score = 0;
    for (const kw of context.suggestedKeywords) {
      if (textToMatch.includes(kw.toLowerCase())) {
        score += 3;
      }
    }
    // Bonificación si tiene foto
    if (prod.photoDataUrl || prod.driveFileId) {
      score += 1;
    }
    return { prod, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Si los mejores productos coinciden con el contexto, devolverlos
  const topMatches = scored.filter((x) => x.score > 1).map((x) => x.prod);
  if (topMatches.length > 0) {
    return topMatches.slice(0, 4);
  }

  // Si ningún producto coincide con las palabras de calor/frío, devolver los más destacados en stock
  return candidates.slice(0, 3);
}
