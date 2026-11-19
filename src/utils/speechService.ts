/**
 * Servicio de voz ultra-robusto para ComercioAI.
 * 1. Detecta y prioriza voces en español argentino / latinoamericano.
 * 2. Si el sistema operativo (Windows) solo tiene voces en inglés (ej: Microsoft David),
 *    evita forzar a David y reproduce audio nativo en español claro.
 * 3. Provee función para listar y seleccionar manualmente la voz instalada.
 */

let selectedVoiceUri: string | null = null;
let audioFallbackElement: HTMLAudioElement | null = null;

export function setSelectedVoice(voiceUri: string): void {
  selectedVoiceUri = voiceUri;
}

export function getAllSystemVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  return window.speechSynthesis.getVoices() || [];
}

export function getSpanishVoices(): SpeechSynthesisVoice[] {
  const voices = getAllSystemVoices();
  return voices.filter((v) => isSpanishVoice(v));
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
    name.includes('sabina') ||
    name.includes('helena') ||
    name.includes('laura') ||
    name.includes('raul')
  );
}

export function getBestSpanishVoice(): SpeechSynthesisVoice | null {
  const voices = getAllSystemVoices();
  if (!voices || voices.length === 0) return null;

  // 0. Si el usuario seleccionó una voz manualmente
  if (selectedVoiceUri) {
    const manual = voices.find((v) => v.voiceURI === selectedVoiceUri || v.name === selectedVoiceUri);
    if (manual) return manual;
  }

  // 1. Prioridad: Español de Argentina (es-AR)
  const esAr = voices.find((v) => {
    const l = (v.lang || '').toLowerCase().replace(/_/g, '-');
    const n = (v.name || '').toLowerCase();
    return l === 'es-ar' || n.includes('argentina') || n.includes('buenos aires');
  });
  if (esAr) return esAr;

  // 2. Prioridad: Español Latinoamericano (es-419, es-US, es-MX, es-CL, etc.)
  const latam = voices.find((v) => {
    const l = (v.lang || '').toLowerCase().replace(/_/g, '-');
    const n = (v.name || '').toLowerCase();
    return (
      l.includes('419') ||
      l.includes('es-us') ||
      l.includes('es-mx') ||
      l.includes('es-cl') ||
      l.includes('es-uy') ||
      l.includes('es-co') ||
      n.includes('mexico') ||
      n.includes('sabina') ||
      n.includes('raul')
    );
  });
  if (latam) return latam;

  // 3. Cualquier voz en español
  const anyEs = voices.find((v) => isSpanishVoice(v));
  if (anyEs) return anyEs;

  return null;
}

/**
 * Reproductor de respaldo de audio en español nativo para cuando la PC
 * no cuenta con ninguna voz en español instalada en Windows.
 */
export function playSpanishAudioFallback(text: string, onEnd?: () => void): boolean {
  if (typeof window === 'undefined') return false;

  try {
    if (audioFallbackElement) {
      audioFallbackElement.pause();
      audioFallbackElement.currentTime = 0;
    }

    const encodedText = encodeURIComponent(text.slice(0, 180));
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=es-AR&client=tw-ob&q=${encodedText}`;

    const audio = new Audio(ttsUrl);
    audioFallbackElement = audio;

    audio.onended = () => {
      audioFallbackElement = null;
      if (onEnd) onEnd();
    };

    audio.onerror = () => {
      audioFallbackElement = null;
      if (onEnd) onEnd();
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        if (onEnd) onEnd();
      });
    }
    return true;
  } catch {
    return false;
  }
}

export function speakSpanish(text: string, onEnd?: () => void): void {
  if (typeof window === 'undefined') return;

  const cleanText = text
    .replace(/[•*#_`~📘💡⚡🔥✅💰💸📷📦📱🥤🧃🍺🍦🧊🍫]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanText) return;

  // Detener audios previos
  stopSpeaking();

  const spanishVoice = getBestSpanishVoice();

  // Si encontramos una voz nativa en español en el sistema:
  if (spanishVoice && 'speechSynthesis' in window) {
    try {
      const utter = new SpeechSynthesisUtterance(cleanText);
      utter.voice = spanishVoice;
      utter.lang = spanishVoice.lang;
      utter.rate = 0.94;
      utter.pitch = 1.0;

      if (onEnd) {
        utter.onend = onEnd;
        utter.onerror = () => onEnd();
      }

      window.speechSynthesis.speak(utter);
      return;
    } catch (err) {
      console.warn('Fallo en SpeechSynthesisUtterance, intentando audio fallback:', err);
    }
  }

  // Si Windows NO tiene ninguna voz en español instalada (solo tiene Microsoft David/Zira en inglés):
  // Usamos el reproductor de audio nativo en español para que NUNCA hable en inglés.
  const fallbackWorked = playSpanishAudioFallback(cleanText, onEnd);
  if (!fallbackWorked && 'speechSynthesis' in window) {
    // Último recurso forzado
    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.lang = 'es-AR';
    utter.rate = 0.9;
    if (onEnd) utter.onend = onEnd;
    window.speechSynthesis.speak(utter);
  }
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined') {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (audioFallbackElement) {
      audioFallbackElement.pause();
      audioFallbackElement.currentTime = 0;
      audioFallbackElement = null;
    }
  }
}
