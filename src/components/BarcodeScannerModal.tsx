import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { Camera, Keyboard, ScanBarcode, SwitchCamera, X } from 'lucide-react';
import { playScanBeep } from '../utils/image';

interface BarcodeScannerModalProps {
  open: boolean;
  usbEnabled: boolean;
  onClose: () => void;
  onDetected: (barcode: string, source: 'camera' | 'usb' | 'manual') => void;
}

export function BarcodeScannerModal({
  open,
  usbEnabled,
  onClose,
  onDetected,
}: BarcodeScannerModalProps) {
  const [mode, setMode] = useState<'camera' | 'usb'>('camera');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceIndex, setDeviceIndex] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const usbInputRef = useRef<HTMLInputElement | null>(null);
  const detectedRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    detectedRef.current = false;
    setCameraError(null);
    setManualCode('');
  }, [open]);

  useEffect(() => {
    if (!open || mode !== 'usb') return;
    const timer = setTimeout(() => usbInputRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, [open, mode]);

  useEffect(() => {
    if (!open || mode !== 'camera') return;

    let cancelled = false;
    const reader = new BrowserMultiFormatReader();

    async function startCamera() {
      try {
        setCameraError(null);
        const videoDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (cancelled) return;
        setDevices(videoDevices);

        if (videoDevices.length === 0) {
          setCameraError('No se detectó cámara en este dispositivo. Usá la pestaña Pistola USB / Manual.');
          return;
        }

        // Preferir cámara trasera en celulares
        const backIndex = videoDevices.findIndex((d) =>
          /(back|rear|trasera|environment)/i.test(d.label)
        );
        const chosenIndex =
          deviceIndex < videoDevices.length
            ? deviceIndex === 0 && backIndex >= 0
              ? backIndex
              : deviceIndex
            : 0;
        const selectedId = videoDevices[chosenIndex]?.deviceId;

        if (!videoRef.current) return;

        const controls = await reader.decodeFromVideoDevice(
          selectedId,
          videoRef.current,
          (result) => {
            if (result && !detectedRef.current) {
              const code = result.getText().trim();
              if (code) {
                detectedRef.current = true;
                playScanBeep(true);
                controlsRef.current?.stop();
                onDetected(code, 'camera');
              }
            }
          }
        );

        if (cancelled) {
          controls.stop();
        } else {
          controlsRef.current = controls;
        }
      } catch (err) {
        if (!cancelled) {
          setCameraError(
            err instanceof Error
              ? `No se pudo abrir la cámara (${err.message}). Probá con pistola USB o ingreso manual.`
              : 'No se pudo acceder a la cámara. Verificá los permisos.'
          );
        }
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [open, mode, deviceIndex, onDetected]);

  if (!open) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = manualCode.trim();
    if (!cleaned) return;
    playScanBeep(true);
    onDetected(cleaned, 'usb');
    setManualCode('');
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Escáner de código de barras">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Lector de Código de Barras</h2>
            <p className="panel-subtitle">
              Compatible con cámara del celular y pistola escáner USB / USB-C OTG.
            </p>
          </div>
          <button type="button" className="btn btn-icon btn-ghost" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <div className="segmented">
            <button
              type="button"
              className={mode === 'camera' ? 'active' : ''}
              onClick={() => setMode('camera')}
            >
              <Camera size={13} style={{ marginRight: 5, verticalAlign: '-2px' }} />
              Cámara celular
            </button>
            <button
              type="button"
              className={mode === 'usb' ? 'active' : ''}
              onClick={() => setMode('usb')}
            >
              <Keyboard size={13} style={{ marginRight: 5, verticalAlign: '-2px' }} />
              Pistola USB / Manual
            </button>
          </div>

          {mode === 'camera' && devices.length > 1 && (
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setDeviceIndex((idx) => (idx + 1) % devices.length)}
            >
              <SwitchCamera size={14} />
              Cambiar cámara
            </button>
          )}
        </div>

        {mode === 'camera' ? (
          <div>
            {cameraError ? (
              <div className="notice-bar" style={{ marginBottom: 12 }}>
                <span>{cameraError}</span>
                <button type="button" className="btn btn-sm" onClick={() => setMode('usb')}>
                  Usar Pistola USB
                </button>
              </div>
            ) : (
              <div className="camera-viewport">
                <video ref={videoRef} muted playsInline />
                <div className="camera-reticle" />
              </div>
            )}
            <p className="panel-subtitle" style={{ marginTop: 10 }}>
              Apuntá al código EAN-13, EAN-8, UPC, Code128 o QR. También podés disparar tu pistola USB conectada por OTG en cualquier momento.
            </p>
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="notice-bar">
              <span>
                <ScanBarcode size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />
                {usbEnabled
                  ? 'Listener global de pistola USB/OTG activo: dispará el lector directamente.'
                  : 'Activá el listener global USB en Conexiones para escanear sin abrir esta ventana.'}
              </span>
            </div>

            <div className="field">
              <label htmlFor="usb-barcode-input">Código de barras (pistola USB o escritura manual)</label>
              <input
                ref={usbInputRef}
                id="usb-barcode-input"
                data-barcode-input="true"
                className="input mono"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ej: 7790895000123"
                autoComplete="off"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="btn" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={!manualCode.trim()}>
                Buscar / Usar código
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
