import { useEffect, useState } from 'react';
import {
  CloudSun,
  HelpCircle,
  MapPin,
  RefreshCw,
  ScanBarcode,
  Store,
  Wifi,
  WifiOff,
  Clock,
} from 'lucide-react';
import type { AppSettings, SheetTemplate, WeatherContext } from '../types';

interface TopBarProps {
  settings: AppSettings;
  template: SheetTemplate;
  weather: WeatherContext;
  weatherLoading: boolean;
  isOnline: boolean;
  pendingSyncCount: number;
  syncing: boolean;
  onToggleWeather: () => void;
  onSyncNow: () => void;
  onOpenScanner: () => void;
  onOpenManual: () => void;
}

export function TopBar({
  settings,
  template,
  weather,
  weatherLoading,
  isOnline,
  pendingSyncCount,
  syncing,
  onToggleWeather,
  onSyncNow,
  onOpenScanner,
  onOpenManual,
}: TopBarProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const dateStr = now.toLocaleDateString('es-AR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });

  const placeLabel = [weather.neighborhood, weather.city].filter(Boolean).join(', ');

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand-cluster">
          <div className="brand-mark" aria-hidden="true">
            <Store size={18} />
          </div>
          <div className="brand-titles">
            <span className="brand-name">{settings.businessName || 'Mi Comercio'}</span>
            <span className="brand-subtitle">{template.name}</span>
          </div>
        </div>

        <div className="ambient-strip">
          {/* Hora y fecha exacta */}
          <span className="ambient-chip mono" title="Hora local exacta">
            <Clock size={13} />
            <span>{dateStr}</span>
            <strong>{timeStr}</strong>
          </span>

          {/* Ubicación y clima opcional */}
          <button
            type="button"
            id="btn-weather-location"
            className="ambient-chip ambient-chip-btn"
            onClick={onToggleWeather}
            title={
              weather.enabled
                ? 'Actualizar clima y ubicación actual'
                : 'Activar ubicación para ver el clima y usarlo en redes'
            }
          >
            {weather.enabled ? <CloudSun size={14} /> : <MapPin size={14} />}
            {weatherLoading ? (
              <span>Ubicando...</span>
            ) : weather.enabled && weather.tempC !== undefined ? (
              <span>
                <strong>{weather.tempC}°C</strong> {weather.condition}
                {placeLabel ? ` · ${placeLabel}` : ''}
              </span>
            ) : (
              <span>Activar clima/ubicación</span>
            )}
          </button>

          {/* Acceso rápido a cámara / pistola USB */}
          <button
            type="button"
            id="btn-topbar-scanner"
            className={`ambient-chip ambient-chip-btn ${settings.usbScannerEnabled ? 'usb-active' : ''}`}
            onClick={onOpenScanner}
            title="Escanear código de barras (cámara o pistola USB/OTG)"
          >
            <ScanBarcode size={14} />
            <span>{settings.usbScannerEnabled ? 'Escáner listo' : 'Escanear'}</span>
          </button>

          {/* Estado Online/Offline y Cola de Sync */}
          <button
            type="button"
            id="btn-sync-status"
            className={`ambient-chip ambient-chip-btn ${isOnline ? 'online' : 'offline'}`}
            onClick={onSyncNow}
            disabled={syncing || !isOnline}
            title={
              isOnline
                ? pendingSyncCount > 0
                  ? `${pendingSyncCount} cambio(s) pendientes de sincronizar`
                  : 'Conectado'
                : 'Modo sin conexión — todo se guarda localmente'
            }
          >
            {syncing ? (
              <RefreshCw size={13} />
            ) : isOnline ? (
              <Wifi size={13} />
            ) : (
              <WifiOff size={13} />
            )}
            <span>
              {syncing
                ? 'Sincronizando...'
                : isOnline
                ? pendingSyncCount > 0
                  ? `Sync (${pendingSyncCount})`
                  : 'En línea'
                : pendingSyncCount > 0
                ? `Offline (${pendingSyncCount})`
                : 'Offline'}
            </span>
          </button>

          {/* Manual de uso offline */}
          <button
            type="button"
            id="btn-topbar-manual"
            className="ambient-chip ambient-chip-btn"
            onClick={onOpenManual}
            title="Abrir Manual de Uso y Ayuda (funciona offline)"
          >
            <HelpCircle size={14} />
            <span>Manual</span>
          </button>
        </div>
      </div>
    </header>
  );
}
