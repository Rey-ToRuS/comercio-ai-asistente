import { db } from '../db/database';
import type { AppSettings, LedgerEntry, Product, SheetTemplate } from '../types';
import { formatShortDate, formatShortTime, MOVEMENT_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '../utils/format';
import { dataUrlToBlob } from '../utils/image';

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

interface TokenState {
  accessToken: string;
  expiresAt: number;
}

let tokenState: TokenState | null = null;

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; expires_in?: number; error?: string }) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

/**
 * Lección del Blueprint #2:
 * Endpoint directo de alta resolución sin cookies para visualizar fotos de Drive en la web.
 */
export function getDriveImageDirectUrl(fileId: string, size = 800): string {
  return `https://lh3.googleusercontent.com/d/${fileId}=s${size}`;
}

export function isGoogleSessionActive(): boolean {
  return Boolean(tokenState && Date.now() < tokenState.expiresAt - 60_000);
}

export function clearGoogleSession(): void {
  tokenState = null;
}

export async function connectGoogleAccount(clientId: string): Promise<{ accessToken: string; email?: string }> {
  if (!clientId.trim()) {
    throw new Error('Pegá tu Google OAuth Client ID en Conexiones antes de iniciar sesión.');
  }
  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services no se cargó todavía (verificá tu conexión a internet).');
  }

  const token = await new Promise<string>((resolve, reject) => {
    const client = window.google!.accounts!.oauth2!.initTokenClient({
      client_id: clientId.trim(),
      scope: GOOGLE_SCOPES,
      callback: (resp) => {
        if (resp.error || !resp.access_token) {
          reject(new Error(resp.error || 'No se recibió permiso de Google.'));
          return;
        }
        tokenState = {
          accessToken: resp.access_token,
          expiresAt: Date.now() + (resp.expires_in || 3500) * 1000,
        };
        resolve(resp.access_token);
      },
    });
    client.requestAccessToken({ prompt: 'consent' });
  });

  let email: string | undefined;
  try {
    const infoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (infoRes.ok) {
      const info = await infoRes.json();
      email = info.email;
    }
  } catch {
    // Email es opcional
  }

  return { accessToken: token, email };
}

async function googleFetch(url: string, init: RequestInit = {}): Promise<Response> {
  if (!tokenState || Date.now() >= tokenState.expiresAt) {
    throw new Error('Sesión de Google vencida o no iniciada. Tocá "Conectar Google" en Conexiones.');
  }
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${tokenState.accessToken}`);
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google API (${res.status}): ${text.slice(0, 220)}`);
  }
  return res;
}

export async function createDriveFolder(name: string, parentId?: string): Promise<string> {
  const metadata: Record<string, unknown> = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) metadata.parents = [parentId];

  const res = await googleFetch('https://www.googleapis.com/drive/v3/files?fields=id', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metadata),
  });
  const data = await res.json();
  return data.id as string;
}

/**
 * Lección del Blueprint #1 (Traslado atómico en Google Drive v3):
 * Siempre incluir addParents Y removeParents en el mismo PATCH para evitar 403 cannotAddParent.
 */
export async function moveDriveFileAtomically(
  fileId: string,
  targetFolderId: string,
  sourceFolderId: string
): Promise<void> {
  const params = new URLSearchParams({
    addParents: targetFolderId,
    removeParents: sourceFolderId,
    fields: 'id,parents',
  });
  await googleFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?${params.toString()}`, {
    method: 'PATCH',
  });
}

export async function uploadProductPhotoToDrive(
  product: Product,
  folderId: string
): Promise<string> {
  if (!product.photoDataUrl) {
    throw new Error('El producto no tiene foto local para subir.');
  }

  const blob = dataUrlToBlob(product.photoDataUrl);
  const metadata = {
    name: `${product.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_${product.id.slice(0, 6)}.jpg`,
    parents: [folderId],
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', blob);

  const res = await googleFetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST',
    body: form,
  });
  const data = await res.json();
  return data.id as string;
}

export async function provisionGoogleWorkspace(
  settings: AppSettings,
  template: SheetTemplate
): Promise<{
  folderId: string;
  productsFolderId: string;
  spreadsheetId: string;
}> {
  const safeBiz = settings.businessName.trim() || 'Mi Comercio';
  const folderId =
    settings.googleFolderId || (await createDriveFolder(`ComercioAI - ${safeBiz}`));
  const productsFolderId =
    settings.googleProductsFolderId || (await createDriveFolder('Fotos Productos', folderId));

  let spreadsheetId = settings.googleSpreadsheetId;
  if (!spreadsheetId) {
    const createRes = await googleFetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        properties: { title: `${safeBiz} — ${template.name}` },
        sheets: [
          { properties: { title: template.ledgerSheetName } },
          { properties: { title: template.stockSheetName } },
          { properties: { title: template.expensesSheetName } },
        ],
      }),
    });
    const sheetData = await createRes.json();
    spreadsheetId = sheetData.spreadsheetId as string;

    // Mover la planilla dentro de la carpeta aislada del proyecto (atomic move)
    try {
      const metaRes = await googleFetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(spreadsheetId)}?fields=parents`
      );
      const meta = await metaRes.json();
      const prevParent = Array.isArray(meta.parents) ? meta.parents[0] : 'root';
      if (prevParent && prevParent !== folderId) {
        await moveDriveFileAtomically(spreadsheetId, folderId, prevParent);
      }
    } catch {
      // Si el archivo quedó en root igualmente es accesible
    }

    // Escribir encabezados dinámicos según la plantilla configurada por el cliente
    const ledgerHeaders = [
      'ID',
      'Fecha',
      'Hora',
      'Dirección',
      'Tipo',
      'Motivo',
      'Descripción',
      'Producto',
      'Cantidad',
      'Monto',
      'Medio de Pago',
      'Proveedor / Contraparte',
      'Ubicación',
      'Clima',
      'Notas',
      ...template.ledgerFields.filter((f) => f.enabled).map((f) => f.label),
    ];

    const stockHeaders = [
      'ID',
      'Nombre',
      'Código de Barras',
      'Categoría',
      'Precio',
      'Costo',
      'Stock',
      'Unidad',
      'Descripción',
      'Foto Drive URL',
      ...template.stockFields.filter((f) => f.enabled).map((f) => f.label),
    ];

    const expensesHeaders = [
      'ID',
      'Fecha',
      'Tipo',
      'Motivo',
      'Proveedor',
      'Descripción',
      'Monto',
      'Medio de Pago',
      'Notas',
    ];

    await googleFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchUpdate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: [
            { range: `'${template.ledgerSheetName}'!A1`, values: [ledgerHeaders] },
            { range: `'${template.stockSheetName}'!A1`, values: [stockHeaders] },
            { range: `'${template.expensesSheetName}'!A1`, values: [expensesHeaders] },
          ],
        }),
      }
    );
  }

  return { folderId, productsFolderId, spreadsheetId };
}

async function appendSheetRow(spreadsheetId: string, sheetName: string, row: (string | number)[]): Promise<void> {
  const range = encodeURIComponent(`'${sheetName}'!A1`);
  await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    }
  );
}

export async function syncPendingQueueToGoogle(
  settings: AppSettings,
  template: SheetTemplate
): Promise<{ synced: number; failed: number }> {
  if (!isGoogleSessionActive()) {
    throw new Error('Iniciá sesión con Google en Conexiones para sincronizar.');
  }

  const workspace = await provisionGoogleWorkspace(settings, template);
  if (
    workspace.folderId !== settings.googleFolderId ||
    workspace.productsFolderId !== settings.googleProductsFolderId ||
    workspace.spreadsheetId !== settings.googleSpreadsheetId
  ) {
    await db.settings.update('main', {
      googleFolderId: workspace.folderId,
      googleProductsFolderId: workspace.productsFolderId,
      googleSpreadsheetId: workspace.spreadsheetId,
    });
  }

  const items = await db.syncQueue.orderBy('createdAt').toArray();
  let synced = 0;
  let failed = 0;

  for (const item of items) {
    try {
      if (item.entityType === 'product') {
        const product = await db.products.get(item.entityId);
        if (!product) {
          await db.syncQueue.delete(item.id);
          continue;
        }
        let driveFileId = product.driveFileId;
        if (product.photoDataUrl && !driveFileId) {
          driveFileId = await uploadProductPhotoToDrive(product, workspace.productsFolderId);
          await db.products.update(product.id, { driveFileId, driveFolderId: workspace.productsFolderId });
        }
        const row: (string | number)[] = [
          product.id,
          product.name,
          product.barcode || '',
          product.category,
          product.price,
          product.cost ?? '',
          product.stock,
          product.unit,
          product.description || '',
          driveFileId ? getDriveImageDirectUrl(driveFileId) : '',
          ...template.stockFields.filter((f) => f.enabled).map((f) => product.customFields?.[f.key] || ''),
        ];
        await appendSheetRow(workspace.spreadsheetId, template.stockSheetName, row);
        await db.products.update(product.id, { syncStatus: 'synced' });
      } else if (item.entityType === 'ledger') {
        const entry: LedgerEntry | undefined = await db.ledger.get(item.entityId);
        if (!entry) {
          await db.syncQueue.delete(item.id);
          continue;
        }
        const row: (string | number)[] = [
          entry.id,
          formatShortDate(entry.timestamp),
          formatShortTime(entry.timestamp),
          entry.direction,
          MOVEMENT_TYPE_LABELS[entry.type] || entry.type,
          entry.reason,
          entry.description,
          entry.productName || '',
          entry.quantity ?? '',
          entry.amount,
          PAYMENT_METHOD_LABELS[entry.paymentMethod] || entry.paymentMethod,
          entry.counterparty || '',
          entry.locationLabel || '',
          entry.weatherLabel || '',
          entry.notes || '',
          ...template.ledgerFields.filter((f) => f.enabled).map((f) => entry.customFields?.[f.key] || ''),
        ];
        await appendSheetRow(workspace.spreadsheetId, template.ledgerSheetName, row);

        // Si es gasto general o proveedor, también lo refleja en la pestaña de gastos/proveedores
        if (entry.type === 'gasto_general' || entry.type === 'proveedor') {
          await appendSheetRow(workspace.spreadsheetId, template.expensesSheetName, [
            entry.id,
            formatShortDate(entry.timestamp),
            MOVEMENT_TYPE_LABELS[entry.type],
            entry.reason,
            entry.counterparty || '',
            entry.description,
            entry.amount,
            PAYMENT_METHOD_LABELS[entry.paymentMethod] || entry.paymentMethod,
            entry.notes || '',
          ]);
        }

        await db.ledger.update(entry.id, { syncStatus: 'synced' });
      }

      await db.syncQueue.delete(item.id);
      synced += 1;
    } catch (err) {
      failed += 1;
      await db.syncQueue.update(item.id, {
        attempts: item.attempts + 1,
        lastError: err instanceof Error ? err.message : 'Error de sincronización',
      });
    }
  }

  return { synced, failed };
}

export async function createSummaryGoogleDoc(title: string, bodyText: string): Promise<string> {
  const createRes = await googleFetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  const doc = await createRes.json();
  const docId = doc.documentId as string;

  await googleFetch(`https://docs.googleapis.com/v1/documents/${encodeURIComponent(docId)}:batchUpdate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{ insertText: { location: { index: 1 }, text: bodyText } }],
    }),
  });

  return `https://docs.google.com/document/d/${docId}/edit`;
}
