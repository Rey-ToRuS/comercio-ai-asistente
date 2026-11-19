import { useMemo, useState } from 'react';
import { Download, FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import type { AppSettings, LedgerEntry, MovementType, PaymentMethod, SheetTemplate } from '../types';
import {
  exportLedgerToCsv,
  formatCurrency,
  formatShortDate,
  formatShortTime,
  isSameDay,
  isSameMonth,
  MOVEMENT_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
} from '../utils/format';

interface LedgerTabProps {
  entries: LedgerEntry[];
  settings: AppSettings;
  template: SheetTemplate;
  onAddNew: () => void;
  onEdit: (entry: LedgerEntry) => void;
  onDelete: (id: string) => Promise<void>;
  onExportGoogleDoc: (periodLabel: string, filtered: LedgerEntry[]) => Promise<void>;
}

export function LedgerTab({
  entries,
  settings,
  template,
  onAddNew,
  onEdit,
  onDelete,
  onExportGoogleDoc,
}: LedgerTabProps) {
  const [period, setPeriod] = useState<'today' | 'month' | 'all'>('today');
  const [typeFilter, setTypeFilter] = useState<MovementType | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethod | 'all'>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (period === 'today' && !isSameDay(entry.timestamp)) return false;
      if (period === 'month' && !isSameMonth(entry.timestamp)) return false;
      if (typeFilter !== 'all' && entry.type !== typeFilter) return false;
      if (paymentFilter !== 'all' && entry.paymentMethod !== paymentFilter) return false;
      if (q) {
        const hay = `${entry.description} ${entry.reason} ${entry.counterparty || ''} ${entry.notes || ''} ${entry.productName || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [entries, period, typeFilter, paymentFilter, query]);

  const totals = useMemo(() => {
    const ingresos = filtered.filter((e) => e.direction === 'ingreso').reduce((acc, e) => acc + e.amount, 0);
    const egresos = filtered.filter((e) => e.direction === 'egreso').reduce((acc, e) => acc + e.amount, 0);
    return {
      ingresos,
      egresos,
      neto: ingresos - egresos,
      count: filtered.length,
    };
  }, [filtered]);

  const periodLabel = period === 'today' ? 'Hoy' : period === 'month' ? 'Este Mes' : 'Histórico';

  return (
    <section aria-label="Libro Diario de control interno">
      <div className="page-header">
        <div>
          <h1 className="page-title">Libro Diario</h1>
          <p className="page-desc">
            Control interno de ingresos, egresos, cambios, regalos, proveedores y gastos generales (sin ARCA).
          </p>
        </div>

        <div className="page-actions">
          <div className="segmented" role="tablist" aria-label="Período">
            <button type="button" className={period === 'today' ? 'active' : ''} onClick={() => setPeriod('today')}>
              Hoy
            </button>
            <button type="button" className={period === 'month' ? 'active' : ''} onClick={() => setPeriod('month')}>
              Mes
            </button>
            <button type="button" className={period === 'all' ? 'active' : ''} onClick={() => setPeriod('all')}>
              Todo
            </button>
          </div>

          <button
            type="button"
            className="btn btn-sm"
            onClick={() => exportLedgerToCsv(filtered, template)}
            disabled={filtered.length === 0}
          >
            <Download size={14} />
            CSV
          </button>

          <button
            type="button"
            className="btn btn-sm"
            onClick={() => void onExportGoogleDoc(periodLabel, filtered)}
            disabled={filtered.length === 0}
            title="Generar informe en Google Docs"
          >
            <FileText size={14} />
            Doc
          </button>

          <button type="button" id="btn-ledger-add" className="btn btn-primary btn-sm" onClick={onAddNew}>
            <Plus size={15} />
            Registrar
          </button>
        </div>
      </div>

      {/* Única zona de totales numéricos (sin duplicación en otras pestañas) */}
      <div className="metrics-strip">
        <div className="metric-box">
          <div className="metric-label">Ingresos ({periodLabel})</div>
          <div className="metric-value income mono">{formatCurrency(totals.ingresos, settings.currency)}</div>
        </div>
        <div className="metric-box">
          <div className="metric-label">Egresos y Gastos</div>
          <div className="metric-value expense mono">{formatCurrency(totals.egresos, settings.currency)}</div>
        </div>
        <div className="metric-box">
          <div className="metric-label">Balance Neto</div>
          <div className="metric-value mono">{formatCurrency(totals.neto, settings.currency)}</div>
        </div>
        <div className="metric-box">
          <div className="metric-label">Movimientos</div>
          <div className="metric-value mono">{totals.count}</div>
        </div>
      </div>

      <div className="panel">
        <div className="filter-bar">
          <input
            className="input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por producto, motivo, proveedor o nota..."
          />
          <select
            className="select"
            style={{ width: 'auto', minWidth: 155 }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as MovementType | 'all')}
          >
            <option value="all">Todos los tipos</option>
            {Object.entries(MOVEMENT_TYPE_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="select"
            style={{ width: 'auto', minWidth: 155 }}
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as PaymentMethod | 'all')}
          >
            <option value="all">Todos los pagos</option>
            {Object.entries(PAYMENT_METHOD_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <strong>No hay movimientos en este período</strong>
            <p>Usá el asistente por voz o tocá “Registrar” para cargar tu primera venta, cambio o gasto.</p>
          </div>
        ) : (
          <div className="ledger-list">
            {filtered.map((entry) => (
              <div key={entry.id} className="ledger-row">
                <div className="ledger-row-main">
                  <div className="ledger-row-title">
                    <span>{entry.description}</span>
                    <span
                      className={`tag ${
                        entry.direction === 'ingreso'
                          ? 'tag-income'
                          : entry.direction === 'egreso'
                          ? 'tag-expense'
                          : 'tag-warn'
                      }`}
                    >
                      {MOVEMENT_TYPE_LABELS[entry.type]}
                    </span>
                    <span className="tag">{PAYMENT_METHOD_LABELS[entry.paymentMethod]}</span>
                  </div>
                  <div className="ledger-row-meta">
                    <span className="mono">
                      {formatShortDate(entry.timestamp)} {formatShortTime(entry.timestamp)}
                    </span>
                    <span>· {entry.reason}</span>
                    {entry.counterparty && <span>· {entry.counterparty}</span>}
                    {entry.locationLabel && <span>· {entry.locationLabel}</span>}
                    {entry.syncStatus === 'pending' && <span className="tag tag-warn">Pendiente sync</span>}
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
                  <button
                    type="button"
                    className="btn btn-icon btn-ghost"
                    onClick={() => onEdit(entry)}
                    aria-label="Editar"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-icon btn-ghost"
                    onClick={() => void onDelete(entry.id)}
                    aria-label="Eliminar"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
