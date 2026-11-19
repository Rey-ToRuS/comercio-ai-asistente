import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechRecognitionEventLike {
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
}

export function useVoiceRecognition(onFinalTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const callbackRef = useRef(onFinalTranscript);
  useEffect(() => {
    callbackRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  const SpeechRecognitionCtor =
    typeof window !== 'undefined'
      ? ((window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike })
          .SpeechRecognition ||
          (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition)
      : undefined;

  const supported = Boolean(SpeechRecognitionCtor);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        // noop
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognitionCtor) {
      setError('Tu navegador no soporta dictado por voz. Podés escribir el comando.');
      return;
    }
    setError(null);
    setInterimText('');

    try {
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = 'es-AR';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => {
        setIsListening(false);
        setInterimText('');
      };
      recognition.onerror = (ev) => {
        setIsListening(false);
        if (ev.error === 'not-allowed') {
          setError('Permiso de micrófono denegado. Habilitalo en el navegador.');
        } else if (ev.error === 'no-speech') {
          setError('No se escuchó voz. Tocá el micrófono y hablá cerca del teléfono.');
        } else {
          setError(`Dictado interrumpido (${ev.error}).`);
        }
      };
      recognition.onresult = (ev) => {
        let interim = '';
        let finalText = '';
        for (let i = 0; i < ev.results.length; i++) {
          const item = ev.results[i];
          if (item.isFinal) {
            finalText += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }
        setInterimText(interim);
        if (finalText.trim()) {
          callbackRef.current(finalText.trim());
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setError('No se pudo iniciar el micrófono.');
      setIsListening(false);
    }
  }, [SpeechRecognitionCtor]);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // noop
    }
    setIsListening(false);
  }, []);

  return {
    supported,
    isListening,
    interimText,
    error,
    startListening,
    stopListening,
  };
}
