import { useEffect, useState } from 'react';
import { Camera, ScanBarcode, Sparkles, X } from 'lucide-react';
import type { AppSettings, Product, SheetTemplate } from '../types';
import { compressImageFile } from '../utils/image';
import { analyzeProductPhotoWithAI } from '../services/aiProviderService';

interface ProductModalProps {
  open: boolean;
  editingProduct?: Product | null;
  presetBarcode?: string;
  template: SheetTemplate;
  settings: AppSettings;
  onClose: () => void;
  onRequestBarcodeScan: () => void;
  onSave: (
    payload: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>,
    editingId?: string
  ) => Promise<void>;
}

export function ProductModal({
  open,
  editingProduct,
  presetBarcode,
  template,
  settings,
  onClose,
  onRequestBarcodeScan,
  onSave,
}: ProductModalProps) {
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState(template.categories[0] || 'General');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [stock, setStock] = useState('1');
  const [minStock, setMinStock] = useState('2');
  const [unit, setUnit] = useState('u');
  const [description, setDescription] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined);
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAiError(null);
    if (editingProduct) {
      setName(editingProduct.name);
      setBarcode(editingProduct.barcode || '');
      setCategory(editingProduct.category);
      setPrice(String(editingProduct.price));
      setCost(editingProduct.cost !== undefined ? String(editingProduct.cost) : '');
      setStock(String(editingProduct.stock));
      setMinStock(editingProduct.minStock !== undefined ? String(editingProduct.minStock) : '2');
      setUnit(editingProduct.unit || 'u');
      setDescription(editingProduct.description || '');
      setPhotoDataUrl(editingProduct.photoDataUrl);
      setCustomFields(editingProduct.customFields || {});
    } else {
      setName('');
      setBarcode(presetBarcode || '');
      setCategory(template.categories[0] || 'General');
      setPrice('');
      setCost('');
      setStock('1');
      setMinStock('2');
      setUnit('u');
      setDescription('');
      setPhotoDataUrl(undefined);
      setCustomFields({});
    }
  }, [open, editingProduct, presetBarcode, template]);

  useEffect(() => {
    if (open && presetBarcode && !editingProduct) {
      setBarcode(presetBarcode);
    }
  }, [presetBarcode, open, editingProduct]);

  if (!open) return null;

  const activeFields = template.stockFields.filter((f) => f.enabled);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAiError(null);
    try {
      const compressed = await compressImageFile(file);
      setPhotoDataUrl(compressed);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Error al procesar foto.');
    }
  };

  const handleAnalyzeWithAI = async () => {
    if (!photoDataUrl) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await analyzeProductPhotoWithAI(photoDataUrl, settings, template);
      if (result.name) setName(result.name);
      if (result.category) setCategory(result.category);
      if (result.description) setDescription(result.description);
      if (result.suggestedPrice) setPrice(String(result.suggestedPrice));
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'No se pudo analizar la foto.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(
        {
          name: name.trim(),
          barcode: barcode.trim() || undefined,
          category: category.trim() || template.categories[0] || 'General',
          price: Number(price) || 0,
          cost: cost !== '' ? Number(cost) : undefined,
          stock: Number(stock) || 0,
          minStock: minStock !== '' ? Number(minStock) : undefined,
          unit: unit.trim() || 'u',
          description: description.trim() || undefined,
          photoDataUrl,
          driveFileId: editingProduct?.driveFileId,
          driveFolderId: editingProduct?.driveFolderId,
          customFields,
        },
        editingProduct?.id
      );
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Ficha de producto">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto en Stock'}
            </h2>
            <p className="panel-subtitle">
              Guardado offline inmediato; la foto se sincroniza con tu Google Drive al conectarte.
            </p>
          </div>
          <button type="button" className="btn btn-icon btn-ghost" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Captura de foto + Visión IA */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--surface-soft)',
                overflow: 'hidden',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              {photoDataUrl ? (
                <img src={photoDataUrl} alt="Vista previa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Camera size={24} color="var(--ink-muted)" />
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <label className="btn btn-sm" style={{ cursor: 'pointer' }}>
                  <Camera size={14} />
                  {photoDataUrl ? 'Cambiar foto' : 'Sacar / Subir foto'}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => void handlePhotoChange(e)}
                    style={{ display: 'none' }}
                  />
                </label>

                {photoDataUrl && (
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    disabled={aiLoading}
                    onClick={() => void handleAnalyzeWithAI()}
                  >
                    <Sparkles size={14} />
                    {aiLoading ? 'Analizando...' : 'Completar con IA'}
                  </button>
                )}
              </div>
              <span className="panel-subtitle">
                La foto queda en tu celular para trabajar sin internet y se sube a Drive en el próximo sync.
              </span>
            </div>
          </div>

          {aiError && <div className="notice-bar">{aiError}</div>}

          <div className="field-grid">
            <div className="field">
              <label htmlFor="prod-name">Nombre del producto</label>
              <input
                id="prod-name"
                className="input"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Mate de cerámica pintado a mano"
              />
            </div>

            <div className="field">
              <label htmlFor="prod-barcode">Código de barras (Cámara o Pistola USB)</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  id="prod-barcode"
                  data-barcode-input="true"
                  className="input mono"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="7790895..."
                />
                <button
                  type="button"
                  className="btn btn-icon"
                  title="Escanear con cámara o pistola"
                  onClick={onRequestBarcodeScan}
                >
                  <ScanBarcode size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="field-grid">
            <div className="field">
              <label htmlFor="prod-category">Categoría</label>
              <input
                id="prod-category"
                className="input"
                list="stock-categories-list"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
              <datalist id="stock-categories-list">
                {template.categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div className="field">
              <label htmlFor="prod-price">Precio de venta ({settings.currency})</label>
              <input
                id="prod-price"
                type="number"
                step="0.01"
                min={0}
                className="input mono"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="prod-cost">Costo interno (opcional)</label>
              <input
                id="prod-cost"
                type="number"
                step="0.01"
                min={0}
                className="input mono"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </div>
          </div>

          <div className="field-grid">
            <div className="field">
              <label htmlFor="prod-stock">Stock actual</label>
              <input
                id="prod-stock"
                type="number"
                className="input mono"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="prod-min">Aviso stock bajo</label>
              <input
                id="prod-min"
                type="number"
                className="input mono"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="prod-unit">Unidad</label>
              <input
                id="prod-unit"
                className="input"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="u / kg / pack"
              />
            </div>
          </div>

          {/* Campos configurables de la planilla activa */}
          {activeFields.length > 0 && (
            <div className="field-grid">
              {activeFields.map((field) => (
                <div key={field.key} className="field">
                  <label htmlFor={`prod-cf-${field.key}`}>{field.label}</label>
                  {field.type === 'select' && field.options ? (
                    <select
                      id={`prod-cf-${field.key}`}
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
                      id={`prod-cf-${field.key}`}
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
            <label htmlFor="prod-desc">Descripción (usada también para redes sociales)</label>
            <textarea
              id="prod-desc"
              className="textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Características, detalles, uso recomendado..."
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" id="btn-save-product" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : editingProduct ? 'Guardar cambios' : 'Agregar al Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
