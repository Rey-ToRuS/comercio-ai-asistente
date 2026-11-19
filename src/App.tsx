import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Mic, Package, Settings, Share2 } from 'lucide-react';
import {
  db,
  DEFAULT_SETTINGS,
  initializeDatabase,
  queueSyncItem,
} from './db/database';
import { DEFAULT_TEMPLATES } from './data/templates';
import type {
  ActiveTab,
  AppSettings,
  LedgerEntry,
  MovementType,
  Product,
  SheetTemplate,
  SocialDraft,
  WeatherContext,
} from './types';
import {
  fetchCurrentWeatherContext,
  formatWeatherLocationBadge,
  loadCachedWeather,
  saveCachedWeather,
} from './services/weatherService';
import {
  createSummaryGoogleDoc,
  isGoogleSessionActive,
  syncPendingQueueToGoogle,
} from './services/googleWorkspaceService';
import { useUsbBarcodeScanner } from './hooks/useUsbBarcodeScanner';
import { TopBar } from './components/TopBar';
import { AssistantTab } from './components/AssistantTab';
import { LedgerTab } from './components/LedgerTab';
import { StockTab } from './components/StockTab';
import { SocialTab } from './components/SocialTab';
import { SettingsTab } from './components/SettingsTab';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { MovementModal } from './components/MovementModal';
import { ProductModal } from './components/ProductModal';
import { ManualModal } from './components/ManualModal';
import { formatCurrency, formatShortDate, MOVEMENT_TYPE_LABELS } from './utils/format';

export function App() {
  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('assistant');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [templates, setTemplates] = useState<SheetTemplate[]>(DEFAULT_TEMPLATES);
  const [products, setProducts] = useState<Product[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const [weather, setWeather] = useState<WeatherContext>(() => loadCachedWeather());
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  // Modales y estados interactivos
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'global' | 'product_modal'>('global');
  const [lastScannedProduct, setLastScannedProduct] = useState<Product | null>(null);
  const [lastUnknownBarcode, setLastUnknownBarcode] = useState<string | null>(null);

  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [movementPresetType, setMovementPresetType] = useState<MovementType>('venta');
  const [movementPresetProduct, setMovementPresetProduct] = useState<Product | null>(null);
  const [editingEntry, setEditingEntry] = useState<LedgerEntry | null>(null);

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [presetBarcode, setPresetBarcode] = useState<string | undefined>(undefined);

  const [manualOpen, setManualOpen] = useState(false);
  const [queuedCommand, setQueuedCommand] = useState<string | null>(null);

  const [toasts, setToasts] = useState<Array<{ id: string; text: string }>>([]);

  const showToast = useCallback((text: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev.slice(-2), { id, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3400);
  }, []);

  const refreshAllData = useCallback(async () => {
    const [loadedSettings, loadedTemplates, loadedProducts, loadedLedger, queueCount] =
      await Promise.all([
        db.settings.get('main'),
        db.templates.toArray(),
        db.products.orderBy('updatedAt').reverse().toArray(),
        db.ledger.orderBy('timestamp').reverse().toArray(),
        db.syncQueue.count(),
      ]);

    if (loadedSettings) setSettings(loadedSettings);
    if (loadedTemplates.length > 0) setTemplates(loadedTemplates);
    setProducts(loadedProducts);
    setLedger(loadedLedger);
    setPendingSyncCount(queueCount);
  }, []);

  useEffect(() => {
    initializeDatabase().then(async () => {
      await refreshAllData();
      setReady(true);
    });
  }, [refreshAllData]);

  // Listeners online / offline
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Conexión recuperada.');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Sin conexión: modo offline activo.');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  const activeTemplate =
    templates.find((t) => t.id === settings.activeTemplateId) || templates[0] || DEFAULT_TEMPLATES[0];

  const handleUpdateSettings = async (patch: Partial<AppSettings>) => {
    const next: AppSettings = { ...settings, ...patch, id: 'main' };
    setSettings(next);
    await db.settings.put(next);
  };

  const handleSaveTemplate = async (template: SheetTemplate) => {
    await db.templates.put(template);
    setTemplates((prev) => prev.map((t) => (t.id === template.id ? template : t)));
  };

  // Clima + ubicación opcional
  const handleToggleWeather = async () => {
    if (weatherLoading) return;
    setWeatherLoading(true);
    try {
      const nextWeather = await fetchCurrentWeatherContext();
      setWeather(nextWeather);
      await handleUpdateSettings({ locationEnabled: true });
      showToast(`Clima actualizado: ${formatWeatherLocationBadge(nextWeather)}`);
    } catch (err) {
      if (weather.enabled) {
        const disabled = { enabled: false };
        setWeather(disabled);
        saveCachedWeather(disabled);
      }
      showToast(err instanceof Error ? err.message : 'No se pudo obtener ubicación.');
    } finally {
      setWeatherLoading(false);
    }
  };

  // Sincronización con Google
  const handleSyncNow = useCallback(async () => {
    if (!navigator.onLine) {
      showToast('Sin internet: tus cambios siguen seguros en la cola local.');
      return;
    }
    if (!isGoogleSessionActive()) {
      setActiveTab('settings');
      showToast('Conectá tu cuenta de Google en Planillas y Conexiones para sincronizar.');
      return;
    }
    setSyncing(true);
    try {
      const result = await syncPendingQueueToGoogle(settings, activeTemplate);
      await refreshAllData();
      if (result.synced > 0) {
        showToast(`Sincronizado con Google: ${result.synced} registro(s).`);
      } else if (result.failed > 0) {
        showToast(`Fallaron ${result.failed} registro(s). Revisá permisos de Google.`);
      } else {
        showToast('Todo ya estaba al día con Google Drive y Sheets.');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al sincronizar con Google.');
    } finally {
      setSyncing(false);
    }
  }, [settings, activeTemplate, refreshAllData, showToast]);

  // Manejo unificado de código de barras (Pistola USB / OTG o Cámara)
  const handleBarcodeDetected = useCallback(
    (code: string) => {
      const cleaned = code.trim();
      if (!cleaned) return;
      setScannerOpen(false);

      if (scannerTarget === 'product_modal' && productModalOpen) {
        setPresetBarcode(cleaned);
        setScannerTarget('global');
        showToast(`Código asignado: ${cleaned}`);
        return;
      }

      const found = products.find((p) => p.barcode?.trim() === cleaned);
      setActiveTab('assistant');
      if (found) {
        setLastUnknownBarcode(null);
        setLastScannedProduct(found);
        showToast(`Escaneado: ${found.name}`);
      } else {
        setLastScannedProduct(null);
        setLastUnknownBarcode(cleaned);
        showToast(`Código ${cleaned} no encontrado en stock.`);
      }
    },
    [products, productModalOpen, scannerTarget, showToast]
  );

  useUsbBarcodeScanner({
    enabled: settings.usbScannerEnabled,
    onScan: handleBarcodeDetected,
  });

  // Guardar Movimiento en Libro Diario + ajustar stock automáticamente si corresponde
  const saveLedgerMovement = async (
    payload: Omit<LedgerEntry, 'id' | 'timestamp' | 'syncStatus'>,
    editingId?: string
  ) => {
    const locationLabel = weather.enabled
      ? [weather.neighborhood, weather.city].filter(Boolean).join(', ') || undefined
      : undefined;
    const weatherLabel =
      weather.enabled && weather.tempC !== undefined
        ? `${weather.tempC}°C ${weather.condition || ''}`.trim()
        : undefined;

    const existing = editingId ? await db.ledger.get(editingId) : undefined;
    const entry: LedgerEntry = {
      ...payload,
      id: existing?.id || crypto.randomUUID(),
      timestamp: existing?.timestamp || new Date().toISOString(),
      locationLabel: existing?.locationLabel || locationLabel,
      weatherLabel: existing?.weatherLabel || weatherLabel,
      syncStatus: 'pending',
    };

    await db.ledger.put(entry);

    // Ajustar stock solo en altas nuevas vinculadas a un producto
    if (!existing && entry.productId && entry.quantity) {
      const prod = await db.products.get(entry.productId);
      if (prod) {
        const delta =
          entry.type === 'venta' || entry.type === 'regalo'
            ? -entry.quantity
            : entry.type === 'devolucion' || entry.type === 'proveedor'
            ? entry.quantity
            : 0;
        if (delta !== 0) {
          await db.products.update(prod.id, {
            stock: Math.max(0, prod.stock + delta),
            updatedAt: new Date().toISOString(),
            syncStatus: 'pending',
          });
        }
      }
    }

    await queueSyncItem('ledger', entry.id, 'append_sheet', { type: entry.type });
    await refreshAllData();
    showToast(existing ? 'Movimiento actualizado.' : 'Guardado en Libro Diario.');
  };

  const handleDeleteLedgerEntry = async (id: string) => {
    await db.ledger.delete(id);
    await refreshAllData();
    showToast('Movimiento eliminado.');
  };

  // Guardar Producto en Stock
  const saveProduct = async (
    payload: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>,
    editingId?: string
  ) => {
    const existing = editingId ? await db.products.get(editingId) : undefined;
    const now = new Date().toISOString();
    const product: Product = {
      ...payload,
      id: existing?.id || crypto.randomUUID(),
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      syncStatus: 'pending',
    };

    await db.products.put(product);
    await queueSyncItem('product', product.id, 'upsert', { name: product.name });
    await refreshAllData();
    showToast(existing ? 'Producto actualizado.' : `Agregado a stock: ${product.name}`);
  };

  const handleAdjustStock = async (product: Product, delta: number) => {
    const nextStock = Math.max(0, product.stock + delta);
    await db.products.update(product.id, {
      stock: nextStock,
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending',
    });
    await refreshAllData();
  };

  const handleDeleteProduct = async (id: string) => {
    await db.products.delete(id);
    await refreshAllData();
    showToast('Producto eliminado del stock.');
  };

  const handleExportGoogleDoc = async (periodLabel: string, filtered: LedgerEntry[]) => {
    if (!isGoogleSessionActive()) {
      showToast('Conectá Google en Planillas y Conexiones para generar un Google Doc.');
      return;
    }
    try {
      const ingresos = filtered.filter((e) => e.direction === 'ingreso').reduce((a, b) => a + b.amount, 0);
      const egresos = filtered.filter((e) => e.direction === 'egreso').reduce((a, b) => a + b.amount, 0);
      const lines = [
        `${settings.businessName} — Resumen Interno (${periodLabel})`,
        `Rubro / Planilla: ${activeTemplate.name}`,
        `Generado: ${new Date().toLocaleString('es-AR')}`,
        '',
        `Ingresos: ${formatCurrency(ingresos, settings.currency)}`,
        `Egresos: ${formatCurrency(egresos, settings.currency)}`,
        `Balance Neto: ${formatCurrency(ingresos - egresos, settings.currency)}`,
        '',
        'Detalle de movimientos:',
        ...filtered.map(
          (e) =>
            `- ${formatShortDate(e.timestamp)} | ${MOVEMENT_TYPE_LABELS[e.type]} | ${e.description} | ${formatCurrency(
              e.amount,
              settings.currency
            )} (${e.paymentMethod})`
        ),
      ].join('\n');

      const docUrl = await createSummaryGoogleDoc(
        `${settings.businessName} - Libro Diario (${periodLabel})`,
        lines
      );
      window.open(docUrl, '_blank', 'noopener,noreferrer');
      showToast('Google Doc creado en tu cuenta.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo crear el Google Doc.');
    }
  };

  const handleSaveSocialDraft = async (draft: Omit<SocialDraft, 'id' | 'createdAt'>) => {
    await db.socialDrafts.put({
      ...draft,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    });
  };

  if (!ready) {
    return (
      <div className="app-shell" style={{ display: 'grid', placeItems: 'center', minHeight: '100dvh' }}>
        <span className="panel-subtitle">Iniciando entorno offline...</span>
      </div>
    );
  }

  const navItems: Array<{ id: ActiveTab; label: string; icon: typeof Mic }> = [
    { id: 'assistant', label: 'Asistente', icon: Mic },
    { id: 'ledger', label: 'Libro Diario', icon: BookOpen },
    { id: 'stock', label: 'Stock', icon: Package },
    { id: 'social', label: 'Redes', icon: Share2 },
    { id: 'settings', label: 'Planillas', icon: Settings },
  ];

  return (
    <div className="app-shell">
      <TopBar
        settings={settings}
        template={activeTemplate}
        weather={weather}
        weatherLoading={weatherLoading}
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        syncing={syncing}
        onToggleWeather={() => void handleToggleWeather()}
        onSyncNow={() => void handleSyncNow()}
        onOpenScanner={() => {
          setScannerTarget('global');
          setScannerOpen(true);
        }}
        onOpenManual={() => setManualOpen(true)}
      />

      {/* Navegación Desktop */}
      <nav className="nav-desktop" aria-label="Navegación principal">
        <div className="nav-desktop-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                id={`nav-desktop-${item.id}`}
                className={`nav-tab-btn ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Área principal */}
      <main className="workspace">
        {activeTab === 'assistant' && (
          <AssistantTab
            settings={settings}
            template={activeTemplate}
            products={products}
            ledger={ledger}
            lastScannedProduct={lastScannedProduct}
            lastUnknownBarcode={lastUnknownBarcode}
            queuedCommand={queuedCommand}
            onConsumeQueuedCommand={() => setQueuedCommand(null)}
            onClearScanBanner={() => {
              setLastScannedProduct(null);
              setLastUnknownBarcode(null);
            }}
            onOpenScanner={() => {
              setScannerTarget('global');
              setScannerOpen(true);
            }}
            onOpenManual={() => setManualOpen(true)}
            onOpenQuickMovement={(presetType, product) => {
              setEditingEntry(null);
              setMovementPresetType(presetType);
              setMovementPresetProduct(product || null);
              setMovementModalOpen(true);
            }}
            onOpenQuickProduct={(barcode) => {
              setEditingProduct(null);
              setPresetBarcode(barcode);
              setProductModalOpen(true);
            }}
            onConfirmMovement={async (data) => {
              await saveLedgerMovement({
                ...data,
                customFields: {},
              });
            }}
            onConfirmProduct={async (data) => {
              await saveProduct({
                name: data.name,
                category: data.category,
                price: data.price,
                cost: data.cost,
                stock: data.stock,
                barcode: data.barcode,
                unit: data.unit || 'u',
                description: data.description,
                customFields: {},
              });
            }}
          />
        )}

        {activeTab === 'ledger' && (
          <LedgerTab
            entries={ledger}
            settings={settings}
            template={activeTemplate}
            onAddNew={() => {
              setEditingEntry(null);
              setMovementPresetType('venta');
              setMovementPresetProduct(null);
              setMovementModalOpen(true);
            }}
            onEdit={(entry) => {
              setEditingEntry(entry);
              setMovementModalOpen(true);
            }}
            onDelete={handleDeleteLedgerEntry}
            onExportGoogleDoc={handleExportGoogleDoc}
          />
        )}

        {activeTab === 'stock' && (
          <StockTab
            products={products}
            settings={settings}
            template={activeTemplate}
            onAddNew={() => {
              setEditingProduct(null);
              setPresetBarcode(undefined);
              setProductModalOpen(true);
            }}
            onEdit={(prod) => {
              setEditingProduct(prod);
              setPresetBarcode(undefined);
              setProductModalOpen(true);
            }}
            onDelete={handleDeleteProduct}
            onAdjustStock={handleAdjustStock}
            onQuickSell={(prod) => {
              setEditingEntry(null);
              setMovementPresetType('venta');
              setMovementPresetProduct(prod);
              setMovementModalOpen(true);
            }}
            onOpenScanner={() => {
              setScannerTarget('global');
              setScannerOpen(true);
            }}
          />
        )}

        {activeTab === 'social' && (
          <SocialTab
            products={products}
            weather={weather}
            settings={settings}
            template={activeTemplate}
            onSaveDraft={handleSaveSocialDraft}
            onToast={showToast}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            settings={settings}
            templates={templates}
            activeTemplate={activeTemplate}
            pendingSyncCount={pendingSyncCount}
            onUpdateSettings={handleUpdateSettings}
            onSaveTemplate={handleSaveTemplate}
            onSyncNow={handleSyncNow}
            onToast={showToast}
            onDataImported={refreshAllData}
          />
        )}
      </main>

      {/* Navegación Móvil */}
      <nav className="nav-mobile" aria-label="Navegación móvil">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={activeTab === item.id ? 'active' : ''}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Modales */}
      <BarcodeScannerModal
        open={scannerOpen}
        usbEnabled={settings.usbScannerEnabled}
        onClose={() => {
          setScannerOpen(false);
          setScannerTarget('global');
        }}
        onDetected={(code) => handleBarcodeDetected(code)}
      />

      <MovementModal
        open={movementModalOpen}
        presetType={movementPresetType}
        presetProduct={movementPresetProduct}
        editingEntry={editingEntry}
        products={products}
        template={activeTemplate}
        settings={settings}
        onClose={() => setMovementModalOpen(false)}
        onSave={saveLedgerMovement}
      />

      <ProductModal
        open={productModalOpen}
        editingProduct={editingProduct}
        presetBarcode={presetBarcode}
        template={activeTemplate}
        settings={settings}
        onClose={() => setProductModalOpen(false)}
        onRequestBarcodeScan={() => {
          setScannerTarget('product_modal');
          setScannerOpen(true);
        }}
        onSave={saveProduct}
      />

      <ManualModal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        onTryVoiceCommand={(example) => {
          setActiveTab('assistant');
          setQueuedCommand(example);
        }}
      />

      {/* Notificaciones Toast */}
      {toasts.length > 0 && (
        <div className="toast-container" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className="toast">
              {t.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
