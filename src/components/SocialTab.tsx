import { useState } from 'react';
import { Check, CloudSun, Copy, Image as ImageIcon, Share2, Sparkles } from 'lucide-react';
import type { AppSettings, Product, SheetTemplate, SocialDraft, WeatherContext } from '../types';
import { generateSocialContent } from '../services/aiProviderService';
import { formatWeatherLocationBadge } from '../services/weatherService';
import { formatCurrency } from '../utils/format';
import { dataUrlToBlob } from '../utils/image';
import { getDriveImageDirectUrl } from '../services/googleWorkspaceService';

interface SocialTabProps {
  products: Product[];
  weather: WeatherContext;
  settings: AppSettings;
  template: SheetTemplate;
  onSaveDraft: (draft: Omit<SocialDraft, 'id' | 'createdAt'>) => Promise<void>;
  onToast: (msg: string) => void;
}

export function SocialTab({
  products,
  weather,
  settings,
  template,
  onSaveDraft,
  onToast,
}: SocialTabProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [format, setFormat] = useState<SocialDraft['format']>('instagram_post');
  const [tone, setTone] = useState<SocialDraft['tone']>('cercano');
  const [includeWeatherLocation, setIncludeWeatherLocation] = useState(true);
  const [customNote, setCustomNote] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    caption: string;
    hashtags: string[];
    hook?: string;
    source: 'ai' | 'local';
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const toggleProduct = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id].slice(0, 5)
    );
  };

  const selectedProducts = products.filter((p) => selectedIds.includes(p.id));
  const weatherSummary = formatWeatherLocationBadge(weather);

  const handleGenerate = async () => {
    const targetProducts = selectedProducts.length > 0 ? selectedProducts : products.slice(0, 3);
    if (targetProducts.length === 0) {
      onToast('Cargá al menos un producto en Stock para generar contenido.');
      return;
    }

    setGenerating(true);
    try {
      const generated = await generateSocialContent({
        products: targetProducts,
        format,
        tone,
        includeWeatherLocation: includeWeatherLocation && weather.enabled,
        weather,
        settings,
        template,
        customNote: customNote.trim() || undefined,
      });
      setResult(generated);
      await onSaveDraft({
        format,
        tone,
        productIds: targetProducts.map((p) => p.id),
        includeWeatherLocation: includeWeatherLocation && weather.enabled,
        caption: generated.caption,
        hashtags: generated.hashtags,
        hook: generated.hook,
      });
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'No se pudo generar el contenido.');
    } finally {
      setGenerating(false);
    }
  };

  const fullText = result
    ? `${result.caption}\n\n${result.hashtags.join(' ')}`.trim()
    : '';

  const handleCopy = async () => {
    if (!fullText) return;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      onToast('Texto copiado al portapapeles.');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      onToast('No se pudo copiar automáticamente.');
    }
  };

  const handleNativeShare = async () => {
    if (!fullText) return;
    const primaryProduct = selectedProducts[0] || products[0];

    if (navigator.share) {
      try {
        const shareData: ShareData = {
          title: settings.businessName,
          text: fullText,
        };

        if (primaryProduct?.photoDataUrl && navigator.canShare) {
          const blob = dataUrlToBlob(primaryProduct.photoDataUrl);
          const file = new File([blob], `${primaryProduct.name.replace(/\s+/g, '_')}.jpg`, {
            type: 'image/jpeg',
          });
          if (navigator.canShare({ files: [file] })) {
            shareData.files = [file];
          }
        }

        await navigator.share(shareData);
        return;
      } catch {
        // Usuario canceló o navegador no permitió compartir archivos
      }
    }

    // Fallback directo a WhatsApp Web / App
    const waUrl = `https://wa.me/?text=${encodeURIComponent(fullText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section aria-label="Generador automático de contenido para redes">
      <div className="page-header">
        <div>
          <h1 className="page-title">Contenido para Redes</h1>
          <p className="page-desc">
            Usá tus fotos de stock, precios, hora y clima del lugar para crear publicaciones y guiones listos para compartir.
          </p>
        </div>
      </div>

      <div className="social-layout">
        {/* Configuración y selección de productos */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <h2 className="panel-title">1. Elegí productos del stock</h2>
            <p className="panel-subtitle">
              Seleccioná hasta 5 (si no elegís ninguno, toma los primeros 3 disponibles).
            </p>
          </div>

          {products.length === 0 ? (
            <div className="notice-bar">
              <span>Todavía no hay productos en Stock. Cargá alguno con foto para empezar.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
              {products.map((product) => {
                const isSelected = selectedIds.includes(product.id);
                const imgSrc =
                  product.photoDataUrl ||
                  (product.driveFileId ? getDriveImageDirectUrl(product.driveFileId, 200) : undefined);

                return (
                  <div
                    key={product.id}
                    role="button"
                    tabIndex={0}
                    className={`selectable-product ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleProduct(product.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleProduct(product.id);
                      }
                    }}
                  >
                    <div className="selectable-thumb">
                      {imgSrc ? (
                        <img src={imgSrc} alt={product.name} className="selectable-thumb" />
                      ) : (
                        <ImageIcon size={16} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{product.name}</div>
                      <div className="panel-subtitle mono" style={{ fontSize: 12 }}>
                        {formatCurrency(product.price, settings.currency)} · Stock: {product.stock}
                      </div>
                    </div>
                    {isSelected && <Check size={16} color="var(--primary)" />}
                  </div>
                );
              })}
            </div>
          )}

          <div className="field-grid">
            <div className="field">
              <label htmlFor="social-format">Formato</label>
              <select
                id="social-format"
                className="select"
                value={format}
                onChange={(e) => setFormat(e.target.value as SocialDraft['format'])}
              >
                <option value="instagram_post">Post Instagram / Facebook</option>
                <option value="reel_script">Guión Reel / TikTok (15s)</option>
                <option value="whatsapp_status">Estado de WhatsApp</option>
                <option value="fair_promo">Aviso en vivo de Feria / Puesto</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="social-tone">Estilo</label>
              <select
                id="social-tone"
                className="select"
                value={tone}
                onChange={(e) => setTone(e.target.value as SocialDraft['tone'])}
              >
                <option value="cercano">Cercano / Emprendedor</option>
                <option value="minimalista">Minimalista / Elegante</option>
                <option value="oferta">Oferta / Urgencia</option>
                <option value="informativo">Informativo / Directo</option>
              </select>
            </div>
          </div>

          <label className="notice-bar" style={{ cursor: 'pointer' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={includeWeatherLocation}
                onChange={(e) => setIncludeWeatherLocation(e.target.checked)}
              />
              <CloudSun size={15} />
              <span>
                Incluir ubicación y clima actual{' '}
                {weatherSummary ? `(${weatherSummary})` : '(activá ubicación arriba)'}
              </span>
            </span>
          </label>

          <div className="field">
            <label htmlFor="social-note">Dato extra para mencionar (opcional)</label>
            <input
              id="social-note"
              className="input"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Ej: Estamos hasta las 19 hs en Plaza Francia · 10% off efectivo"
            />
          </div>

          <button
            type="button"
            id="btn-generate-social"
            className="btn btn-primary"
            disabled={generating || products.length === 0}
            onClick={() => void handleGenerate()}
          >
            <Sparkles size={16} />
            {generating ? 'Generando publicación...' : 'Generar contenido automático'}
          </button>
        </div>

        {/* Vista previa y compartir en 1 toque */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="panel-header" style={{ marginBottom: 0 }}>
            <div>
              <h2 className="panel-title">2. Resultado listo para publicar</h2>
              <p className="panel-subtitle">
                Compartí directo a Instagram, WhatsApp o Facebook en 1 toque sin servidores externos.
              </p>
            </div>
            {result && (
              <span className="tag">
                {result.source === 'ai' ? 'Generado con IA' : 'Plantilla offline'}
              </span>
            )}
          </div>

          {!result ? (
            <div className="empty-state">
              <strong>Aún no generaste una publicación</strong>
              <p>Elegí productos a la izquierda y tocá “Generar contenido automático”.</p>
            </div>
          ) : (
            <>
              {result.hook && (
                <div className="notice-bar">
                  <span>
                    <strong>Gancho sugerido:</strong> {result.hook}
                  </span>
                </div>
              )}

              <div className="field">
                <label htmlFor="social-result-text">Texto editable</label>
                <textarea
                  id="social-result-text"
                  className="textarea"
                  style={{ minHeight: 200 }}
                  value={result.caption}
                  onChange={(e) => setResult({ ...result, caption: e.target.value })}
                />
              </div>

              {result.hashtags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {result.hashtags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-primary" onClick={() => void handleNativeShare()}>
                  <Share2 size={15} />
                  Compartir (IG / WhatsApp / Meta)
                </button>
                <button type="button" className="btn" onClick={() => void handleCopy()}>
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? 'Copiado' : 'Copiar texto'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
