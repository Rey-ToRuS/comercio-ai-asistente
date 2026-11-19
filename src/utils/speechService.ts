/**
 * Servicio de voz ultra-robusto para ComercioAI.
 * 1. Detecta y prioriza voces nativas en español argentino (es-AR) y latinoamericano (es-419, es-MX, etc.).
 * 2. Si el sistema operativo (Windows) solo cuenta con voces en inglés (ej: Microsoft David),
 *    evita forzar a David a leer fonética en inglés y provee diagnósticos e instrucciones claras.
 * 3. Permite seleccionar y probar manualmente cualquier voz instalada en el dispositivo.
 */

export interface VoiceDiagnostic {
  hasSpanish: boolean;
  bestVoice: SpeechSynthesisVoice | null;
  spanishVoices: SpeechSynthesisVoice[];
  allVoices: SpeechSynthesisVoice[];
  isWindowsEnglishOnly: boolean;
}

let cachedVoices: SpeechSynthesisVoice[] = [];
let selectedVoiceUri: string | null = null;
let voiceListeners: Array<(diag: VoiceDiagnostic) => void> = [];

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const v = window.speechSynthesis.getVoices() || [];
  if (v.length > 0) {
    cachedVoices = v;
    notifyListeners();
  }
  return cachedVoices;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    loadVoices();
  };
}

function notifyListeners() {
  const diag = getVoiceDiagnostic();
  voiceListeners.forEach((fn) => {
    try {
      fn(diag);
    } catch (e) {
      console.warn('Error en voice listener:', e);
    }
  });
}

export function subscribeVoiceDiagnostic(callback: (diag: VoiceDiagnostic) => void): () => void {
  voiceListeners.push(callback);
  callback(getVoiceDiagnostic());
  return () => {
    voiceListeners = voiceListeners.filter((fn) => fn !== callback);
  };
}

export function setSelectedVoice(voiceUri: string): void {
  selectedVoiceUri = voiceUri;
}

export function getAllSystemVoices(): SpeechSynthesisVoice[] {
  if (cachedVoices.length > 0) return cachedVoices;
  return loadVoices();
}

export function isSpanishVoice(v: SpeechSynthesisVoice): boolean {
  const lang = (v.lang || '').toLowerCase().replace(/_/g, '-');
  const name = (v.name || '').toLowerCase();

  return (
    lang.startsWith('es') ||
    lang.includes('es-') ||
    name.includes('spanish') ||
    name.includes('español') ||
    name.includes('argentina') ||
    name.includes('mexico') ||
    name.includes('tomas') ||
    name.includes('salome') ||
    name.includes('dalia') ||
    name.includes('sabina') ||
    name.includes('helena') ||
    name.includes('elena') ||
    name.includes('laura') ||
    name.includes('raul')
  );
}

export function getSpanishVoices(): SpeechSynthesisVoice[] {
  return getAllSystemVoices().filter((v) => isSpanishVoice(v));
}

export function getBestSpanishVoice(): SpeechSynthesisVoice | null {
  const voices = getAllSystemVoices();
  if (!voices || voices.length === 0) return null;

  // 0. Si el usuario seleccionó una voz manualmente
  if (selectedVoiceUri) {
    const manual = voices.find((v) => v.voiceURI === selectedVoiceUri || v.name === selectedVoiceUri);
    if (manual) return manual;
  }

  // 1. Prioridad Máxima: Español de Argentina (es-AR, Tomás, Sabina Argentina)
  const esAr = voices.find((v) => {
    const l = (v.lang || '').toLowerCase().replace(/_/g, '-');
    const n = (v.name || '').toLowerCase();
    return (
      l === 'es-ar' ||
      n.includes('argentina') ||
      n.includes('buenos aires') ||
      (n.includes('tomas') && n.includes('natural'))
    );
  });
  if (esAr) return esAr;

  // 2. Prioridad: Español Latinoamericano (es-419, es-US, es-MX, es-CO, Salomé, Dalia, etc.)
  const latam = voices.find((v) => {
    const l = (v.lang || '').toLowerCase().replace(/_/g, '-');
    const n = (v.name || '').toLowerCase();
    return (
      l.includes('419') ||
      l.includes('es-us') ||
      l.includes('es-mx') ||
      l.includes('es-co') ||
      l.includes('es-cl') ||
      l.includes('es-uy') ||
      n.includes('mexico') ||
      n.includes('colombia') ||
      n.includes('salome') ||
      n.includes('dalia') ||
      n.includes('sabina') ||
      n.includes('raul')
    );
  });
  if (latam) return latam;

  // 3. Cualquier otra voz en español disponible (Google español, Microsoft Helena, etc.)
  const anyEs = voices.find((v) => isSpanishVoice(v));
  if (anyEs) return anyEs;

  return null;
}

export function getVoiceDiagnostic(): VoiceDiagnostic {
  const allVoices = getAllSystemVoices();
  const spanishVoices = allVoices.filter(isSpanishVoice);
  const bestVoice = getBestSpanishVoice();
  const hasSpanish = spanishVoices.length > 0;
  const isWindowsEnglishOnly =
    !hasSpanish &&
    allVoices.some((v) => {
      const n = (v.name || '').toLowerCase();
      return n.includes('david') || n.includes('zira') || n.includes('mark') || (v.lang || '').startsWith('en');
    });

  return {
    hasSpanish,
    bestVoice,
    spanishVoices,
    allVoices,
    isWindowsEnglishOnly,
  };
}

export function speakSpanish(text: string, onEnd?: () => void): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;

  const cleanText = text
    .replace(/[•*#_`~📘💡⚡🔥✅💰💸📷📦📱🥤🧃🍺🍦🧊🍫]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanText) return false;

  stopSpeaking();

  const spanishVoice = getBestSpanishVoice();

  // Si encontramos una voz en español (ej: Google español, Microsoft Tomas, Helena, etc.):
  if (spanishVoice) {
    try {
      const utter = new SpeechSynthesisUtterance(cleanText);
      utter.voice = spanishVoice;
      utter.lang = spanishVoice.lang || 'es-AR';
      utter.rate = 0.95;
      utter.pitch = 1.0;

      if (onEnd) {
        utter.onend = onEnd;
        utter.onerror = () => onEnd();
      }

      window.speechSynthesis.speak(utter);
      return true;
    } catch (err) {
      console.warn('Error al reproducir voz en español:', err);
      return false;
    }
  }

  // Si en Windows NO hay ninguna voz en español instalada:
  // IMPORTANTE: NO forzamos a Microsoft David en inglés porque lee fonética inglesa inentendible.
  // Avisamos al usuario o reproducimos con rate más pausado únicamente si se solicita expresamente.
  console.warn('ComercioAI: No se detectó ninguna voz en español instalada en este sistema Windows.');
  return false;
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

