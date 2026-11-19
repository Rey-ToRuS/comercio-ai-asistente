import { useState } from 'react';
import {
  Sparkles,
  Check,
  Store,
  Bot,
  UserCheck,
  Shield,
  Tag,
  FileSpreadsheet,
  Cpu,
  Key,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import type { AIProviderId, AppSettings, BusinessTypeId, SheetTemplate, UserRole } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  templates: SheetTemplate[];
  initialSettings: AppSettings;
  onComplete: (updatedSettings: AppSettings) => Promise<void>;
}

export function OnboardingModal({
  isOpen,
  templates,
  initialSettings,
  onComplete,
}: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [businessName, setBusinessName] = useState(initialSettings.businessName || 'Mi Negocio');
  const [ownerEmail, setOwnerEmail] = useState(initialSettings.ownerEmail || '');
  const [aiProvider, setAiProvider] = useState<AIProviderId>(initialSettings.aiProvider || 'local');
  const [aiApiKey, setAiApiKey] = useState(initialSettings.aiApiKey || '');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    initialSettings.activeTemplateId || templates[0]?.id || 'tpl-feria'
  );
  const [activeRole, setActiveRole] = useState<UserRole>(initialSettings.activeRole || 'admin');
  const [adminPin, setAdminPin] = useState(initialSettings.adminPin || '');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      const finalSettings: AppSettings = {
        ...initialSettings,
        businessName: businessName.trim() || 'Mi Negocio',
        ownerEmail: ownerEmail.trim(),
        aiProvider,
        aiApiKey: aiProvider === 'local' ? '' : aiApiKey.trim(),
        activeTemplateId: selectedTemplateId,
        activeRole,
        adminPin: adminPin.trim() || undefined,
        onboardingCompleted: true,
      };
      await onComplete(finalSettings);
    } finally {
      setSubmitting(false);
    }
  };

  const businessTypes: Array<{
    id: BusinessTypeId;
    templateId: string;
    label: string;
    desc: string;
    icon: string;
  }> = [
    {
      id: 'feria',
      templateId: 'tpl-feria',
      label: 'Feria / Artesanías',
      desc: 'Piezas únicas, eventos, cambios, regalos y producción propia.',
      icon: '🎪',
    },
    {
      id: 'kiosco',
      templateId: 'tpl-kiosco',
      label: 'Kiosco / Almacén',
      desc: 'Escáner USB de alta velocidad, fiado, reposición y vencimientos.',
      icon: '🏪',
    },
    {
      id: 'indumentaria',
      templateId: 'tpl-indumentaria',
      label: 'Indumentaria / Showroom',
      desc: 'Talles, colores, temporadas, cambios y pruebas en showroom.',
      icon: '👗',
    },
    {
      id: 'gastronomia',
      templateId: 'tpl-gastronomia',
      label: 'Gastronomía / Puesto',
      desc: 'Comandas rápidas, delivery/mesa, mermas y materia prima.',
      icon: '🍔',
    },
    {
      id: 'servicios',
      templateId: 'tpl-servicios',
      label: 'Servicios / Taller',
      desc: 'Presupuestos, repuestos, mano de obra y garantías.',
      icon: '🔧',
    },
    {
      id: 'general',
      templateId: 'tpl-general',
      label: 'Comercio General',
      desc: 'Multirubro estándar, control de entradas, salidas y gastos.',
      icon: '📦',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Encabezado del Asistente de Inicio */}
        <div className="border-b border-slate-800 p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">
                  Bienvenido a ComercioAI
                </h2>
                <p className="text-sm text-slate-400">
                  Configuración inicial de 1 minuto para tu comercio autónomo
                </p>
              </div>
            </div>
            {/* Indicador de pasos */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <span className="rounded-md bg-slate-800 px-2 py-1 text-emerald-400 border border-slate-700">
                Paso {step} de 4
              </span>
            </div>
          </div>

          {/* Barra de progreso de pasos */}
          <div className="mt-4 grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s <= step ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Contenido según el paso */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* PASO 1: Identificación del Comercio */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-300">
                💡 <strong>Autonomía Total:</strong> Todos los datos quedan guardados en tu
                dispositivo. El email solo se usa localmente para identificar tu cuenta y vincular tus
                reportes o respaldos.
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1.5">
                  Nombre de tu Comercio o Puesto <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ej: Artesanías del Sol / Kiosco San Cayetano"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1.5">
                  Email del Titular o Responsable <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="tu-email@gmail.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-base"
                />
                <p className="mt-1 text-xs text-slate-400">
                  No enviamos publicidad ni dependemos de servidores externos.
                </p>
              </div>
            </div>
          )}

          {/* PASO 2: Selección de IA */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                  <Bot className="h-5 w-5 text-emerald-400" />
                  Elegí la Inteligencia Artificial a vincular
                </h3>
                <p className="text-xs text-slate-400">
                  Podés cambiarla en cualquier momento desde Ajustes. Si no tenés conexión, el
                  Asistente usa el Motor Local automáticamente.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Opción 1: Motor Local */}
                <button
                  type="button"
                  onClick={() => setAiProvider('local')}
                  className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
                    aiProvider === 'local'
                      ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                      : 'border-slate-800 bg-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="flex items-center gap-2 font-bold text-white text-sm">
                      <Cpu className="h-4 w-4 text-emerald-400" /> Motor Local Offline
                    </span>
                    {aiProvider === 'local' && (
                      <Check className="h-4 w-4 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300">
                    100% desconectado, cero costo y sin necesidad de claves API.
                  </p>
                  <span className="mt-3 inline-block w-fit rounded bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                    Recomendado para empezar
                  </span>
                </button>

                {/* Opción 2: Google Gemini */}
                <button
                  type="button"
                  onClick={() => setAiProvider('gemini')}
                  className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
                    aiProvider === 'gemini'
                      ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                      : 'border-slate-800 bg-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="flex items-center gap-2 font-bold text-white text-sm">
                      <Sparkles className="h-4 w-4 text-sky-400" /> Google Gemini
                    </span>
                    {aiProvider === 'gemini' && (
                      <Check className="h-4 w-4 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300">
                    Comprende lenguaje complejo, preguntas de balance y crea textos para redes.
                  </p>
                  <span className="mt-3 inline-block w-fit rounded bg-sky-500/20 px-2 py-0.5 text-[11px] font-semibold text-sky-300">
                    Gratis en Google AI Studio
                  </span>
                </button>

                {/* Opción 3: Meta Llama vía Groq */}
                <button
                  type="button"
                  onClick={() => setAiProvider('groq_meta')}
                  className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
                    aiProvider === 'groq_meta'
                      ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                      : 'border-slate-800 bg-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="flex items-center gap-2 font-bold text-white text-sm">
                      ⚡ Meta Llama 3 (Groq)
                    </span>
                    {aiProvider === 'groq_meta' && (
                      <Check className="h-4 w-4 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300">
                    Velocidad instantánea de respuesta para mostrador rápido.
                  </p>
                </button>

                {/* Opción 4: OpenAI */}
                <button
                  type="button"
                  onClick={() => setAiProvider('openai')}
                  className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
                    aiProvider === 'openai'
                      ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                      : 'border-slate-800 bg-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="flex items-center gap-2 font-bold text-white text-sm">
                      🤖 OpenAI (ChatGPT)
                    </span>
                    {aiProvider === 'openai' && (
                      <Check className="h-4 w-4 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300">
                    Modelos GPT-4o / GPT-4o-mini con tu propia API key.
                  </p>
                </button>
              </div>

              {aiProvider !== 'local' && (
                <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-4 space-y-2">
                  <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-emerald-400" />
                    Clave API de {aiProvider === 'gemini' ? 'Gemini' : aiProvider === 'groq_meta' ? 'Groq' : 'OpenAI'}
                  </label>
                  <input
                    type="password"
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                    placeholder="Pegá tu API key aquí (se guarda solo en tu equipo)"
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400">
                    Si aún no tenés clave, podés continuar con el <strong>Motor Local</strong> y configurarla luego.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* PASO 3: Tipo de Negocio y Plantilla */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                  Elegí tu Tipo de Comercio
                </h3>
                <p className="text-xs text-slate-400">
                  Carga automáticamente la plantilla de stock, columnas y motivos de venta adecuados para tu rubro.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {businessTypes.map((bt) => {
                  const isSelected = selectedTemplateId === bt.templateId;
                  return (
                    <button
                      key={bt.id}
                      type="button"
                      onClick={() => setSelectedTemplateId(bt.templateId)}
                      className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                          : 'border-slate-800 bg-slate-800/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-base font-bold text-white flex items-center gap-2">
                          <span className="text-xl">{bt.icon}</span> {bt.label}
                        </span>
                        {isSelected && <Check className="h-4 w-4 text-emerald-400" />}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{bt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASO 4: Rol Inicial */}
          {step === 4 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-emerald-400" />
                  Elegí tu Rol de Trabajo Inicial
                </h3>
                <p className="text-xs text-slate-400">
                  Podés cambiar de rol en cualquier momento desde la barra superior con 1 toque.
                </p>
              </div>

              <div className="space-y-3">
                {/* Admin */}
                <button
                  type="button"
                  onClick={() => setActiveRole('admin')}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                    activeRole === 'admin'
                      ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                      : 'border-slate-800 bg-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Administrador (Dueño/a)</div>
                      <div className="text-xs text-slate-400">
                        Acceso total a balances de caja, costos, edición de plantillas y borrado.
                      </div>
                    </div>
                  </div>
                  {activeRole === 'admin' && <Check className="h-5 w-5 text-emerald-400" />}
                </button>

                {/* Vendedor */}
                <button
                  type="button"
                  onClick={() => setActiveRole('vendedor')}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                    activeRole === 'vendedor'
                      ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                      : 'border-slate-800 bg-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
                      <Tag className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Vendedor (Mostrador)</div>
                      <div className="text-xs text-slate-400">
                        Interfaz limpia para vender, escanear y consultar stock sin ver costos ni balances privados.
                      </div>
                    </div>
                  </div>
                  {activeRole === 'vendedor' && <Check className="h-5 w-5 text-emerald-400" />}
                </button>

                {/* Administrativo */}
                <button
                  type="button"
                  onClick={() => setActiveRole('administrativo')}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                    activeRole === 'administrativo'
                      ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                      : 'border-slate-800 bg-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Administrativo</div>
                      <div className="text-xs text-slate-400">
                        Carga de compras a proveedores, control de gastos, altas de mercadería y reportes.
                      </div>
                    </div>
                  </div>
                  {activeRole === 'administrativo' && (
                    <Check className="h-5 w-5 text-emerald-400" />
                  )}
                </button>
              </div>

              {/* PIN opcional */}
              <div className="pt-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  PIN de seguridad de Administrador (Opcional, 4 dígitos)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ej: 1234 (dejar vacío si no requerís PIN)"
                  className="w-48 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none tracking-widest text-center"
                />
              </div>
            </div>
          )}
        </div>

        {/* Barra inferior de navegación */}
        <div className="border-t border-slate-800 p-4 px-6 flex items-center justify-between bg-slate-900/90 rounded-b-2xl">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3 | 4)}
              className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Volver
            </button>
          ) : (
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <HelpCircle className="h-3.5 w-3.5" /> Podrás modificar todo más tarde
            </div>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !businessName.trim()) return;
                setStep((s) => (s + 1) as 1 | 2 | 3 | 4);
              }}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
            >
              Siguiente <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleFinish}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : 'Comenzar a Trabajar'}
              <Check className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
