export type BusinessTypeId =
  | 'feria'
  | 'kiosco'
  | 'indumentaria'
  | 'gastronomia'
  | 'servicios'
  | 'general';

export type FieldValueType = 'text' | 'number' | 'date' | 'select';

export interface TemplateField {
  key: string;
  label: string;
  type: FieldValueType;
  enabled: boolean;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  system?: boolean; // campos estructurales recomendados
}

export interface SheetTemplate {
  id: string;
  businessType: BusinessTypeId;
  name: string;
  description: string;
  stockSheetName: string;
  ledgerSheetName: string;
  expensesSheetName: string;
  categories: string[];
  movementReasons: string[];
  paymentMethods: string[];
  stockFields: TemplateField[];
  ledgerFields: TemplateField[];
  updatedAt: string;
}

export type SyncStatus = 'local_only' | 'pending' | 'synced' | 'error';

export interface Product {
  id: string;
  name: string;
  barcode?: string;
  category: string;
  price: number;
  cost?: number;
  stock: number;
  minStock?: number;
  unit: string;
  description?: string;
  photoDataUrl?: string; // guardado offline en IndexedDB
  driveFileId?: string;
  driveFolderId?: string;
  customFields: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export type MovementDirection = 'ingreso' | 'egreso' | 'neutro';

export type MovementType =
  | 'venta'
  | 'cambio'
  | 'regalo'
  | 'ingreso_extra'
  | 'gasto_general'
  | 'proveedor'
  | 'devolucion'
  | 'retiro'
  | 'otro';

export type PaymentMethod =
  | 'efectivo'
  | 'transferencia'
  | 'tarjeta'
  | 'qr'
  | 'mixto'
  | 'sin_cargo'
  | 'cuenta_corriente';

export interface PaymentBreakdown {
  method: Exclude<PaymentMethod, 'mixto'>;
  amount: number;
}

export interface LedgerEntry {
  id: string;
  timestamp: string;
  direction: MovementDirection;
  type: MovementType;
  reason: string;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentBreakdown?: PaymentBreakdown[];
  productId?: string;
  productName?: string;
  quantity?: number;
  counterparty?: string; // proveedor o cliente interno
  locationLabel?: string;
  weatherLabel?: string;
  notes?: string;
  customFields: Record<string, string>;
  syncStatus: SyncStatus;
}

export interface SyncQueueItem {
  id: string;
  entityType: 'ledger' | 'product' | 'photo';
  entityId: string;
  action: 'upsert' | 'append_sheet' | 'upload_drive';
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
  lastError?: string;
}

export type AIProviderId = 'gemini' | 'groq_meta' | 'openai' | 'local';

export type CloudEcosystemId = 'google' | 'meta_share' | 'local_only';

export interface WeatherContext {
  enabled: boolean;
  lat?: number;
  lon?: number;
  city?: string;
  neighborhood?: string;
  tempC?: number;
  condition?: string;
  weatherCode?: number;
  updatedAt?: string;
}

export type UserRole = 'admin' | 'vendedor' | 'administrativo';

export type SocialPlatformId = 'meta' | 'tiktok' | 'x' | 'whatsapp';

export interface AppSettings {
  id: 'main';
  businessName: string;
  activeTemplateId: string;
  currency: string;
  aiProvider: AIProviderId;
  aiApiKey: string;
  aiModel: string;
  cloudEcosystem: CloudEcosystemId;
  googleClientId: string;
  googleFolderId?: string;
  googleProductsFolderId?: string;
  googleSpreadsheetId?: string;
  googleConnectedEmail?: string;
  usbScannerEnabled: boolean;
  locationEnabled: boolean;
  autoSyncOnOnline: boolean;
  ownerEmail?: string;
  activeRole: UserRole;
  adminPin?: string;
  onboardingCompleted: boolean;
  connectedSocials: Record<SocialPlatformId, boolean>;
}

export interface ParsedMovementAction {
  kind: 'movement';
  confidence: 'high' | 'medium';
  source: 'ai' | 'local';
  rawCommand: string;
  summary: string;
  data: {
    direction: MovementDirection;
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
  };
}

export interface ParsedProductAction {
  kind: 'product';
  confidence: 'high' | 'medium';
  source: 'ai' | 'local';
  rawCommand: string;
  summary: string;
  data: {
    name: string;
    category: string;
    price: number;
    cost?: number;
    stock: number;
    barcode?: string;
    unit?: string;
    description?: string;
  };
}

export interface ParsedQueryAction {
  kind: 'answer';
  source: 'ai' | 'local';
  rawCommand: string;
  answer: string;
}

export type ParsedAssistantAction =
  | ParsedMovementAction
  | ParsedProductAction
  | ParsedQueryAction;

export interface SocialDraft {
  id: string;
  createdAt: string;
  format: 'instagram_post' | 'reel_script' | 'whatsapp_status' | 'fair_promo';
  tone: 'cercano' | 'minimalista' | 'oferta' | 'informativo';
  productIds: string[];
  includeWeatherLocation: boolean;
  caption: string;
  hashtags: string[];
  hook?: string;
}

export type ActiveTab = 'assistant' | 'ledger' | 'stock' | 'social' | 'settings';
