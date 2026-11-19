import { useState } from 'react';
import {
  Check,
  CloudSun,
  Copy,
  Image as ImageIcon,
  Sparkles,
  Send,
  Eye,
  RefreshCw,
} from 'lucide-react';
import type { AppSettings, Product, SheetTemplate, SocialDraft, SocialPlatformId, WeatherContext } from '../types';
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
  onUpdateSettings: (newSettings: AppSettings) => Promise<void>;
  onToast: (msg: string) => void;
}

export function SocialTab({
  products,
  weather,
  settings,
  template,
  onSaveDraft,
  onUpdateSettings,
  onToast,
}: SocialTabProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [format, setFormat] = useState<SocialDraft['format']>('instagram_post');
  const [tone, setTone] = useState<SocialDraft['tone']>('cercano');
  const [previewPlatform, setPreviewPlatform] = useState<SocialPlatformId>('meta');
  const [includeWeatherLocation, setIncludeWeatherLocation] = useState(true);
  const [customNote, setCustomNote] = useState('');
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<{
    caption: string;
    hashtags: string[];
    hook?: string;
    source: 'ai' | 'local';
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const connectedSocials = settings.connectedSocials || {
    meta: false,
    tiktok: false,
    x: false,
    whatsapp: false,
  };

  const toggleSocialConnection = async (platform: SocialPlatformId) => {
    const updated = {
      ...connectedSocials,
      [platform]: !connectedSocials[platform],
    };
    await onUpdateSettings({
      ...settings,
      connectedSocials: updated,
    });
    onToast(
      updated[platform]
        ? `Canal ${platform.toUpperCase()} activado para publicación.`
        : `Canal ${platform.toUpperCase()} desactivado.`
    );
  };

  const toggleProduct = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id].slice(0, 5)
    );
  };

  const selectedProducts = products.filter((p) => selectedIds.includes(p.id));
  const activeProduct = selectedProducts[0] || products[0];
  const weatherSummary = formatWeatherLocationBadge(weather);

  const handleGenerate = async (overrideProducts?: Product[]) => {
    const targetProducts =
      overrideProducts && overrideProducts.length > 0
        ? overrideProducts
        : selectedProducts.length > 0
        ? selectedProducts
        : products.filter((p) => p.stock > 0).slice(0, 3);

    if (targetProducts.length === 0) {
      onToast('Cargá al menos un producto en Stock para generar la publicación.');
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
      onToast('¡Publicación lista! Revisá la previsualización y confirmá.');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'No se pudo armar la publicación.');
    } finally {
      setGenerating(false);
    }
  };

  // 1-Toque rápido automático (ideal para personas mayores o momentos ocupados)
  const handleQuickOneTouch = async () => {
    // Tomar un producto con stock destacado
    const inStock = products.filter((p) => p.stock > 0);
    const chosen = inStock.length > 0 ? [inStock[Math.floor(Math.random() * inStock.length)]] : products.slice(0, 1);
    if (chosen.length > 0) {
      setSelectedIds([chosen[0].id]);
    }
    await handleGenerate(chosen);
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
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onToast('No se pudo copiar automáticamente.');
    }
  };

  const handleConfirmAndPublish = async () => {
    if (!fullText) return;
    setPublishing(true);

    const primaryProduct = selectedProducts[0] || products[0];

    try {
      // 1. Intentar Web Share API nativo si está disponible
      if (navigator.share) {
        try {
          const shareData: ShareData = {
            title: settings.businessName || 'Publicación ComercioAI',
            text: fullText,
          };

          if (primaryProduct?.photoDataUrl && navigator.canShare) {
            const blob = dataUrlToBlob(primaryProduct.photoDataUrl);
            const file = new File(
              [blob],
              `${primaryProduct.name.replace(/\s+/g, '_')}.jpg`,
              { type: 'image/jpeg' }
            );
            if (navigator.canShare({ files: [file] })) {
              shareData.files = [file];
            }
          }

          await navigator.share(shareData);
          onToast('¡Publicación compartida con éxito!');
          return;
        } catch (e: unknown) {
          // Si el usuario no canceló explícitamente, continuar al fallback
          if (e instanceof Error && e.name === 'AbortError') {
            return;
          }
        }
      }

      // 2. Fallbacks directos según la plataforma activa
      await navigator.clipboard.writeText(fullText);

      if (previewPlatform === 'whatsapp') {
        const waUrl = `https://wa.me/?text=${encodeURIComponent(fullText)}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
        onToast('Abriendo WhatsApp con el texto listo...');
      } else if (previewPlatform === 'x') {
        const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullText)}`;
        window.open(xUrl, '_blank', 'noopener,noreferrer');
        onToast('Abriendo X (Twitter) con el texto listo...');
      } else if (previewPlatform === 'meta') {
        window.open('https://instagram.com', '_blank', 'noopener,noreferrer');
        onToast('Texto copiado al portapapeles. Abriendo Instagram para publicar la foto...');
      } else if (previewPlatform === 'tiktok') {
        window.open('https://tiktok.com/upload', '_blank', 'noopener,noreferrer');
        onToast('Texto copiado al portapapeles. Abriendo TikTok...');
      }
    } finally {
      setPublishing(false);
    }
  };

  const previewImgSrc =
    activeProduct?.photoDataUrl ||
    (activeProduct?.driveFileId ? getDriveImageDirectUrl(activeProduct.driveFileId, 400) : undefined);

  return (
    <section aria-label="Generador automático de contenido para redes">
      <div className="page-header">
        <div>
          <h1 className="page-title">Panel de Redes Sociales</h1>
          <p className="page-desc">
            Conectá tus canales, tocá 1 botón para armar la publicación con stock y precios reales,
            revisá la previsualización y confirmá la publicación.
          </p>
        </div>
      </div>

      {/* Franja de Canales de Redes Sociales (1 clic para activar/desactivar) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 mb-5 shadow-lg backdrop-blur">
        <div className="text-xs font-semibold text-slate-400 mb-2.5 flex items-center justify-between">
          <span>CANALES DISPONIBLES (TOCÁ PARA VINCULAR O SELECCIONAR):</span>
          <span className="text-emerald-400 font-mono text-[11px]">Cero servidores externos</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Meta */}
          <button
            type="button"
            onClick={() => void toggleSocialConnection('meta')}
            className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
              connectedSocials.meta
                ? 'border-pink-500/50 bg-pink-500/10 text-white'
                : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">📸</span>
              <div>
                <div className="text-xs font-bold leading-none">Instagram / Meta</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {connectedSocials.meta ? 'Conectado' : 'Tocar para vincular'}
                </div>
              </div>
            </div>
            {connectedSocials.meta && <Check className="h-4 w-4 text-pink-400" />}
          </button>

          {/* TikTok */}
          <button
            type="button"
            onClick={() => void toggleSocialConnection('tiktok')}
            className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
              connectedSocials.tiktok
                ? 'border-cyan-500/50 bg-cyan-500/10 text-white'
                : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🎵</span>
              <div>
                <div className="text-xs font-bold leading-none">TikTok</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {connectedSocials.tiktok ? 'Conectado' : 'Tocar para vincular'}
                </div>
              </div>
            </div>
            {connectedSocials.tiktok && <Check className="h-4 w-4 text-cyan-400" />}
          </button>

          {/* X */}
          <button
            type="button"
            onClick={() => void toggleSocialConnection('x')}
            className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
              connectedSocials.x
                ? 'border-sky-500/50 bg-sky-500/10 text-white'
                : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">𝕏</span>
              <div>
                <div className="text-xs font-bold leading-none">X (Twitter)</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {connectedSocials.x ? 'Conectado' : 'Tocar para vincular'}
                </div>
              </div>
            </div>
            {connectedSocials.x && <Check className="h-4 w-4 text-sky-400" />}
          </button>

          {/* WhatsApp */}
          <button
            type="button"
            onClick={() => void toggleSocialConnection('whatsapp')}
            className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
              connectedSocials.whatsapp
                ? 'border-emerald-500/50 bg-emerald-500/10 text-white'
                : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">💬</span>
              <div>
                <div className="text-xs font-bold leading-none">WhatsApp</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {connectedSocials.whatsapp ? 'Conectado' : 'Tocar para vincular'}
                </div>
              </div>
            </div>
            {connectedSocials.whatsapp && <Check className="h-4 w-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Botón Gigante de 1 Toque (Modo Senior / Ultra Simple) */}
      <div className="mb-5">
        <button
          type="button"
          onClick={() => void handleQuickOneTouch()}
          disabled={generating || products.length === 0}
          className="w-full flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-4 text-slate-950 font-black text-base shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50"
        >
          <Sparkles className="h-6 w-6 fill-slate-950" />
          <span>
            {generating
              ? 'ARMANDO PUBLICACIÓN CON STOCK...'
              : '⚡ TOCAR PARA ARMAR PUBLICACIÓN AUTOMÁTICA EN 1 CLIC'}
          </span>
        </button>
      </div>

      <div className="social-layout">
        {/* Panel izquierdo: Ajustes y productos seleccionados */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <h2 className="panel-title">1. Personalización de la Publicación</h2>
            <p className="panel-subtitle">
              Elegí qué producto destacar o dejá que el sistema elija automáticamente según stock.
            </p>
          </div>

          {products.length === 0 ? (
            <div className="notice-bar">
              <span>Todavía no hay productos en Stock. Cargá alguno con foto para empezar.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
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
                onChange={(e) => {
                  const val = e.target.value as SocialDraft['format'];
                  setFormat(val);
                  if (val === 'instagram_post') setPreviewPlatform('meta');
                  if (val === 'reel_script') setPreviewPlatform('tiktok');
                  if (val === 'whatsapp_status') setPreviewPlatform('whatsapp');
                }}
              >
                <option value="instagram_post">Post Instagram / Facebook</option>
                <option value="reel_script">Guión Reel / TikTok (15s)</option>
                <option value="whatsapp_status">Estado de WhatsApp</option>
                <option value="fair_promo">Aviso en vivo de Feria / Puesto</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="social-tone">Tono de voz</label>
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
                Incluir clima y barrio {weatherSummary ? `(${weatherSummary})` : '(activar arriba)'}
              </span>
            </span>
          </label>

          <div className="field">
            <label htmlFor="social-note">Detalle especial (opcional)</label>
            <input
              id="social-note"
              className="input"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Ej: Estamos en Puesto 12 hasta las 20hs · 15% en efectivo"
            />
          </div>

          <button
            type="button"
            className="btn btn-primary"
            disabled={generating || products.length === 0}
            onClick={() => void handleGenerate()}
          >
            <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Generando...' : 'Re-generar con estos filtros'}
          </button>
        </div>

        {/* Panel derecho: PREVISUALIZACIÓN REALISTA Y CONFIRMACIÓN */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="panel-header" style={{ marginBottom: 0 }}>
            <div>
              <h2 className="panel-title flex items-center gap-2">
                <Eye className="h-5 w-5 text-emerald-400" />
                2. Previsualización y Confirmación
              </h2>
              <p className="panel-subtitle">
                Visualizá exactamente cómo lo verán tus clientes en redes y publicá en 1 toque.
              </p>
            </div>
            {result && (
              <span className="tag">
                {result.source === 'ai' ? 'IA Vinculada' : 'Plantilla Offline'}
              </span>
            )}
          </div>

          {/* Selector de Mockup de Plataforma */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <span className="text-xs font-semibold text-slate-400">Ver en:</span>
            {(['meta', 'tiktok', 'x', 'whatsapp'] as SocialPlatformId[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPreviewPlatform(p)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  previewPlatform === p
                    ? 'bg-slate-700 text-white border border-slate-600'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p === 'meta' ? '📸 Instagram' : p === 'tiktok' ? '🎵 TikTok' : p === 'x' ? '𝕏 Post' : '💬 WhatsApp'}
              </button>
            ))}
          </div>

          {!result ? (
            <div className="empty-state">
              <strong>Aún no armaste una publicación</strong>
              <p>Tocá el botón superior verde o seleccioná un producto a la izquierda.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tarjeta Mockup Realista de Red Social */}
              <div className="rounded-2xl border border-slate-700 bg-slate-950 overflow-hidden shadow-2xl">
                {/* Cabecera del Post */}
                <div className="flex items-center justify-between p-3 border-b border-slate-800/80 bg-slate-900/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-xs font-bold text-white shadow">
                      {settings.businessName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white leading-none">
                        {settings.businessName}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {previewPlatform === 'meta'
                          ? 'Instagram'
                          : previewPlatform === 'tiktok'
                          ? 'TikTok'
                          : previewPlatform === 'x'
                          ? '@comercio'
                          : 'Estado de WhatsApp'}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-mono text-emerald-400">● En vivo</div>
                </div>

                {/* Foto del Producto con badge de precio si hay foto */}
                <div className="relative aspect-video sm:aspect-square max-h-72 w-full bg-slate-900 flex items-center justify-center overflow-hidden">
                  {previewImgSrc ? (
                    <img
                      src={previewImgSrc}
                      alt={activeProduct?.name || 'Producto'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <ImageIcon className="h-10 w-10 stroke-1" />
                      <span className="text-xs">Sin foto (se publicará solo con texto)</span>
                    </div>
                  )}

                  {activeProduct && (
                    <div className="absolute bottom-3 left-3 rounded-xl bg-slate-950/80 backdrop-blur-md px-3 py-1.5 border border-slate-700/60 shadow-lg">
                      <div className="text-xs font-bold text-white">
                        {activeProduct.name}
                      </div>
                      <div className="text-sm font-black text-emerald-400 font-mono">
                        {formatCurrency(activeProduct.price, settings.currency)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Contenido del texto editable */}
                <div className="p-3.5 space-y-2.5">
                  <textarea
                    rows={4}
                    value={result.caption}
                    onChange={(e) => setResult({ ...result, caption: e.target.value })}
                    className="w-full bg-transparent text-sm text-slate-200 resize-none border-none focus:outline-none focus:ring-0 leading-relaxed font-sans"
                    placeholder="Escribí o editá el texto del post..."
                  />

                  {result.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-800/80">
                      {result.hashtags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] font-medium text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Botón de Confirmación y Publicación Automática */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  disabled={publishing}
                  onClick={() => void handleConfirmAndPublish()}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 text-sm font-black text-slate-950 hover:bg-emerald-400 active:scale-[0.99] transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  <span>
                    {publishing
                      ? 'Publicando...'
                      : `CONFIRMAR Y PUBLICAR EN ${previewPlatform.toUpperCase()}`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? 'Copiado' : 'Copiar texto'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
