import { useCallback, useEffect, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  Check,
  Gift,
  Mic,
  MicOff,
  PackagePlus,
  ScanBarcode,
  Send,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';
import type {
  AppSettings,
  LedgerEntry,
  MovementType,
  ParsedAssistantAction,
  PaymentMethod,
  Product,
  SheetTemplate,
} from '../types';
import { speakSpanish, subscribeVoiceDiagnostic, type VoiceDiagnostic } from '../utils/speechService';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { interpretMerchantCommand } from '../services/aiProviderService';
import { formatCurrency, formatShortTime, MOVEMENT_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '../utils/format';

interface AssistantTabProps {
  settings: AppSettings;
  template: SheetTemplate;
  products: Product[];
  ledger: LedgerEntry[];
  lastScannedProduct: Product | null;
  lastUnknownBarcode: string | null;
  queuedCommand: string | null;
  onConsumeQueuedCommand: () => void;
  onClearScanBanner: () => void;
  onOpenScanner: () => void;
  onOpenManual: () => void;
  onOpenQuickMovement: (presetType: MovementType, product?: Product) => void;
  onOpenQuickProduct: (barcode?: string) => void;
  onConfirmMovement: (data: {
    direction: LedgerEntry['direction'];
    type: MovementType;
    reason: string;
    description: string;
    amount: number;
    paymentMethod: PaymentMethod;
    productId?: string;
    productName?: string;
    quantity?: number;
    counterparty?: string;
    notes?: string;
  }) => Promise<void>;
  onConfirmProduct: (data: {
    name: string;
    category: string;
    price: number;
    cost?: number;
    stock: number;
    barcode?: string;
    unit?: string;
    description?: string;
  }) => Promise<void>;
}

const EXAMPLE_COMMANDS = [
  'Vendí 2 mates a 12 mil efectivo',
  'Gasto 4500 bolsas proveedor Juan transferencia',
  'Regalé 1 llavero por cortesía',
  '¿Cuánto vendí hoy?',
  '¿Cómo conecto la pistola USB?',
  '¿Cómo edito las columnas de mi planilla?',
];

export function AssistantTab({
  settings,
  template,
  products,
  ledger,
  lastScannedProduct,
  lastUnknownBarcode,
  queuedCommand,
  onConsumeQueuedCommand,
  onClearScanBanner,
  onOpenScanner,
  onOpenManual,
  onOpenQuickMovement,
  onOpenQuickProduct,
  onConfirmMovement,
  onConfirmProduct,
}: AssistantTabProps) {
  const [commandText, setCommandText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [pendingAction, setPendingAction] = useState<ParsedAssistantAction | null>(null);
  const [editableAmount, setEditableAmount] = useState<string>('');
  const [editablePayment, setEditablePayment] = useState<PaymentMethod>('efectivo');
  const [voiceDiag, setVoiceDiag] = useState<VoiceDiagnostic>({
    hasSpanish: false,
    bestVoice: null,
    spanishVoices: [],
    allVoices: [],
    isWindowsEnglishOnly: false,
  });
  const [showVoiceHelp, setShowVoiceHelp] = useState(false);

  useEffect(() => {
    return subscribeVoiceDiagnostic((diag) => {
      setVoiceDiag(diag);
    });
  }, []);

  const processCommand = useCallback(
    async (raw: string) => {
      const clean = raw.trim();
      if (!clean) return;
      setProcessing(true);
      try {
        const action = await interpretMerchantCommand(clean, settings, products, ledger, template);
        setPendingAction(action);
        if (action.kind === 'movement') {
          setEditableAmount(String(action.data.amount));
          setEditablePayment(action.data.paymentMethod);
        }
        setCommandText('');
      } finally {
        setProcessing(false);
      }
    },
    [settings, products, ledger, template]
  );

  useEffect(() => {
    if (!queuedCommand) return;
    onConsumeQueuedCommand();
    void processCommand(queuedCommand);
  }, [queuedCommand, onConsumeQueuedCommand, processCommand]);

  const voice = useVoiceRecognition((transcript) => {
    setCommandText(transcript);
    void processCommand(transcript);
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void processCommand(commandText);
  };

  const handleAcceptPending = async () => {
    if (!pendingAction) return;
    if (pendingAction.kind === 'movement') {
      const parsedAmount = Number(editableAmount);
      await onConfirmMovement({
        ...pendingAction.data,
        amount: Number.isFinite(parsedAmount) ? parsedAmount : pendingAction.data.amount,
        paymentMethod: editablePayment,
      });
    } else if (pendingAction.kind === 'product') {
      await onConfirmProduct(pendingAction.data);
    }
    setPendingAction(null);
  };

  const recentEntries = ledger.slice(0, 5);

  return (
    <section aria-label="Asistente de comando por voz y texto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Asistente de Mostrador</h1>
          <p className="page-desc">
            Dictá, escribí o escaneá un código de barras. Todo se registra offline y sincroniza con tus herramientas.
          </p>
        </div>
        <div className="page-actions">
          <span className="tag">
            <Sparkles size={12} />
            IA:{' '}
            {settings.aiProvider === 'local'
              ? 'Motor Local Offline'
              : settings.aiProvider === 'gemini'
              ? 'Google Gemini'
              : settings.aiProvider === 'groq_meta'
              ? 'Meta Llama (Groq)'
              : 'OpenAI'}
          </span>
        </div>
      </div>

      {/* Resultado inmediato de escaneo USB o Cámara */}
      {lastScannedProduct && (
        <div className="confirm-card" style={{ marginBottom: 14 }}>
          <div className="confirm-header">
            <span className="confirm-badge">
              <ScanBarcode size={13} />
              Código reconocido: {lastScannedProduct.barcode}
            </span>
            <button type="button" className="btn btn-sm btn-ghost" onClick={onClearScanBanner}>
              <X size={14} />
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <strong>{lastScannedProduct.name}</strong>
              <div className="panel-subtitle">
                Precio: <span className="mono">{formatCurrency(lastScannedProduct.price, settings.currency)}</span> · Stock actual:{' '}
                <strong className="mono">{lastScannedProduct.stock}</strong> {lastScannedProduct.unit}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onOpenQuickMovement('venta', lastScannedProduct);
                  onClearScanBanner();
                }}
              >
                Registrar Venta
              </button>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  onOpenQuickMovement('cambio', lastScannedProduct);
                  onClearScanBanner();
                }}
              >
                Cambio / Regalo
              </button>
            </div>
          </div>
        </div>
      )}

      {lastUnknownBarcode && (
        <div className="confirm-card" style={{ marginBottom: 14 }}>
          <div className="confirm-header">
            <span className="confirm-badge">
              <ScanBarcode size={13} />
              Código nuevo detectado: {lastUnknownBarcode}
            </span>
            <button type="button" className="btn btn-sm btn-ghost" onClick={onClearScanBanner}>
              <X size={14} />
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13.5 }}>
              Este código todavía no está en tu stock. ¿Querés darlo de alta ahora?
            </span>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                const code = lastUnknownBarcode;
                onClearScanBanner();
                onOpenQuickProduct(code);
              }}
            >
              <PackagePlus size={14} />
              Crear producto con este código
            </button>
          </div>
        </div>
      )}

      <div className="assistant-stage">
        {/* Columna principal: Voz + Texto + Confirmación */}
        <div className="panel command-box">
          <form className="voice-composer" onSubmit={handleFormSubmit}>
            <button
              type="button"
              id="btn-voice-mic"
              className={`voice-trigger ${voice.isListening ? 'listening' : ''}`}
              onClick={voice.isListening ? voice.stopListening : voice.startListening}
              title={voice.isListening ? 'Detener dictado' : 'Hablar comando por voz'}
              aria-label={voice.isListening ? 'Detener dictado por voz' : 'Iniciar dictado por voz'}
            >
              {voice.isListening ? <MicOff size={22} /> : <Mic size={22} />}
            </button>

            <div className="command-input-wrap">
              <input
                id="input-assistant-command"
                className="command-input"
                type="text"
                value={voice.isListening && voice.interimText ? voice.interimText : commandText}
                onChange={(e) => setCommandText(e.target.value)}
                placeholder={
                  voice.isListening
                    ? 'Escuchando... decí qué vendiste, gastaste o cambiaste'
                    : 'Ej: "Vendí 2 remeras a 15 mil por transferencia" o "Gasto 5 mil bolsas"'
                }
              />
              <button
                type="submit"
                id="btn-send-command"
                className="btn btn-primary"
                disabled={processing || !commandText.trim()}
              >
                <Send size={16} />
                {processing ? '...' : 'Enviar'}
              </button>
            </div>
          </form>

          {/* Barra de estado de voz del asistente */}
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '8px 12px', background: 'var(--panel-bg)', borderRadius: 10, border: '1px solid var(--border-color)', fontSize: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Volume2 size={15} style={{ color: voiceDiag.hasSpanish ? '#10b981' : '#f59e0b' }} />
              {voiceDiag.hasSpanish ? (
                <span>
                  Voz activa: <strong>{voiceDiag.bestVoice?.name || 'Español'}</strong> ({voiceDiag.bestVoice?.lang || 'es-AR'})
                </span>
              ) : (
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                  ⚠️ Tu PC solo tiene voces en inglés (Microsoft David)
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {voiceDiag.hasSpanish ? (
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  style={{ padding: '2px 10px', fontSize: 11 }}
                  onClick={() => {
                    speakSpanish('Hola, el asistente comercial de ComercioAI está listo en perfecto español.');
                  }}
                >
                  ▶️ Probar voz
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ padding: '2px 10px', fontSize: 11, borderColor: '#f59e0b', color: '#f59e0b' }}
                  onClick={() => setShowVoiceHelp(!showVoiceHelp)}
                >
                  {showVoiceHelp ? 'Ocultar ayuda' : '¿Cómo activar voz en español en PC?'}
                </button>
              )}
            </div>
          </div>

          {showVoiceHelp && !voiceDiag.hasSpanish && (
            <div style={{ marginTop: 6, padding: '10px 14px', borderRadius: 8, background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', fontSize: 12, lineHeight: 1.5 }}>
              <strong>¿Por qué se escucha en inglés en Windows?</strong>
              <p style={{ margin: '4px 0 6px 0' }}>
                Windows por defecto solo incluye la voz en inglés de <em>Microsoft David</em> a menos que se abra en Edge o se agregue el paquete de idioma regional.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div>👉 <strong>Solución más rápida (1 clic sin instalar nada):</strong> Abrí ComercioAI en <strong>Microsoft Edge</strong> en tu PC. Edge ya incluye las voces naturales en español de Tomás y Salomé sin configurar nada.</div>
                <div>👉 <strong>O en Windows:</strong> Andá a <em>Inicio &gt; Configuración &gt; Hora e idioma &gt; Voz &gt; Agregar voces</em> y elegí <strong>Español (Argentina o México)</strong>.</div>
              </div>
            </div>
          )}

          {voice.error && <div className="notice-bar">{voice.error}</div>}

          {/* Tarjeta de confirmación en 1 toque */}
          {pendingAction && (
            <div className="confirm-card">
              <div className="confirm-header">
                <span className="confirm-badge">
                  <Sparkles size={12} />
                  {pendingAction.source === 'ai' ? 'Interpretado por IA' : 'Interpretado offline'}
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => setPendingAction(null)}
                  aria-label="Descartar"
                >
                  <X size={14} />
                </button>
              </div>

              {pendingAction.kind === 'answer' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ margin: 0, fontSize: 13.5, fontWeight: 500, whiteSpace: 'pre-line', lineHeight: 1.55 }}>
                    {pendingAction.answer}
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {'speechSynthesis' in window && (
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => {
                          speakSpanish(pendingAction.answer);
                        }}
                      >
                        <Volume2 size={14} />
                        Escuchar
                      </button>
                    )}
                    <button type="button" className="btn btn-sm" onClick={onOpenManual}>
                      <BookOpen size={14} />
                      Ver Manual completo
                    </button>
                  </div>
                </div>
              ) : pendingAction.kind === 'movement' ? (
                <>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{pendingAction.summary}</div>
                  <div className="field-grid">
                    <div className="field">
                      <label>Tipo / Motivo</label>
                      <input
                        className="input"
                        readOnly
                        value={`${MOVEMENT_TYPE_LABELS[pendingAction.data.type]} · ${pendingAction.data.reason}`}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="confirm-amount">Monto ({settings.currency})</label>
                      <input
                        id="confirm-amount"
                        type="number"
                        className="input mono"
                        value={editableAmount}
                        onChange={(e) => setEditableAmount(e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="confirm-payment">Medio de pago</label>
                      <select
                        id="confirm-payment"
                        className="select"
                        value={editablePayment}
                        onChange={(e) => setEditablePayment(e.target.value as PaymentMethod)}
                      >
                        {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button type="button" className="btn btn-sm" onClick={() => setPendingAction(null)}>
                      Cancelar
                    </button>
                    <button
                      type="button"
                      id="btn-confirm-action"
                      className="btn btn-primary btn-sm"
                      onClick={() => void handleAcceptPending()}
                    >
                      <Check size={14} />
                      Confirmar y guardar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{pendingAction.summary}</div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button type="button" className="btn btn-sm" onClick={() => setPendingAction(null)}>
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => void handleAcceptPending()}
                    >
                      <Check size={14} />
                      Guardar en Stock
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Accesos rápidos para feria / sin conexión */}
          <div>
            <div className="panel-subtitle" style={{ marginBottom: 8 }}>
              Acciones directas (1 toque, funcionan 100% offline)
            </div>
            <div className="quick-actions-row">
              <button
                type="button"
                id="btn-quick-sale"
                className="quick-action-btn"
                onClick={() => onOpenQuickMovement('venta')}
              >
                <ArrowDownLeft size={16} color="var(--income)" />
                <span>Nueva Venta</span>
              </button>
              <button
                type="button"
                id="btn-quick-expense"
                className="quick-action-btn"
                onClick={() => onOpenQuickMovement('gasto_general')}
              >
                <ArrowUpRight size={16} color="var(--expense)" />
                <span>Gasto / Proveedor</span>
              </button>
              <button
                type="button"
                id="btn-quick-gift"
                className="quick-action-btn"
                onClick={() => onOpenQuickMovement('cambio')}
              >
                <Gift size={16} color="var(--neutral-tone)" />
                <span>Cambio / Regalo</span>
              </button>
              <button
                type="button"
                id="btn-quick-product"
                className="quick-action-btn"
                onClick={() => onOpenQuickProduct()}
              >
                <PackagePlus size={16} color="var(--primary)" />
                <span>Producto + Foto</span>
              </button>
              <button
                type="button"
                id="btn-quick-barcode"
                className="quick-action-btn"
                onClick={onOpenScanner}
              >
                <ScanBarcode size={16} color="var(--ink)" />
                <span>Escanear Código</span>
              </button>
            </div>
          </div>

          {/* Ejemplos rápidos para tocar y probar */}
          <div>
            <div className="panel-subtitle" style={{ marginBottom: 6 }}>
              Probá un comando de ejemplo:
            </div>
            <div className="examples-row">
              {EXAMPLE_COMMANDS.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  className="example-chip"
                  onClick={() => void processCommand(ex)}
                >
                  “{ex}”
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Columna lateral: Última actividad (sin repetir totales del Libro Diario) */}
        <aside className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Actividad reciente</h2>
              <p className="panel-subtitle">Últimos 5 registros locales</p>
            </div>
          </div>

          {recentEntries.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 8px' }}>
              <p>Todavía no hay movimientos hoy. Tocá el micrófono o elegí un botón rápido para empezar.</p>
            </div>
          ) : (
            <div className="ledger-list">
              {recentEntries.map((entry) => (
                <div key={entry.id} className="ledger-row">
                  <div className="ledger-row-main">
                    <div className="ledger-row-title">{entry.description}</div>
                    <div className="ledger-row-meta">
                      <span>{formatShortTime(entry.timestamp)}</span>
                      <span>·</span>
                      <span>{MOVEMENT_TYPE_LABELS[entry.type]}</span>
                      <span>·</span>
                      <span>{PAYMENT_METHOD_LABELS[entry.paymentMethod]}</span>
                    </div>
                  </div>
                  <div className="ledger-row-amount">
                    <span
                      className={`mono ${
                        entry.direction === 'ingreso'
                          ? 'amount-income'
                          : entry.direction === 'egreso'
                          ? 'amount-expense'
                          : 'amount-neutro'
                      }`}
                    >
                      {entry.direction === 'ingreso' ? '+' : entry.direction === 'egreso' ? '-' : ''}
                      {formatCurrency(entry.amount, settings.currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
