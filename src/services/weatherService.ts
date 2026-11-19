import type { WeatherContext } from '../types';

const WEATHER_CACHE_KEY = 'comercio_ai_weather_cache_v1';

const WMO_CODES_ES: Record<number, string> = {
  0: 'Despejado',
  1: 'Mayormente despejado',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Niebla',
  48: 'Niebla con escarcha',
  51: 'Llovizna leve',
  53: 'Llovizna moderada',
  55: 'Llovizna intensa',
  61: 'Lluvia leve',
  63: 'Lluvia moderada',
  65: 'Lluvia fuerte',
  71: 'Nieve leve',
  73: 'Nieve moderada',
  75: 'Nieve fuerte',
  80: 'Chaparrones leves',
  81: 'Chaparrones moderados',
  82: 'Chaparrones fuertes',
  95: 'Tormenta eléctrica',
  96: 'Tormenta con granizo',
  99: 'Tormenta fuerte',
};

export function loadCachedWeather(): WeatherContext {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY);
    if (!raw) return { enabled: false };
    return JSON.parse(raw) as WeatherContext;
  } catch {
    return { enabled: false };
  }
}

export function saveCachedWeather(ctx: WeatherContext): void {
  try {
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(ctx));
  } catch {
    // Ignore storage quota errors
  }
}

export function getWeatherDescription(code?: number): string {
  if (code === undefined) return 'Sin datos';
  return WMO_CODES_ES[code] || 'Variable';
}

export async function fetchCurrentWeatherContext(): Promise<WeatherContext> {
  if (!('geolocation' in navigator)) {
    throw new Error('Tu dispositivo no soporta geolocalización.');
  }

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 12000,
      maximumAge: 1000 * 60 * 10,
    });
  });

  const lat = Number(position.coords.latitude.toFixed(4));
  const lon = Number(position.coords.longitude.toFixed(4));

  let tempC: number | undefined;
  let weatherCode: number | undefined;
  let condition = 'Sin datos';
  let city = '';
  let neighborhood = '';

  // 1. Open-Meteo (100% gratuito, sin clave ni servidor propio)
  try {
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`
    );
    if (weatherRes.ok) {
      const weatherData = await weatherRes.json();
      tempC = Math.round(weatherData?.current?.temperature_2m);
      weatherCode = weatherData?.current?.weather_code;
      condition = getWeatherDescription(weatherCode);
    }
  } catch {
    // Mantener parcial si falla la red
  }

  // 2. Geocodificación inversa cliente gratuita (barrio / ciudad)
  try {
    const geoRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=es`
    );
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      neighborhood = geoData?.locality || '';
      city = geoData?.city || geoData?.principalSubdivision || '';
      if (neighborhood === city) neighborhood = '';
    }
  } catch {
    // Fallback silencioso a coordenadas si falla geocodificación
  }

  const ctx: WeatherContext = {
    enabled: true,
    lat,
    lon,
    city: city || `${lat}, ${lon}`,
    neighborhood: neighborhood || undefined,
    tempC,
    weatherCode,
    condition,
    updatedAt: new Date().toISOString(),
  };

  saveCachedWeather(ctx);
  return ctx;
}

export function formatWeatherLocationBadge(ctx: WeatherContext): string {
  if (!ctx.enabled) return '';
  const place = [ctx.neighborhood, ctx.city].filter(Boolean).join(', ');
  const temp = ctx.tempC !== undefined ? `${ctx.tempC}°C` : '';
  const cond = ctx.condition && ctx.condition !== 'Sin datos' ? ctx.condition : '';
  return [place, temp, cond].filter(Boolean).join(' · ');
}
