import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type {
  AppSettings,
  LedgerEntry,
  MovementDirection,
  MovementType,
  PaymentBreakdown,
  PaymentMethod,
  Product,
  SheetTemplate,
} from '../types';
import { MOVEMENT_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '../utils/format';

interface MovementModalProps {
  open: boolean;
  presetType?: MovementType;
  presetProduct?: Product | null;
  editingEntry?: LedgerEntry | null;
  products: Product[];
  template: SheetTemplate;
  settings: AppSettings;
  onClose: () => void;
  onSave: (
    payload: Omit<LedgerEntry, 'id' | 'timestamp' | 'syncStatus'>,
    editingId?: string
  ) => Promise<void>;
}

function defaultDirectionForType(type: MovementType): MovementDirection {
  if (type === 'venta' || type === 'ingreso_extra') return 'ingreso';
  if (type === 'gasto_general' || type === 'proveedor' || type === 'devolucion' || type === 'retiro') {
    return 'egreso';
  }
  return 'neutro';
}

export function MovementModal({
  open,
  presetType = 'venta',
  presetProduct,
  editingEntry,
  products,
  template,
  settings,
  onClose,
  onSave,
}: MovementModalProps) {
  const [type, setType] = useState<MovementType>(presetType);
  const [direction, setDirection] = useState<MovementDirection>(defaultDirectionForType(presetType));
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [mixPart1Method, setMixPart1Method] = useState<Exclude<PaymentMethod, 'mixto'>>('efectivo');
  const [mixPart1Amount, setMixPart1Amount] = useState('');
  const [mixPart2Method, setMixPart2Method] = useState<Exclude<PaymentMethod, 'mixto'>>('transferencia');
  const [mixPart2Amount, setMixPart2Amount] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [counterparty, setCounterparty] = useState('');
  const [notes, setNotes] = useState('');
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (editingEntry) {
      setType(editingEntry.type);
      setDirection(editingEntry.direction);
      setReason(editingEntry.reason);
      setDescription(editingEntry.description);
      setAmount(String(editingEntry.amount));
      setPaymentMethod(editingEntry.paymentMethod);
      setProductId(editingEntry.productId || '');
      setQuantity(String(editingEntry.quantity ?? 1));
      setCounterparty(editingEntry.counterparty || '');
      setNotes(editingEntry.notes || '');
      setCustomFields(editingEntry.customFields || {});
      if (editingEntry.paymentBreakdown && editingEntry.paymentBreakdown.length >= 2) {
        setMixPart1Method(editingEntry.paymentBreakdown[0].method);
        setMixPart1Amount(String(editingEntry.paymentBreakdown[0].amount));
        setMixPart2Method(editingEntry.paymentBreakdown[1].method);
        setMixPart2Amount(String(editingEntry.paymentBreakdown[1].amount));
      }
      return;
    }

    setType(presetType);
    setDirection(defaultDirectionForType(presetType));
    setReason(template.movementReasons[0] || MOVEMENT_TYPE_LABELS[presetType]);
    setPaymentMethod(presetType === 'regalo' ? 'sin_cargo' : 'efectivo');
    setMixPart1Amount('');
    setMixPart2Amount('');
    setCounterparty('');
    setNotes('');
    setCustomFields({});

    if (presetProduct) {
      setProductId(presetProduct.id);
      setQuantity('1');
      setDescription(`1× ${presetProduct.name}`);
      setAmount(presetType === 'regalo' ? '0' : String(presetProduct.price));
    } else {
      setProductId('');
      setQuantity('1');
      setDescription('');
      setAmount(presetType === 'regalo' ? '0' : '');
    }
  }, [open, presetType, presetProduct, editingEntry, template]);

  if (!open) return null;

  const activeFields = template.ledgerFields.filter((f) => f.enabled);

  const handleTypeChange = (nextType: MovementType) => {
    setType(nextType);
    setDirection(defaultDirectionForType(nextType));
    if (nextType === 'regalo') {
      setAmount('0');
      setPaymentMethod('sin_cargo');
    } else if (paymentMethod === 'sin_cargo') {
      setPaymentMethod('efectivo');
    }
  };

  const handleProductChange = (nextProductId: string) => {
    setProductId(nextProductId);
    const prod = products.find((p) => p.id === nextProductId);
    if (prod) {
      const qty = Math.max(1, Number(quantity) || 1);
      setDescription(`${qty}× ${prod.name}`);
      if (type === 'venta' || type === 'devolucion') {
        setAmount(String(prod.price * qty));
      }
    }
  };

  const handleQuantityChange = (nextQtyStr: string) => {
    setQuantity(nextQtyStr);
    const prod = products.find((p) => p.id === productId);
    const qty = Math.max(1, Number(nextQtyStr) || 1);
    if (prod) {
      setDescription(`${qty}× ${prod.name}`);
      if (type === 'venta' || type === 'devolucion') {
        setAmount(String(prod.price * qty));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const selectedProduct = products.find((p) => p.id === productId);
      let finalAmount = Number(amount) || 0;
      let paymentBreakdown: PaymentBreakdown[] | undefined;

      if (paymentMethod === 'mixto') {
        const a1 = Number(mixPart1Amount) || 0;
        const a2 = Number(mixPart2Amount) || 0;
        paymentBreakdown = [
          { method: mixPart1Method, amount: a1 },
          { method: mixPart2Method, amount: a2 },
        ];
        if (a1 + a2 > 0) finalAmount = a1 + a2;
      }

      await onSave(
        {
          direction,
          type,
          reason: reason.trim() || MOVEMENT_TYPE_LABELS[type],
          description: description.trim() || reason.trim() || MOVEMENT_TYPE_LABELS[type],
          amount: finalAmount,
          paymentMethod,
          paymentBreakdown,
          productId: selectedProduct?.id,
          productName: selectedProduct?.name,
          quantity: selectedProduct ? Math.max(1, Number(quantity) || 1) : undefined,
          counterparty: counterparty.trim() || undefined,
          notes: notes.trim() || undefined,
          customFields,
        },
        editingEntry?.id
      );
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Registrar movimiento">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              {editingEntry ? 'Editar Movimiento' : 'Registrar Movimiento Interno'}
            </h2>
            <p className="panel-subtitle">
              Control interno para tu Libro Diario (sin facturación ni ARCA).
            </p>
          </div>
          <button type="button" className="btn btn-icon btn-ghost" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="mov-type">Tipo de movimiento</label>
              <select
                id="mov-type"
                className="select"
                value={type}
                onChange={(e) => handleTypeChange(e.target.value as MovementType)}
              >
                {Object.entries(MOVEMENT_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="mov-direction">Impacto en caja</label>
              <select
                id="mov-direction"
                className="select"
                value={direction}
                onChange={(e) => setDirection(e.target.value as MovementDirection)}
              >
                <option value="ingreso">Ingreso (+)</option>
                <option value="egreso">Egreso (-)</option>
                <option value="neutro">Neutro (sin dinero, ej. regalo / cambio directo)</option>
              </select>
            </div>
          </div>

          <div className="field-grid">
            <div className="field">
              <label htmlFor="mov-product">Producto de stock (opcional)</label>
              <select
                id="mov-product"
                className="select"
                value={productId}
                onChange={(e) => handleProductChange(e.target.value)}
              >
                <option value="">— Sin vincular a producto —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.stock} · ${p.price})
                  </option>
                ))}
              </select>
            </div>

            {productId && (
              <div className="field">
                <label htmlFor="mov-qty">Cantidad</label>
                <input
                  id="mov-qty"
                  type="number"
                  min={1}
                  className="input mono"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="field">
            <label htmlFor="mov-desc">Descripción</label>
            <input
              id="mov-desc"
              className="input"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: 2× Mate de algarrobo / Compra de bolsas y etiquetas"
            />
          </div>

          <div className="field-grid">
            <div className="field">
              <label htmlFor="mov-reason">Motivo</label>
              <input
                id="mov-reason"
                className="input"
                list="template-reasons-list"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Elegí o escribí un motivo"
              />
              <datalist id="template-reasons-list">
                {template.movementReasons.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>

            <div className="field">
              <label htmlFor="mov-amount">Monto ({settings.currency})</label>
              <input
                id="mov-amount"
                type="number"
                step="0.01"
                min={0}
                className="input mono"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="field-grid">
            <div className="field">
              <label htmlFor="mov-payment">Tipo de pago</label>
              <select
                id="mov-payment"
                className="select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              >
                {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="mov-counterparty">Proveedor / Persona (opcional)</label>
              <input
                id="mov-counterparty"
                className="input"
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
                placeholder="Ej: Distribuidora Sur / Cliente"
              />
            </div>
          </div>

          {paymentMethod === 'mixto' && (
            <div className="notice-bar" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <strong style={{ fontSize: 12.5 }}>Desglose de pago mixto</strong>
              <div className="field-grid">
                <div className="field">
                  <label>Parte 1</label>
                  <select
                    className="select"
                    value={mixPart1Method}
                    onChange={(e) => setMixPart1Method(e.target.value as Exclude<PaymentMethod, 'mixto'>)}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="qr">QR</option>
                    <option value="tarjeta">Tarjeta</option>
                  </select>
                </div>
                <div className="field">
                  <label>Monto 1</label>
                  <input
                    type="number"
                    className="input mono"
                    value={mixPart1Amount}
                    onChange={(e) => setMixPart1Amount(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Parte 2</label>
                  <select
                    className="select"
                    value={mixPart2Method}
                    onChange={(e) => setMixPart2Method(e.target.value as Exclude<PaymentMethod, 'mixto'>)}
                  >
                    <option value="transferencia">Transferencia</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="qr">QR</option>
                    <option value="tarjeta">Tarjeta</option>
                  </select>
                </div>
                <div className="field">
                  <label>Monto 2</label>
                  <input
                    type="number"
                    className="input mono"
                    value={mixPart2Amount}
                    onChange={(e) => setMixPart2Amount(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Campos dinámicos de la planilla del rubro */}
          {activeFields.length > 0 && (
            <div className="field-grid">
              {activeFields.map((field) => (
                <div key={field.key} className="field">
                  <label htmlFor={`mov-cf-${field.key}`}>{field.label}</label>
                  {field.type === 'select' && field.options ? (
                    <select
                      id={`mov-cf-${field.key}`}
                      className="select"
                      value={customFields[field.key] || ''}
                      onChange={(e) =>
                        setCustomFields((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                    >
                      <option value="">Seleccionar...</option>
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={`mov-cf-${field.key}`}
                      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                      className="input"
                      value={customFields[field.key] || ''}
                      placeholder={field.placeholder}
                      onChange={(e) =>
                        setCustomFields((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="field">
            <label htmlFor="mov-notes">Notas adicionales</label>
            <textarea
              id="mov-notes"
              className="textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalle del cambio, comprobante interno, observaciones..."
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" id="btn-save-movement" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : editingEntry ? 'Guardar cambios' : 'Registrar en Libro Diario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
