/**
 * Servicio de cotizaciones en vivo para ComercioAI (Dólar, Euro, Real Brasileño).
 * 1. Conecta con APIs gratuitas y sin token (DolarApi).
 * 2. Funciona 100% Offline-First: guarda en caché local con timestamp de actualización.
 * 3. Provee utilidades de conversión rápida de moneda para mostrador y cobro a clientes/turistas.
 */

export interface CurrencyItem {
  id: string;
  code: 'USD' | 'EUR' | 'BRL';
  type: string;
  name: string;
  flag: string;
  symbol: string;
  buy: number;
  sell: number;
  updatedAt: string;
  source: 'online' | 'offline_cache';
}

export interface CurrencySnapshot {
  timestamp: string;
  rates: CurrencyItem[];
  isOnline: boolean;
}

const STORAGE_KEY = 'comercio_cached_currencies_v1';

// Tasas de respaldo iniciales para funcionamiento offline inmediato
const DEFAULT_FALLBACK_RATES: CurrencyItem[] = [
  {
    id: 'usd-blue',
    code: 'USD',
    type: 'blue',
    name: 'Dólar Blue',
    flag: '💵',
    symbol: 'U$D',
    buy: 1620,
    sell: 1640,
    updatedAt: new Date().toISOString(),
    source: 'offline_cache',
  },
  {
    id: 'usd-oficial',
    code: 'USD',
    type: 'oficial',
    name: 'Dólar Oficial (BNA)',
    flag: '🏛️',
    symbol: 'U$D',
    buy: 1535,
    sell: 1585,
    updatedAt: new Date().toISOString(),
    source: 'offline_cache',
  },
  {
    id: 'usd-mep',
    code: 'USD',
    type: 'bolsa',
    name: 'Dólar MEP / Bolsa',
    flag: '📈',
    symbol: 'U$D',
    buy: 1590,
    sell: 1605,
    updatedAt: new Date().toISOString(),
    source: 'offline_cache',
  },
  {
    id: 'usd-tarjeta',
    code: 'USD',
    type: 'tarjeta',
    name: 'Dólar Tarjeta / Turista',
    flag: '💳',
    symbol: 'U$D',
    buy: 2120,
    sell: 2150,
    updatedAt: new Date().toISOString(),
    source: 'offline_cache',
  },
  {
    id: 'eur-oficial',
    code: 'EUR',
    type: 'oficial',
    name: 'Euro',
    flag: '💶',
    symbol: '€',
    buy: 1706,
    sell: 1720,
    updatedAt: new Date().toISOString(),
    source: 'offline_cache',
  },
  {
    id: 'brl-oficial',
    code: 'BRL',
    type: 'oficial',
    name: 'Real Brasileño',
    flag: '🇧🇷',
    symbol: 'R$',
    buy: 262.95,
    sell: 263.1,
    updatedAt: new Date().toISOString(),
    source: 'offline_cache',
  },
];

export function getCachedCurrencies(): CurrencySnapshot {
  if (typeof window === 'undefined') {
    return { timestamp: new Date().toISOString(), rates: DEFAULT_FALLBACK_RATES, isOnline: false };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.rates) && parsed.rates.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error leyendo cotizaciones en caché:', err);
  }

  return {
    timestamp: new Date().toISOString(),
    rates: DEFAULT_FALLBACK_RATES,
    isOnline: false,
  };
}

export function saveCachedCurrencies(snapshot: CurrencySnapshot): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (err) {
    console.warn('Error guardando cotizaciones en caché:', err);
  }
}

export async function fetchLiveCurrencies(): Promise<CurrencySnapshot> {
  const cached = getCachedCurrencies();

  try {
    const [usdRes, eurRes, brlRes] = await Promise.all([
      fetch('https://dolarapi.com/v1/dolares', { signal: AbortSignal.timeout(5000) }),
      fetch('https://dolarapi.com/v1/cotizaciones/eur', { signal: AbortSignal.timeout(5000) }),
      fetch('https://dolarapi.com/v1/cotizaciones/brl', { signal: AbortSignal.timeout(5000) }),
    ]);

    if (!usdRes.ok && !eurRes.ok && !brlRes.ok) {
      return { ...cached, isOnline: false };
    }

    const rates: CurrencyItem[] = [];

    if (usdRes.ok) {
      const usds = await usdRes.json();
      if (Array.isArray(usds)) {
        usds.forEach((item) => {
          let flag = '💵';
          if (item.casa === 'oficial') flag = '🏛️';
          else if (item.casa === 'blue') flag = '💙';
          else if (item.casa === 'bolsa') flag = '📈';
          else if (item.casa === 'tarjeta') flag = '💳';
          else if (item.casa === 'cripto') flag = '🪙';

          rates.push({
            id: `usd-${item.casa}`,
            code: 'USD',
            type: item.casa,
            name: `Dólar ${item.nombre}`,
            flag,
            symbol: 'U$D',
            buy: Number(item.compra) || 0,
            sell: Number(item.venta) || 0,
            updatedAt: item.fechaActualizacion || new Date().toISOString(),
            source: 'online',
          });
        });
      }
    }

    if (eurRes.ok) {
      const eur = await eurRes.json();
      rates.push({
        id: 'eur-oficial',
        code: 'EUR',
        type: 'oficial',
        name: 'Euro',
        flag: '💶',
        symbol: '€',
        buy: Number(eur.compra) || 0,
        sell: Number(eur.venta) || 0,
        updatedAt: eur.fechaActualizacion || new Date().toISOString(),
        source: 'online',
      });
    }

    if (brlRes.ok) {
      const brl = await brlRes.json();
      rates.push({
        id: 'brl-oficial',
        code: 'BRL',
        type: 'oficial',
        name: 'Real Brasileño',
        flag: '🇧🇷',
        symbol: 'R$',
        buy: Number(brl.compra) || 0,
        sell: Number(brl.venta) || 0,
        updatedAt: brl.fechaActualizacion || new Date().toISOString(),
        source: 'online',
      });
    }

    if (rates.length > 0) {
      const newSnapshot: CurrencySnapshot = {
        timestamp: new Date().toISOString(),
        rates,
        isOnline: true,
      };
      saveCachedCurrencies(newSnapshot);
      return newSnapshot;
    }
  } catch (err) {
    console.warn('Fallo al actualizar cotizaciones online, usando caché:', err);
  }

  return { ...cached, isOnline: false };
}

/**
 * Calculadora rápida para mostrador:
 * Convierte montos de moneda extranjera a Pesos Argentinos (ARS) o viceversa.
 */
export function calculateCurrencyConversion(params: {
  amount: number;
  from: 'ARS' | 'USD' | 'EUR' | 'BRL';
  to: 'ARS' | 'USD' | 'EUR' | 'BRL';
  customRate?: number;
  rates: CurrencyItem[];
  preferredUsdType?: string; // 'blue' por defecto en comercios
}): { result: number; rateUsed: number; rateLabel: string } {
  const { amount, from, to, customRate, rates, preferredUsdType = 'blue' } = params;

  if (amount <= 0) return { result: 0, rateUsed: 0, rateLabel: '-' };
  if (from === to) return { result: amount, rateUsed: 1, rateLabel: '1:1' };

  // Obtener cotización de referencia
  let rate = customRate || 0;
  let label = 'Personalizada';

  const findRate = (code: string, type?: string) => {
    return rates.find((r) => r.code === code && (!type || r.type === type)) || rates.find((r) => r.code === code);
  };

  if (from === 'ARS') {
    // Pesos a moneda extranjera (división por precio de venta)
    const targetItem = findRate(to, to === 'USD' ? preferredUsdType : undefined);
    if (targetItem) {
      rate = targetItem.sell || targetItem.buy;
      label = `${targetItem.name} ($${rate.toLocaleString('es-AR')})`;
    }
    const result = rate > 0 ? Math.round((amount / rate) * 100) / 100 : 0;
    return { result, rateUsed: rate, rateLabel: label };
  } else if (to === 'ARS') {
    // Moneda extranjera a Pesos (multiplicación por precio de compra o venta en mostrador)
    const originItem = findRate(from, from === 'USD' ? preferredUsdType : undefined);
    if (originItem) {
      rate = originItem.buy || originItem.sell;
      label = `${originItem.name} ($${rate.toLocaleString('es-AR')})`;
    }
    const result = Math.round(amount * rate);
    return { result, rateUsed: rate, rateLabel: label };
  }

  return { result: 0, rateUsed: 0, rateLabel: '-' };
}
