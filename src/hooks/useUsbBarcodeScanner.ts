import { useEffect, useRef } from 'react';
import { playScanBeep } from '../utils/image';

interface UseUsbBarcodeScannerOptions {
  enabled: boolean;
  onScan: (barcode: string) => void;
  maxKeystrokeIntervalMs?: number;
  minLength?: number;
}

/**
 * Detecta lectores de código de barras USB / USB-C OTG (pistola HID).
 * Las pistolas emulan un teclado escribiendo dígitos en ráfaga (< 65ms entre teclas)
 * y cierran con Enter o Tab. No interfiere con la escritura manual normal en formularios.
 */
export function useUsbBarcodeScanner({
  enabled,
  onScan,
  maxKeystrokeIntervalMs = 65,
  minLength = 4,
}: UseUsbBarcodeScannerOptions): void {
  const bufferRef = useRef('');
  const lastTimeRef = useRef(0);
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.altKey || event.metaKey) return;

      const target = event.target as HTMLElement | null;
      const isTextField =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      const isDedicatedScanInput = target?.dataset?.barcodeInput === 'true';

      const now = performance.now();
      const delta = now - lastTimeRef.current;

      if (event.key === 'Enter' || event.key === 'Tab') {
        const code = bufferRef.current.trim();
        bufferRef.current = '';
        lastTimeRef.current = 0;

        if (code.length >= minLength && (!isTextField || isDedicatedScanInput)) {
          event.preventDefault();
          playScanBeep(true);
          onScanRef.current(code);
        }
        return;
      }

      if (event.key.length === 1) {
        // Si está escribiendo en un input común lento, no capturar
        if (isTextField && !isDedicatedScanInput) {
          if (delta > maxKeystrokeIntervalMs) {
            bufferRef.current = '';
          }
          return;
        }

        if (delta > maxKeystrokeIntervalMs && bufferRef.current.length > 0) {
          bufferRef.current = '';
        }
        bufferRef.current += event.key;
        lastTimeRef.current = now;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [enabled, maxKeystrokeIntervalMs, minLength]);
}
