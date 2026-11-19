/**
 * Servicio de síntesis de voz (Text-to-Speech) optimizado para Español Argentino / Latinoamericano.
 * Evita que el navegador use la voz por defecto en inglés fonético.
 */

let cachedVoice: SpeechSynthesisVoice | null = null;

export function getBestSpanishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  if (cachedVoice) return cachedVoice;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1. Prioridad: Español de Argentina (es-AR)
  const esAr = voices.find((v) => {
    const l = v.lang.toLowerCase();
    return l === 'es-ar' || l === 'es_ar';
  });
  if (esAr) {
    cachedVoice = esAr;
    return esAr;
  }

  // 2. Prioridad: Español Latinoamericano (es-419, es-US, es-MX, es-CL, es-UY, es-CO, etc.)
  const latam = voices.find((v) => {
    const l = v.lang.toLowerCase();
    return (
      l.includes('419') ||
      l.includes('es-us') ||
      l.includes('es-mx') ||
      l.includes('es-cl') ||
      l.includes('es-uy') ||
      l.includes('es-co')
    );
  });
  if (latam) {
    cachedVoice = latam;
    return latam;
  }

  // 3. Prioridad: Cualquier voz nativa en español
  const anyEs = voices.find((v) => v.lang.toLowerCase().startsWith('es'));
  if (anyEs) {
    cachedVoice = anyEs;
    return anyEs;
  }

  return null;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null;
    getBestSpanishVoice();
  };
}

export function speakSpanish(text: string, onEnd?: () => void): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel();

    // Limpieza de emojis y caracteres que traban el sintetizador
    const cleanText = text
      .replace(/[•*#_`~📘💡⚡🔥✅💰💸📷📦📱]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const utter = new SpeechSynthesisUtterance(cleanText);
    const voice = getBestSpanishVoice();

    if (voice) {
      utter.voice = voice;
      utter.lang = voice.lang;
    } else {
      utter.lang = 'es-AR';
    }

    // Parámetros de articulación nítida y pausada
    utter.rate = 0.95;
    utter.pitch = 1.0;

    if (onEnd) {
      utter.onend = onEnd;
      utter.onerror = () => onEnd();
    }

    window.speechSynthesis.speak(utter);
  } catch (err) {
    console.warn('No se pudo reproducir el audio:', err);
  }
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
