import type { LedgerEntry, MovementType, PaymentMethod, Product, SheetTemplate } from '../types';

export function formatCurrency(amount: number, currency = 'ARS'): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      maximumFractionDigits: safe % 1 === 0 ? 0 : 2,
    }).format(safe);
  } catch {
    return `$${safe.toLocaleString('es-AR')}`;
  }
}

export function formatShortTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export function isSameDay(isoA: string, dateB = new Date()): boolean {
  const a = new Date(isoA);
  return (
    a.getFullYear() === dateB.getFullYear() &&
    a.getMonth() === dateB.getMonth() &&
    a.getDate() === dateB.getDate()
  );
}

export function isSameMonth(isoA: string, dateB = new Date()): boolean {
  const a = new Date(isoA);
  return a.getFullYear() === dateB.getFullYear() && a.getMonth() === dateB.getMonth();
}

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  venta: 'Venta',
  cambio: 'Cambio',
  regalo: 'Regalo / Cortesía',
  ingreso_extra: 'Ingreso extra',
  gasto_general: 'Gasto general',
  proveedor: 'Proveedor',
  devolucion: 'Devolución',
  retiro: 'Retiro',
  otro: 'Otro',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  qr: 'QR / Billetera',
  tarjeta: 'Tarjeta',
  mixto: 'Mixto',
  sin_cargo: 'Sin cargo',
  cuenta_corriente: 'Cuenta corriente',
};

function escapeCsvCell(value: unknown): string {
  const str = String(value ?? '').replace(/"/g, '""');
  return `"${str}"`;
}

export function exportLedgerToCsv(entries: LedgerEntry[], template: SheetTemplate): void {
  const dynamicFields = template.ledgerFields.filter((f) => f.enabled);
  const headers = [
    'Fecha',
    'Hora',
    'Dirección',
    'Tipo',
    'Motivo',
    'Descripción',
    'Producto',
    'Cantidad',
    'Monto',
    'Medio de pago',
    'Proveedor / Contraparte',
    'Ubicación',
    'Clima',
    'Notas',
    ...dynamicFields.map((f) => f.label),
  ];

  const rows = entries.map((e) => [
    formatShortDate(e.timestamp),
    formatShortTime(e.timestamp),
    e.direction,
    MOVEMENT_TYPE_LABELS[e.type] || e.type,
    e.reason,
    e.description,
    e.productName || '',
    e.quantity ?? '',
    e.amount,
    PAYMENT_METHOD_LABELS[e.paymentMethod] || e.paymentMethod,
    e.counterparty || '',
    e.locationLabel || '',
    e.weatherLabel || '',
    e.notes || '',
    ...dynamicFields.map((f) => e.customFields?.[f.key] || ''),
  ]);

  const csv = '\uFEFF' + [headers, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\n');
  downloadTextFile(csv, `${template.ledgerSheetName}_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
}

export function exportStockToCsv(products: Product[], template: SheetTemplate): void {
  const dynamicFields = template.stockFields.filter((f) => f.enabled);
  const headers = [
    'Nombre',
    'Código de barras',
    'Categoría',
    'Precio',
    'Costo',
    'Stock',
    'Stock mínimo',
    'Unidad',
    'Descripción',
    'Foto Drive URL',
    ...dynamicFields.map((f) => f.label),
  ];

  const rows = products.map((p) => [
    p.name,
    p.barcode || '',
    p.category,
    p.price,
    p.cost ?? '',
    p.stock,
    p.minStock ?? '',
    p.unit,
    p.description || '',
    p.driveFileId ? `https://lh3.googleusercontent.com/d/${p.driveFileId}=s800` : '',
    ...dynamicFields.map((f) => p.customFields?.[f.key] || ''),
  ]);

  const csv = '\uFEFF' + [headers, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\n');
  downloadTextFile(csv, `${template.stockSheetName}_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
}

export function downloadTextFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
