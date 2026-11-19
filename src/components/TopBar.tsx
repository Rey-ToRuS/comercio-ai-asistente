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
  Shield,
  Tag,
  FileSpreadsheet,
  ChevronDown,
  Sparkles,
  Eye,
} from 'lucide-react';
import type { AppSettings, SheetTemplate, UserRole, WeatherContext } from '../types';

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
  onSwitchRole: (role: UserRole) => void;
  onOpenOnboarding: () => void;
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
  onSwitchRole,
  onOpenOnboarding,
}: TopBarProps) {
  const [now, setNow] = useState(() => new Date());
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [seniorMode, setSeniorMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('comercio_senior_mode') === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (seniorMode) {
        document.body.classList.add('senior-mode');
      } else {
        document.body.classList.remove('senior-mode');
      }
    }
  }, [seniorMode]);

  const toggleSeniorMode = () => {
    const next = !seniorMode;
    setSeniorMode(next);
    localStorage.setItem('comercio_senior_mode', String(next));
  };

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

  const activeRole = settings.activeRole || 'admin';

  const roleLabels: Record<UserRole, { label: string; icon: typeof Shield; colorClass: string }> = {
    admin: { label: 'Admin', icon: Shield, colorClass: 'text-emerald-400' },
    vendedor: { label: 'Vendedor', icon: Tag, colorClass: 'text-sky-400' },
    administrativo: { label: 'Adminstrativo', icon: FileSpreadsheet, colorClass: 'text-amber-400' },
  };

  const CurrentRoleIcon = roleLabels[activeRole].icon;

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

          {/* Selector de Rol de Trabajo Activo */}
          <div className="relative ml-2">
            <button
              type="button"
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 hover:border-slate-600 transition-colors"
              title="Cambiar de Rol de Trabajo"
            >
              <CurrentRoleIcon size={12} className={roleLabels[activeRole].colorClass} />
              <span>{roleLabels[activeRole].label}</span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>

            {roleMenuOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-44 rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-2xl z-50 animate-fade-in text-xs space-y-0.5">
                <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-500">
                  Cambiar Rol:
                </div>
                {(['admin', 'vendedor', 'administrativo'] as UserRole[]).map((r) => {
                  const Icon = roleLabels[r].icon;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        onSwitchRole(r);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                        activeRole === r
                          ? 'bg-slate-800 text-white font-bold'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon size={13} className={roleLabels[r].colorClass} />
                      <span>{roleLabels[r].label}</span>
                    </button>
                  );
                })}
              </div>
            )}
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

          {/* Asistente de configuración inicial / negocio */}
          <button
            type="button"
            className="ambient-chip ambient-chip-btn"
            onClick={onOpenOnboarding}
            title="Configurar Comercio, IA y Roles"
          >
            <Sparkles size={14} className="text-emerald-400" />
            <span>Configurar</span>
          </button>

          {/* Botón de Modo Senior / Letra Grande */}
          <button
            type="button"
            className={`ambient-chip ambient-chip-btn ${seniorMode ? 'usb-active' : ''}`}
            onClick={toggleSeniorMode}
            title={seniorMode ? 'Desactivar Modo Senior (volver a letra estándar)' : 'Activar Modo Senior (letra grande y alta legibilidad)'}
          >
            <Eye size={14} />
            <span>{seniorMode ? 'Letra Normal' : 'Modo Fácil'}</span>
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
