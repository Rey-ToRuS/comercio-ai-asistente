import { useState, useEffect } from 'react';
import {
  DollarSign,
  RefreshCw,
  Calculator,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Wifi,
  WifiOff,
  ShoppingBag,
} from 'lucide-react';
import type { AppSettings, Product } from '../types';
import {
  type CurrencySnapshot,
  fetchLiveCurrencies,
  getCachedCurrencies,
  calculateCurrencyConversion,
} from '../services/currencyService';

interface CurrencyTabProps {
  settings?: AppSettings;
  products?: Product[];
  onOpenQuickSale?: (amountInPesos: number, description: string) => void;
}

export function CurrencyTab({ onOpenQuickSale }: CurrencyTabProps) {
  const [snapshot, setSnapshot] = useState<CurrencySnapshot>(() => getCachedCurrencies());
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  // Estados de la calculadora conversora de mostrador
  const [calcAmount, setCalcAmount] = useState<string>('10000');
  const [calcFrom, setCalcFrom] = useState<'ARS' | 'USD' | 'EUR' | 'BRL'>('ARS');
  const [calcTo, setCalcTo] = useState<'ARS' | 'USD' | 'EUR' | 'BRL'>('BRL');
  const [selectedUsdType, setSelectedUsdType] = useState<string>('blue');
  const [copiedNotice, setCopiedNotice] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchLiveCurrencies();
      setSnapshot(data);
      setLastRefreshed(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000 * 5); // actualizar cada 5 minutos
    return () => clearInterval(interval);
  }, []);

  const conversion = calculateCurrencyConversion({
    amount: parseFloat(calcAmount) || 0,
    from: calcFrom,
    to: calcTo,
    rates: snapshot.rates,
    preferredUsdType: selectedUsdType,
  });

  const usdBlue = snapshot.rates.find((r) => r.id === 'usd-blue');
  const usdOficial = snapshot.rates.find((r) => r.id === 'usd-oficial');
  const euro = snapshot.rates.find((r) => r.code === 'EUR');
  const real = snapshot.rates.find((r) => r.code === 'BRL');

  const otherUsds = snapshot.rates.filter((r) => r.code === 'USD' && r.id !== 'usd-blue' && r.id !== 'usd-oficial');

  const swapCalcCurrencies = () => {
    const prevFrom = calcFrom;
    setCalcFrom(calcTo);
    setCalcTo(prevFrom);
  };

  const handleCopyResult = () => {
    navigator.clipboard.writeText(String(conversion.result));
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2000);
  };

  const formatPrice = (val: number) => {
    return val.toLocaleString('es-AR', { minimumFractionDigits: val % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-6 animate-fade-in" style={{ paddingBottom: 60 }}>
      {/* Encabezado POS Pro de Pizarra de Divisas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-700 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <DollarSign size={13} />
            Pizarra de Divisas en Vivo · Dólar Hoy & Dolarito
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Cotizaciones de Mostrador
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Precios de compra y venta actualizados al instante para Dólar (Blue, Oficial, MEP), Euro y Real Brasileño.
            100% operativo sin internet con última caché guardada.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              {snapshot.isOnline ? (
                <span className="flex items-center gap-1 text-emerald-400">
                  <Wifi size={13} /> En vivo
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-400">
                  <WifiOff size={13} /> Caché Offline
                </span>
              )}
            </div>
            <div className="text-slate-500 text-[11px] flex items-center gap-1 justify-end">
              <Clock size={11} /> {lastRefreshed ? `Actualizado ${lastRefreshed}` : 'Cargado'}
            </div>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition flex items-center gap-2 shadow active:scale-95 disabled:opacity-50"
            title="Refrescar cotizaciones ahora"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-emerald-400' : ''} />
            <span>{loading ? 'Buscando...' : 'Actualizar'}</span>
          </button>
        </div>
      </div>

      {/* Tarjetas Principales de Mostrador (Dólar Blue, Real Brasileño, Euro, Dólar Oficial) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* DÓLAR BLUE (DESTACADO COMERCIAL) */}
        {usdBlue && (
          <div className="rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-b from-slate-900 to-emerald-950/20 p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-2 right-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950">
                Principal
              </span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">💙</span>
              <div>
                <h3 className="text-base font-black text-white">{usdBlue.name}</h3>
                <span className="text-xs text-slate-400">Mercado Libre / Informal</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-center">
              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Compra</span>
                <span className="text-lg sm:text-xl font-black text-slate-200 font-mono">
                  ${formatPrice(usdBlue.buy)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <span className="text-[10px] font-bold uppercase text-emerald-400 block">Venta</span>
                <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
                  ${formatPrice(usdBlue.sell)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* REAL BRASILEÑO */}
        {real && (
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-lg relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🇧🇷</span>
              <div>
                <h3 className="text-base font-black text-white">{real.name}</h3>
                <span className="text-xs text-slate-400">Turismo & Frontera (BRL)</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-center">
              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Compra</span>
                <span className="text-lg sm:text-xl font-black text-slate-200 font-mono">
                  ${formatPrice(real.buy)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/30">
                <span className="text-[10px] font-bold uppercase text-sky-400 block">Venta</span>
                <span className="text-lg sm:text-xl font-black text-sky-400 font-mono">
                  ${formatPrice(real.sell)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* EURO OFICIAL */}
        {euro && (
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-lg relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">💶</span>
              <div>
                <h3 className="text-base font-black text-white">{euro.name}</h3>
                <span className="text-xs text-slate-400">Unión Europea (EUR)</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-center">
              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Compra</span>
                <span className="text-lg sm:text-xl font-black text-slate-200 font-mono">
                  ${formatPrice(euro.buy)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
                <span className="text-[10px] font-bold uppercase text-indigo-400 block">Venta</span>
                <span className="text-lg sm:text-xl font-black text-indigo-400 font-mono">
                  ${formatPrice(euro.sell)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* DÓLAR OFICIAL */}
        {usdOficial && (
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-lg relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🏛️</span>
              <div>
                <h3 className="text-base font-black text-white">{usdOficial.name}</h3>
                <span className="text-xs text-slate-400">Banco Nación (BNA)</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-center">
              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Compra</span>
                <span className="text-lg sm:text-xl font-black text-slate-200 font-mono">
                  ${formatPrice(usdOficial.buy)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Venta</span>
                <span className="text-lg sm:text-xl font-black font-mono">
                  ${formatPrice(usdOficial.sell)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CALCULADORA DE COBRO Y CONVERSIÓN EN MOSTRADOR */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Calculator className="text-emerald-400" size={20} />
            <h2 className="text-lg font-black text-white">
              Calculadora Rápida para Cobro en Mostrador (Turistas / Clientes)
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold">Ref. Dólar:</span>
            <select
              value={selectedUsdType}
              onChange={(e) => setSelectedUsdType(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-emerald-400 font-bold rounded-lg px-2 py-1 text-xs focus:outline-none"
            >
              <option value="blue">💙 Blue ($1.640)</option>
              <option value="oficial">🏛️ Oficial ($1.585)</option>
              <option value="bolsa">📈 MEP ($1.605)</option>
              <option value="tarjeta">💳 Tarjeta ($2.150)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Monto de entrada */}
          <div className="lg:col-span-5 space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase">
              Monto a Convertir:
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={calcAmount}
                onChange={(e) => setCalcAmount(e.target.value)}
                placeholder="Ej: 10000"
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-lg font-mono font-bold text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <select
                value={calcFrom}
                onChange={(e) => setCalcFrom(e.target.value as any)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-3 text-sm font-bold text-emerald-400 focus:outline-none"
              >
                <option value="ARS">🇦🇷 Pesos (ARS)</option>
                <option value="USD">💵 Dólar (USD)</option>
                <option value="EUR">💶 Euro (EUR)</option>
                <option value="BRL">🇧🇷 Real (BRL)</option>
              </select>
            </div>
          </div>

          {/* Botón de Invertir Monedas */}
          <div className="lg:col-span-2 flex justify-center">
            <button
              type="button"
              onClick={swapCalcCurrencies}
              className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center justify-center transition active:scale-95 shadow"
              title="Invertir monedas"
            >
              <ArrowRightLeft size={18} />
            </button>
          </div>

          {/* Monto de salida / resultado */}
          <div className="lg:col-span-5 space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase">
              Resultado al Tipo de Cambio Actual:
            </label>
            <div className="flex gap-2">
              <div className="flex-1 rounded-xl border border-emerald-500/40 bg-slate-950 px-4 py-3 flex items-center justify-between">
                <span className="text-xl font-mono font-black text-emerald-400">
                  {calcTo === 'ARS' ? '$' : calcTo === 'USD' ? 'U$D ' : calcTo === 'EUR' ? '€ ' : 'R$ '}
                  {conversion.result.toLocaleString('es-AR')}
                </span>
                <span className="text-xs text-slate-400 font-semibold">{calcTo}</span>
              </div>
              <select
                value={calcTo}
                onChange={(e) => setCalcTo(e.target.value as any)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-3 text-sm font-bold text-emerald-400 focus:outline-none"
              >
                <option value="BRL">🇧🇷 Real (BRL)</option>
                <option value="USD">💵 Dólar (USD)</option>
                <option value="EUR">💶 Euro (EUR)</option>
                <option value="ARS">🇦🇷 Pesos (ARS)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Detalle del cambio utilizado y atajos */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-400">
            Cotización aplicada:{' '}
            <strong className="text-white font-mono">{conversion.rateLabel}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyResult}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold transition flex items-center gap-1.5"
            >
              {copiedNotice ? <CheckCircle2 size={13} className="text-emerald-400" /> : null}
              <span>{copiedNotice ? '¡Copiado!' : 'Copiar Resultado'}</span>
            </button>

            {onOpenQuickSale && (
              <button
                type="button"
                onClick={() => {
                  const pesos = calcTo === 'ARS' ? conversion.result : parseFloat(calcAmount) || 0;
                  onOpenQuickSale(pesos, `Cobro en divisa (${calcFrom} a ${calcTo})`);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black transition flex items-center gap-1.5 shadow"
              >
                <ShoppingBag size={13} />
                <span>Registrar Venta de Caja</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Otras Cotizaciones (Dólar Tarjeta, MEP, Cripto) */}
      {otherUsds.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Otras Cotizaciones Financieras (Dólar MEP, Tarjeta y Cripto):
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {otherUsds.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-900 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{item.flag}</span>
                  <div>
                    <div className="text-xs font-bold text-white">{item.name}</div>
                    <div className="text-[11px] text-slate-400">Compra: ${formatPrice(item.buy)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Venta</span>
                  <span className="text-sm font-mono font-black text-emerald-400">${formatPrice(item.sell)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
