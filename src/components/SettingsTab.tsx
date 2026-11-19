import { useRef, useState } from 'react';
import {
  CheckCircle2,
  Cloud,
  Cpu,
  Download,
  ExternalLink,
  Plus,
  RefreshCw,
  ScanBarcode,
  Sparkles,
  Table2,
  Trash2,
  Upload,
} from 'lucide-react';
import type {
  AIProviderId,
  AppSettings,
  FieldValueType,
  SheetTemplate,
  TemplateField,
} from '../types';
import { AI_PROVIDERS, testAiProviderConnection } from '../services/aiProviderService';
import {
  clearGoogleSession,
  connectGoogleAccount,
  isGoogleSessionActive,
  provisionGoogleWorkspace,
} from '../services/googleWorkspaceService';
import { exportFullBackupJson, importFullBackupJson } from '../db/database';
import { downloadTextFile } from '../utils/format';

interface SettingsTabProps {
  settings: AppSettings;
  templates: SheetTemplate[];
  activeTemplate: SheetTemplate;
  pendingSyncCount: number;
  onUpdateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  onSaveTemplate: (template: SheetTemplate) => Promise<void>;
  onSyncNow: () => Promise<void>;
  onToast: (msg: string) => void;
  onDataImported: () => Promise<void>;
}

export function SettingsTab({
  settings,
  templates,
  activeTemplate,
  pendingSyncCount,
  onUpdateSettings,
  onSaveTemplate,
  onSyncNow,
  onToast,
  onDataImported,
}: SettingsTabProps) {
  const [subSection, setSubSection] = useState<'templates' | 'ai' | 'cloud' | 'device'>('templates');
  const [testingAi, setTestingAi] = useState(false);
  const [aiStatusMsg, setAiStatusMsg] = useState<string | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(() => isGoogleSessionActive());

  // Inputs para agregar columnas personalizadas a la planilla
  const [newStockColLabel, setNewStockColLabel] = useState('');
  const [newStockColType, setNewStockColType] = useState<FieldValueType>('text');
  const [newLedgerColLabel, setNewLedgerColLabel] = useState('');
  const [newLedgerColType, setNewLedgerColType] = useState<FieldValueType>('text');
  const [newReason, setNewReason] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [usbTestValue, setUsbTestValue] = useState('');
  const backupInputRef = useRef<HTMLInputElement | null>(null);

  const selectedProviderMeta =
    AI_PROVIDERS.find((p) => p.id === settings.aiProvider) || AI_PROVIDERS[0];

  const handleSelectProvider = async (providerId: AIProviderId) => {
    const meta = AI_PROVIDERS.find((p) => p.id === providerId);
    await onUpdateSettings({
      aiProvider: providerId,
      aiModel: meta?.defaultModel || '',
    });
    setAiStatusMsg(null);
  };

  const handleTestAi = async () => {
    setTestingAi(true);
    setAiStatusMsg(null);
    try {
      const msg = await testAiProviderConnection(settings);
      setAiStatusMsg(`OK: ${msg}`);
    } catch (err) {
      setAiStatusMsg(err instanceof Error ? err.message : 'Error al probar conexión.');
    } finally {
      setTestingAi(false);
    }
  };

  const handleConnectGoogle = async () => {
    setGoogleBusy(true);
    try {
      const { email } = await connectGoogleAccount(settings.googleClientId);
      setGoogleConnected(true);
      await onUpdateSettings({ googleConnectedEmail: email || 'Conectado' });
      const ws = await provisionGoogleWorkspace(settings, activeTemplate);
      await onUpdateSettings({
        googleFolderId: ws.folderId,
        googleProductsFolderId: ws.productsFolderId,
        googleSpreadsheetId: ws.spreadsheetId,
      });
      onToast('Google Drive y Sheets conectados y carpeta aislada lista.');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Error conectando Google.');
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    clearGoogleSession();
    setGoogleConnected(false);
    await onUpdateSettings({ googleConnectedEmail: undefined });
    onToast('Sesión de Google cerrada en este dispositivo.');
  };

  // --- Helpers del editor de planillas por rubro ---
  const updateTemplateFields = async (
    target: 'stockFields' | 'ledgerFields',
    nextFields: TemplateField[]
  ) => {
    await onSaveTemplate({
      ...activeTemplate,
      [target]: nextFields,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddColumn = async (target: 'stockFields' | 'ledgerFields') => {
    const rawLabel = target === 'stockFields' ? newStockColLabel : newLedgerColLabel;
    const type = target === 'stockFields' ? newStockColType : newLedgerColType;
    const label = rawLabel.trim();
    if (!label) return;

    const key =
      label
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '') +
      '_' +
      Date.now().toString().slice(-3);

    const nextField: TemplateField = {
      key,
      label,
      type,
      enabled: true,
      options: type === 'select' ? ['Opción 1', 'Opción 2'] : undefined,
    };

    await updateTemplateFields(target, [...activeTemplate[target], nextField]);
    if (target === 'stockFields') setNewStockColLabel('');
    else setNewLedgerColLabel('');
    onToast(`Columna "${label}" agregada a la planilla.`);
  };

  const handleExportBackup = async () => {
    const json = await exportFullBackupJson();
    downloadTextFile(
      json,
      `ComercioAI_Respaldo_${new Date().toISOString().slice(0, 10)}.json`,
      'application/json'
    );
    onToast('Respaldo local descargado.');
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const stats = await importFullBackupJson(text);
      await onDataImported();
      onToast(`Importado: ${stats.products} productos y ${stats.ledger} movimientos.`);
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Error al importar respaldo.');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <section aria-label="Planillas editables y conexiones de IA y nube">
      <div className="page-header">
        <div>
          <h1 className="page-title">Planillas y Conexiones</h1>
          <p className="page-desc">
            Elegí y personalizá tu planilla según el rubro, e intercambiá libremente tu proveedor de IA y herramientas en la nube.
          </p>
        </div>

        <div className="segmented" role="tablist">
          <button
            type="button"
            className={subSection === 'templates' ? 'active' : ''}
            onClick={() => setSubSection('templates')}
          >
            <Table2 size={13} style={{ marginRight: 5, verticalAlign: '-2px' }} />
            Planillas
          </button>
          <button
            type="button"
            className={subSection === 'ai' ? 'active' : ''}
            onClick={() => setSubSection('ai')}
          >
            <Cpu size={13} style={{ marginRight: 5, verticalAlign: '-2px' }} />
            IA
          </button>
          <button
            type="button"
            className={subSection === 'cloud' ? 'active' : ''}
            onClick={() => setSubSection('cloud')}
          >
            <Cloud size={13} style={{ marginRight: 5, verticalAlign: '-2px' }} />
            Google / Redes
          </button>
          <button
            type="button"
            className={subSection === 'device' ? 'active' : ''}
            onClick={() => setSubSection('device')}
          >
            <ScanBarcode size={13} style={{ marginRight: 5, verticalAlign: '-2px' }} />
            Escáner y Respaldo
          </button>
        </div>
      </div>

      {/* 1. PLANILLAS CONFIGURABLES POR RUBRO */}
      {subSection === 'templates' && (
        <>
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Identidad y Rubro del Comercio</h2>
                <p className="panel-subtitle">
                  Podés cambiar el nombre y la plantilla en cualquier momento. Cada rubro trae su estructura editable.
                </p>
              </div>
            </div>

            <div className="field-grid" style={{ marginBottom: 16 }}>
              <div className="field">
                <label htmlFor="biz-name">Nombre de tu comercio / puesto</label>
                <input
                  id="biz-name"
                  className="input"
                  value={settings.businessName}
                  onChange={(e) => void onUpdateSettings({ businessName: e.target.value })}
                  placeholder="Ej: Mi Puesto / Kiosco Central"
                />
              </div>
              <div className="field">
                <label htmlFor="biz-currency">Moneda</label>
                <select
                  id="biz-currency"
                  className="select"
                  value={settings.currency}
                  onChange={(e) => void onUpdateSettings({ currency: e.target.value })}
                >
                  <option value="ARS">ARS ($ Peso Argentino)</option>
                  <option value="USD">USD (US$ Dólar)</option>
                  <option value="UYU">UYU ($U Peso Uruguayo)</option>
                  <option value="CLP">CLP ($ Peso Chileno)</option>
                  <option value="MXN">MXN ($ Peso Mexicano)</option>
                </select>
              </div>
            </div>

            <div className="template-grid">
              {templates.map((tpl) => {
                const isActive = tpl.id === activeTemplate.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    className={`template-card ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      void onUpdateSettings({ activeTemplateId: tpl.id });
                      onToast(`Planilla activa: ${tpl.name}`);
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                      <strong style={{ fontSize: 14 }}>{tpl.name}</strong>
                      {isActive && <CheckCircle2 size={16} color="var(--primary)" />}
                    </div>
                    <span className="panel-subtitle" style={{ fontSize: 12.5 }}>
                      {tpl.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editor vivo de columnas de la plantilla activa */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Editar Planilla: {activeTemplate.name}</h2>
                <p className="panel-subtitle">
                  Activá, renombrá o agregá columnas. Se reflejan en los formularios, en el CSV y en tu Google Sheet.
                </p>
              </div>
            </div>

            <div className="field-grid" style={{ marginBottom: 16 }}>
              <div className="field">
                <label>Pestaña de Libro Diario</label>
                <input
                  className="input mono"
                  value={activeTemplate.ledgerSheetName}
                  onChange={(e) =>
                    void onSaveTemplate({ ...activeTemplate, ledgerSheetName: e.target.value })
                  }
                />
              </div>
              <div className="field">
                <label>Pestaña de Stock</label>
                <input
                  className="input mono"
                  value={activeTemplate.stockSheetName}
                  onChange={(e) =>
                    void onSaveTemplate({ ...activeTemplate, stockSheetName: e.target.value })
                  }
                />
              </div>
              <div className="field">
                <label>Pestaña de Gastos y Proveedores</label>
                <input
                  className="input mono"
                  value={activeTemplate.expensesSheetName}
                  onChange={(e) =>
                    void onSaveTemplate({ ...activeTemplate, expensesSheetName: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Columnas personalizables de Stock */}
            <h3 className="panel-title" style={{ fontSize: 14, marginBottom: 8 }}>
              Columnas adicionales de Stock ({activeTemplate.stockSheetName})
            </h3>
            <div className="columns-editor-list" style={{ marginBottom: 12 }}>
              {activeTemplate.stockFields.map((field, idx) => (
                <div key={field.key} className="column-row">
                  <input
                    type="checkbox"
                    checked={field.enabled}
                    onChange={(e) => {
                      const next = [...activeTemplate.stockFields];
                      next[idx] = { ...field, enabled: e.target.checked };
                      void updateTemplateFields('stockFields', next);
                    }}
                    aria-label={`Activar ${field.label}`}
                  />
                  <input
                    className="input"
                    value={field.label}
                    onChange={(e) => {
                      const next = [...activeTemplate.stockFields];
                      next[idx] = { ...field, label: e.target.value };
                      void updateTemplateFields('stockFields', next);
                    }}
                  />
                  <select
                    className="select"
                    value={field.type}
                    onChange={(e) => {
                      const next = [...activeTemplate.stockFields];
                      next[idx] = { ...field, type: e.target.value as FieldValueType };
                      void updateTemplateFields('stockFields', next);
                    }}
                  >
                    <option value="text">Texto</option>
                    <option value="number">Número</option>
                    <option value="date">Fecha</option>
                    <option value="select">Lista</option>
                  </select>
                  <button
                    type="button"
                    className="btn btn-icon btn-ghost"
                    aria-label="Eliminar columna"
                    onClick={() =>
                      void updateTemplateFields(
                        'stockFields',
                        activeTemplate.stockFields.filter((f) => f.key !== field.key)
                      )
                    }
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              <input
                className="input"
                style={{ flex: 1, minWidth: 180 }}
                value={newStockColLabel}
                onChange={(e) => setNewStockColLabel(e.target.value)}
                placeholder="Nueva columna para Stock (ej: Lote, Origen, Color)..."
              />
              <select
                className="select"
                style={{ width: 130 }}
                value={newStockColType}
                onChange={(e) => setNewStockColType(e.target.value as FieldValueType)}
              >
                <option value="text">Texto</option>
                <option value="number">Número</option>
                <option value="date">Fecha</option>
                <option value="select">Lista</option>
              </select>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => void handleAddColumn('stockFields')}
              >
                <Plus size={14} />
                Agregar columna
              </button>
            </div>

            {/* Columnas personalizables de Libro Diario */}
            <h3 className="panel-title" style={{ fontSize: 14, marginBottom: 8 }}>
              Columnas adicionales de Libro Diario ({activeTemplate.ledgerSheetName})
            </h3>
            <div className="columns-editor-list" style={{ marginBottom: 12 }}>
              {activeTemplate.ledgerFields.map((field, idx) => (
                <div key={field.key} className="column-row">
                  <input
                    type="checkbox"
                    checked={field.enabled}
                    onChange={(e) => {
                      const next = [...activeTemplate.ledgerFields];
                      next[idx] = { ...field, enabled: e.target.checked };
                      void updateTemplateFields('ledgerFields', next);
                    }}
                    aria-label={`Activar ${field.label}`}
                  />
                  <input
                    className="input"
                    value={field.label}
                    onChange={(e) => {
                      const next = [...activeTemplate.ledgerFields];
                      next[idx] = { ...field, label: e.target.value };
                      void updateTemplateFields('ledgerFields', next);
                    }}
                  />
                  <select
                    className="select"
                    value={field.type}
                    onChange={(e) => {
                      const next = [...activeTemplate.ledgerFields];
                      next[idx] = { ...field, type: e.target.value as FieldValueType };
                      void updateTemplateFields('ledgerFields', next);
                    }}
                  >
                    <option value="text">Texto</option>
                    <option value="number">Número</option>
                    <option value="date">Fecha</option>
                    <option value="select">Lista</option>
                  </select>
                  <button
                    type="button"
                    className="btn btn-icon btn-ghost"
                    aria-label="Eliminar columna"
                    onClick={() =>
                      void updateTemplateFields(
                        'ledgerFields',
                        activeTemplate.ledgerFields.filter((f) => f.key !== field.key)
                      )
                    }
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              <input
                className="input"
                style={{ flex: 1, minWidth: 180 }}
                value={newLedgerColLabel}
                onChange={(e) => setNewLedgerColLabel(e.target.value)}
                placeholder="Nueva columna para Libro Diario (ej: Vendedor, Feria)..."
              />
              <select
                className="select"
                style={{ width: 130 }}
                value={newLedgerColType}
                onChange={(e) => setNewLedgerColType(e.target.value as FieldValueType)}
              >
                <option value="text">Texto</option>
                <option value="number">Número</option>
                <option value="date">Fecha</option>
                <option value="select">Lista</option>
              </select>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => void handleAddColumn('ledgerFields')}
              >
                <Plus size={14} />
                Agregar columna
              </button>
            </div>

            {/* Categorías y Motivos editables */}
            <div className="field-grid" style={{ marginBottom: 18 }}>
              <div className="field">
                <label>Categorías de Stock</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                  {activeTemplate.categories.map((cat) => (
                    <span key={cat} className="tag">
                      {cat}
                      <button
                        type="button"
                        style={{ border: 'none', background: 'transparent', padding: 0, marginLeft: 3 }}
                        onClick={() =>
                          void onSaveTemplate({
                            ...activeTemplate,
                            categories: activeTemplate.categories.filter((c) => c !== cat),
                          })
                        }
                        aria-label={`Quitar ${cat}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    className="input"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Agregar categoría..."
                  />
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => {
                      const val = newCategory.trim();
                      if (!val) return;
                      void onSaveTemplate({
                        ...activeTemplate,
                        categories: Array.from(new Set([...activeTemplate.categories, val])),
                      });
                      setNewCategory('');
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="field">
                <label>Motivos frecuentes del Libro Diario</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                  {activeTemplate.movementReasons.map((reason) => (
                    <span key={reason} className="tag">
                      {reason}
                      <button
                        type="button"
                        style={{ border: 'none', background: 'transparent', padding: 0, marginLeft: 3 }}
                        onClick={() =>
                          void onSaveTemplate({
                            ...activeTemplate,
                            movementReasons: activeTemplate.movementReasons.filter((r) => r !== reason),
                          })
                        }
                        aria-label={`Quitar ${reason}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    className="input"
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    placeholder="Agregar motivo..."
                  />
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => {
                      const val = newReason.trim();
                      if (!val) return;
                      void onSaveTemplate({
                        ...activeTemplate,
                        movementReasons: Array.from(new Set([...activeTemplate.movementReasons, val])),
                      });
                      setNewReason('');
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Vista previa de columnas que se crearán en Google Sheets */}
            <h3 className="panel-title" style={{ fontSize: 13.5, marginBottom: 8 }}>
              Vista previa de columnas en Google Sheets ({activeTemplate.ledgerSheetName})
            </h3>
            <div className="sheet-preview-table-wrap">
              <table className="sheet-preview-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Motivo</th>
                    <th>Descripción</th>
                    <th>Monto</th>
                    <th>Pago</th>
                    <th>Proveedor</th>
                    <th>Ubicación / Clima</th>
                    {activeTemplate.ledgerFields
                      .filter((f) => f.enabled)
                      .map((f) => (
                        <th key={f.key}>{f.label}</th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Hoy</td>
                    <td>Venta</td>
                    <td>{activeTemplate.movementReasons[0] || 'Venta'}</td>
                    <td>Ejemplo de fila sincronizada</td>
                    <td className="mono">$12.000</td>
                    <td>Efectivo</td>
                    <td>—</td>
                    <td>Ubicación opcional</td>
                    {activeTemplate.ledgerFields
                      .filter((f) => f.enabled)
                      .map((f) => (
                        <td key={f.key}>{f.placeholder || 'Valor'}</td>
                      ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 2. PROVEEDOR DE IA INTERCAMBIABLE */}
      {subSection === 'ai' && (
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <h2 className="panel-title">Motor de Inteligencia Artificial Intercambiable</h2>
            <p className="panel-subtitle">
              La app habla directo con la IA que elijas (sin servidores intermedios ni n8n). Tu clave se guarda solo en tu dispositivo.
            </p>
          </div>

          <div className="template-grid">
            {AI_PROVIDERS.map((provider) => {
              const active = settings.aiProvider === provider.id;
              return (
                <button
                  key={provider.id}
                  type="button"
                  className={`template-card ${active ? 'active' : ''}`}
                  onClick={() => void handleSelectProvider(provider.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{provider.name}</strong>
                    {active && <CheckCircle2 size={16} color="var(--primary)" />}
                  </div>
                  <span className="tag" style={{ width: 'fit-content' }}>
                    {provider.family}
                  </span>
                  <span className="panel-subtitle" style={{ fontSize: 12.5 }}>
                    {provider.description}
                  </span>
                </button>
              );
            })}
          </div>

          {settings.aiProvider !== 'local' && (
            <div className="field-grid">
              <div className="field">
                <label htmlFor="ai-api-key">API Key ({selectedProviderMeta.name})</label>
                <input
                  id="ai-api-key"
                  type="password"
                  className="input mono"
                  value={settings.aiApiKey}
                  onChange={(e) => void onUpdateSettings({ aiApiKey: e.target.value })}
                  placeholder="Pegá tu clave aquí..."
                  autoComplete="off"
                />
                <span className="panel-subtitle">{selectedProviderMeta.keyHint}</span>
              </div>

              <div className="field">
                <label htmlFor="ai-model">Modelo</label>
                <select
                  id="ai-model"
                  className="select mono"
                  value={settings.aiModel || selectedProviderMeta.defaultModel}
                  onChange={(e) => void onUpdateSettings({ aiModel: e.target.value })}
                >
                  {selectedProviderMeta.models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={testingAi}
              onClick={() => void handleTestAi()}
            >
              <Sparkles size={14} />
              {testingAi ? 'Probando...' : 'Probar conexión de IA'}
            </button>
            {aiStatusMsg && <span className="panel-subtitle">{aiStatusMsg}</span>}
          </div>
        </div>
      )}

      {/* 3. HERRAMIENTAS CLOUD (GOOGLE WORKSPACE + META) */}
      {subSection === 'cloud' && (
        <>
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="panel-header" style={{ marginBottom: 0 }}>
              <div>
                <h2 className="panel-title">Ecosistema Google (Drive + Sheets + Docs + Gmail)</h2>
                <p className="panel-subtitle">
                  Conexión directa desde tu cuenta sin backend propio. Crea una carpeta y planilla 100% aisladas en tu Drive.
                </p>
              </div>
              <span className={`tag ${googleConnected ? 'tag-income' : ''}`}>
                {googleConnected ? `Conectado (${settings.googleConnectedEmail || 'Google'})` : 'Sin conectar'}
              </span>
            </div>

            <div className="field">
              <label htmlFor="google-client-id">Google OAuth Client ID (Web App)</label>
              <input
                id="google-client-id"
                className="input mono"
                value={settings.googleClientId}
                onChange={(e) => void onUpdateSettings({ googleClientId: e.target.value })}
                placeholder="1234567890-xxxx.apps.googleusercontent.com"
              />
              <span className="panel-subtitle">
                Obtenelo gratis en Google Cloud Console → Credenciales → ID de cliente OAuth (Aplicación web) con Drive, Sheets y Docs habilitados.
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {!googleConnected ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={googleBusy || !settings.googleClientId.trim()}
                  onClick={() => void handleConnectGoogle()}
                >
                  {googleBusy ? 'Conectando...' : 'Conectar cuenta de Google'}
                </button>
              ) : (
                <>
                  <button type="button" className="btn btn-primary" onClick={() => void onSyncNow()}>
                    <RefreshCw size={15} />
                    Sincronizar ahora ({pendingSyncCount} pendientes)
                  </button>
                  {settings.googleSpreadsheetId && (
                    <a
                      className="btn"
                      href={`https://docs.google.com/spreadsheets/d/${settings.googleSpreadsheetId}/edit`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink size={14} />
                      Abrir mi Google Sheet
                    </a>
                  )}
                  <button type="button" className="btn" onClick={() => void handleDisconnectGoogle()}>
                    Desconectar
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="panel">
            <h2 className="panel-title">Ecosistema Meta (Instagram, WhatsApp y Facebook)</h2>
            <p className="panel-subtitle" style={{ marginTop: 4 }}>
              La publicación sin servidores funciona de forma inmediata desde la pestaña <strong>Redes</strong> usando compartir nativo (foto + texto + hashtags listos en 1 toque para Instagram, WhatsApp y Facebook, con cualquier cuenta personal o comercial).
            </p>
          </div>
        </>
      )}

      {/* 4. ESCÁNER USB Y RESPALDO LOCAL */}
      {subSection === 'device' && (
        <>
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <h2 className="panel-title">Pistola Escáner USB / USB-C OTG</h2>
              <p className="panel-subtitle">
                Probado con adaptadores USB a USB-C en celulares Android (ej. Samsung A54) y PC. Escaneá en cualquier pestaña para buscar o cargar el producto al instante.
              </p>
            </div>

            <label className="notice-bar" style={{ cursor: 'pointer' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={settings.usbScannerEnabled}
                  onChange={(e) => void onUpdateSettings({ usbScannerEnabled: e.target.checked })}
                />
                <span>Escucha global de pistola USB / OTG activa en toda la app</span>
              </span>
            </label>

            <div className="field">
              <label htmlFor="usb-test-input">Zona de prueba de pistola USB (tocá aquí y dispará un producto)</label>
              <input
                id="usb-test-input"
                data-barcode-input="true"
                className="input mono"
                value={usbTestValue}
                onChange={(e) => setUsbTestValue(e.target.value)}
                placeholder="Dispará tu escáner aquí para verificar lectura..."
              />
            </div>
          </div>

          <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <h2 className="panel-title">Respaldo Local 100% Tuyo</h2>
              <p className="panel-subtitle">
                Exportá o restaurá todo tu stock, libro diario y plantillas personalizadas en un solo archivo JSON sin depender de la nube.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-primary" onClick={() => void handleExportBackup()}>
                <Download size={15} />
                Descargar respaldo JSON
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => backupInputRef.current?.click()}
              >
                <Upload size={15} />
                Restaurar desde JSON
              </button>
              <input
                ref={backupInputRef}
                type="file"
                accept="application/json"
                style={{ display: 'none' }}
                onChange={(e) => void handleImportBackup(e)}
              />
            </div>
          </div>
        </>
      )}
    </section>
  );
}
