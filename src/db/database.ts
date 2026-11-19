import Dexie, { type Table } from 'dexie';
import type {
  AppSettings,
  LedgerEntry,
  Product,
  SheetTemplate,
  SocialDraft,
  SyncQueueItem,
} from '../types';
import { DEFAULT_TEMPLATES } from '../data/templates';

export class ComercioAIDatabase extends Dexie {
  products!: Table<Product, string>;
  ledger!: Table<LedgerEntry, string>;
  templates!: Table<SheetTemplate, string>;
  syncQueue!: Table<SyncQueueItem, string>;
  socialDrafts!: Table<SocialDraft, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('ComercioAI_Isolated_DB_v1');
    this.version(1).stores({
      products: 'id, name, barcode, category, syncStatus, updatedAt',
      ledger: 'id, timestamp, direction, type, paymentMethod, productId, syncStatus',
      templates: 'id, businessType, name',
      syncQueue: 'id, entityType, entityId, createdAt',
      socialDrafts: 'id, createdAt, format',
      settings: 'id',
    });
  }
}

export const db = new ComercioAIDatabase();

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'main',
  businessName: 'Mi Comercio',
  activeTemplateId: 'tpl-feria',
  currency: 'ARS',
  aiProvider: 'local',
  aiApiKey: '',
  aiModel: 'gemini-2.5-flash',
  cloudEcosystem: 'google',
  googleClientId: '',
  usbScannerEnabled: true,
  locationEnabled: false,
  autoSyncOnOnline: true,
};

export async function initializeDatabase(): Promise<void> {
  const existingTemplates = await db.templates.count();
  if (existingTemplates === 0) {
    await db.templates.bulkPut(DEFAULT_TEMPLATES);
  }

  const existingSettings = await db.settings.get('main');
  if (!existingSettings) {
    await db.settings.put(DEFAULT_SETTINGS);
  }
}

export async function queueSyncItem(
  entityType: SyncQueueItem['entityType'],
  entityId: string,
  action: SyncQueueItem['action'],
  payload: Record<string, unknown>
): Promise<void> {
  const item: SyncQueueItem = {
    id: crypto.randomUUID(),
    entityType,
    entityId,
    action,
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  await db.syncQueue.put(item);
}

export async function exportFullBackupJson(): Promise<string> {
  const [products, ledger, templates, settings, socialDrafts] = await Promise.all([
    db.products.toArray(),
    db.ledger.toArray(),
    db.templates.toArray(),
    db.settings.get('main'),
    db.socialDrafts.toArray(),
  ]);

  return JSON.stringify(
    {
      schema: 'comercio-ai-backup-v1',
      exportedAt: new Date().toISOString(),
      settings: settings ? { ...settings, aiApiKey: '' } : DEFAULT_SETTINGS,
      templates,
      products,
      ledger,
      socialDrafts,
    },
    null,
    2
  );
}

export async function importFullBackupJson(rawJson: string): Promise<{
  products: number;
  ledger: number;
  templates: number;
}> {
  const parsed = JSON.parse(rawJson);
  if (!parsed || parsed.schema !== 'comercio-ai-backup-v1') {
    throw new Error('El archivo no corresponde a un respaldo válido de ComercioAI.');
  }

  const products: Product[] = Array.isArray(parsed.products) ? parsed.products : [];
  const ledger: LedgerEntry[] = Array.isArray(parsed.ledger) ? parsed.ledger : [];
  const templates: SheetTemplate[] = Array.isArray(parsed.templates) ? parsed.templates : [];

  await db.transaction('rw', db.products, db.ledger, db.templates, db.settings, async () => {
    if (templates.length > 0) await db.templates.bulkPut(templates);
    if (products.length > 0) await db.products.bulkPut(products);
    if (ledger.length > 0) await db.ledger.bulkPut(ledger);
    if (parsed.settings) {
      const current = await db.settings.get('main');
      await db.settings.put({
        ...DEFAULT_SETTINGS,
        ...parsed.settings,
        // Conservar API key local existente si el backup viene sanitizado
        aiApiKey: current?.aiApiKey || '',
        id: 'main',
      });
    }
  });

  return {
    products: products.length,
    ledger: ledger.length,
    templates: templates.length,
  };
}
