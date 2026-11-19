import { useMemo, useState } from 'react';
import { Download, Image as ImageIcon, Pencil, Plus, ScanBarcode, Trash2 } from 'lucide-react';
import type { AppSettings, Product, SheetTemplate } from '../types';
import { exportStockToCsv, formatCurrency } from '../utils/format';
import { getDriveImageDirectUrl } from '../services/googleWorkspaceService';

interface StockTabProps {
  products: Product[];
  settings: AppSettings;
  template: SheetTemplate;
  onAddNew: () => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => Promise<void>;
  onAdjustStock: (product: Product, delta: number) => Promise<void>;
  onQuickSell: (product: Product) => void;
  onOpenScanner: () => void;
}

export function StockTab({
  products,
  settings,
  template,
  onAddNew,
  onEdit,
  onDelete,
  onAdjustStock,
  onQuickSell,
  onOpenScanner,
}: StockTabProps) {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = useMemo(() => {
    const set = new Set<string>(template.categories);
    products.forEach((p) => set.add(p.category));
    return Array.from(set);
  }, [products, template.categories]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (q) {
        const hay = `${p.name} ${p.barcode || ''} ${p.category} ${p.description || ''} ${Object.values(
          p.customFields || {}
        ).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [products, categoryFilter, query]);

  return (
    <section aria-label="Inventario y catálogo de productos">
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock y Productos</h1>
          <p className="page-desc">
            Cargá productos con foto y código de barras. Los campos se adaptan a tu planilla de {template.name}.
          </p>
        </div>

        <div className="page-actions">
          <button type="button" className="btn btn-sm" onClick={onOpenScanner}>
            <ScanBarcode size={14} />
            Escanear
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => exportStockToCsv(products, template)}
            disabled={products.length === 0}
          >
            <Download size={14} />
            CSV
          </button>
          <button type="button" id="btn-stock-add" className="btn btn-primary btn-sm" onClick={onAddNew}>
            <Plus size={15} />
            Nuevo Producto
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <input
          className="input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, código de barras o campo personalizado..."
        />
        <select
          className="select"
          style={{ width: 'auto', minWidth: 165 }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="panel empty-state">
          <strong>Tu stock está vacío</strong>
          <p>
            Agregá productos con foto (podés usar la IA para completarlos) o escaneá un código de barras con el celular o pistola USB.
          </p>
        </div>
      ) : (
        <div className="stock-grid">
          {filtered.map((product) => {
            const imgSrc =
              product.photoDataUrl ||
              (product.driveFileId ? getDriveImageDirectUrl(product.driveFileId) : undefined);
            const isLow = product.minStock !== undefined && product.stock <= product.minStock;
            const customEntries = template.stockFields
              .filter((f) => f.enabled && product.customFields?.[f.key])
              .slice(0, 2);

            return (
              <article key={product.id} className="product-card">
                <div className="product-thumb">
                  {imgSrc ? (
                    <img src={imgSrc} alt={product.name} loading="lazy" />
                  ) : (
                    <ImageIcon size={28} />
                  )}
                  <span className="product-thumb-badge">{product.category}</span>
                </div>

                <div className="product-body">
                  <div>
                    <h3 className="product-title">{product.name}</h3>
                    {product.barcode && (
                      <div className="panel-subtitle mono" style={{ fontSize: 11.5 }}>
                        COD: {product.barcode}
                      </div>
                    )}
                  </div>

                  {customEntries.length > 0 && (
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {customEntries.map((f) => (
                        <span key={f.key} className="tag">
                          {f.label}: {product.customFields[f.key]}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="product-price-row" style={{ marginTop: 'auto' }}>
                    <span className="product-price mono">
                      {formatCurrency(product.price, settings.currency)}
                    </span>

                    <div className="stock-stepper" aria-label="Ajustar stock">
                      <button
                        type="button"
                        onClick={() => void onAdjustStock(product, -1)}
                        disabled={product.stock <= 0}
                        aria-label="Restar stock"
                      >
                        −
                      </button>
                      <span className="mono" style={{ color: isLow ? 'var(--expense)' : 'inherit' }}>
                        {product.stock}
                      </span>
                      <button
                        type="button"
                        onClick={() => void onAdjustStock(product, 1)}
                        aria-label="Sumar stock"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      style={{ flex: 1 }}
                      onClick={() => onQuickSell(product)}
                    >
                      Vender
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-icon"
                      onClick={() => onEdit(product)}
                      aria-label="Editar producto"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-icon"
                      onClick={() => void onDelete(product.id)}
                      aria-label="Eliminar producto"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
