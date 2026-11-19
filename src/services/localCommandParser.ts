import type {
  LedgerEntry,
  MovementDirection,
  MovementType,
  ParsedAssistantAction,
  PaymentMethod,
  Product,
  SheetTemplate,
} from '../types';
import { formatCurrency, isSameDay, isSameMonth } from '../utils/format';
import { buildManualAnswerOffline, isHelpOrManualQuery } from '../data/manualKnowledgeBase';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function detectPaymentMethod(norm: string): PaymentMethod {
  if (/(transferencia|transf|mp|mercado\s*pago|alias|cbu|cvu)/.test(norm)) return 'transferencia';
  if (/(qr|billetera|modo)/.test(norm)) return 'qr';
  if (/(tarjeta|debito|credito|posnet)/.test(norm)) return 'tarjeta';
  if (/(mixto|mitad|parte en)/.test(norm)) return 'mixto';
  if (/(fiado|cuenta corriente|anota|debe)/.test(norm)) return 'cuenta_corriente';
  if (/(sin cargo|gratis|regalo|cortesia)/.test(norm)) return 'sin_cargo';
  return 'efectivo';
}

function extractMoneyAmount(raw: string): number | null {
  const norm = normalize(raw);

  // Patrones como "12 mil", "15.5 mil", "12k"
  const milMatch = norm.match(/(?:\$|\ba\b|\bpor\b|\bde\b|\bdiferencia\b|\bgaste\b|\bpague\b|\bvendi\b)?\s*(\d+(?:[.,]\d+)?)\s*(?:mil|k)\b/);
  if (milMatch) {
    const num = parseFloat(milMatch[1].replace(',', '.'));
    if (Number.isFinite(num)) return Math.round(num * 1000);
  }

  // Patrones con símbolo $ o palabras clave de monto
  const explicitMatch = norm.match(/(?:\$|pesos|monto|total|diferencia|a|por|pague|gaste|cobre|costo|precio)\s*\$?\s*(\d{1,3}(?:[.\s]\d{3})+|\d+(?:[.,]\d{1,2})?)/);
  if (explicitMatch) {
    const cleaned = explicitMatch[1].replace(/\./g, '').replace(/\s/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    if (Number.isFinite(num)) return num;
  }

  // Último número grande (>= 50) como heurística de precio
  const allNumbers = [...norm.matchAll(/\b(\d{2,7})\b/g)].map((m) => Number(m[1]));
  const bigNum = allNumbers.find((n) => n >= 50);
  return bigNum ?? null;
}

function extractQuantity(norm: string): number {
  const wordMap: Record<string, number> = {
    un: 1,
    una: 1,
    uno: 1,
    dos: 2,
    tres: 3,
    cuatro: 4,
    cinco: 5,
    seis: 6,
    siete: 7,
    ocho: 8,
    nueve: 9,
    diez: 10,
  };

  const numMatch = norm.match(/(?:vendi|vendimos|compre|ingrese|ingresaron|regale|cambie|saque|salieron|llevo|llevan)\s+(\d{1,3})\b/);
  if (numMatch) return Math.max(1, Number(numMatch[1]));

  const wordMatch = norm.match(
    /(?:vendi|vendimos|compre|ingrese|regale|cambie|saque)\s+(un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\b/
  );
  if (wordMatch) return wordMap[wordMatch[1]] || 1;

  return 1;
}

function findMatchingProduct(norm: string, products: Product[]): Product | undefined {
  // Primero coincidencia exacta de código de barras
  const barcodeHit = products.find((p) => p.barcode && norm.includes(p.barcode.toLowerCase()));
  if (barcodeHit) return barcodeHit;

  // Luego coincidencia por palabras del nombre
  let best: { product: Product; score: number } | undefined;
  for (const product of products) {
    const pNorm = normalize(product.name);
    if (norm.includes(pNorm)) {
      return product;
    }
    const tokens = pNorm.split(/\s+/).filter((t) => t.length >= 3);
    const hits = tokens.filter((t) => norm.includes(t)).length;
    if (hits > 0) {
      const score = hits / Math.max(1, tokens.length);
      if (!best || score > best.score) {
        best = { product, score };
      }
    }
  }
  return best && best.score >= 0.5 ? best.product : undefined;
}

/**
 * Motor local offline (cero internet, cero API key):
 * interpreta comandos en español natural de comerciantes para operar en ferias sin señal.
 */
export function parseCommandLocally(
  rawCommand: string,
  products: Product[],
  ledger: LedgerEntry[],
  template: SheetTemplate
): ParsedAssistantAction {
  const text = rawCommand.trim();
  const norm = normalize(text);

  // 0. Consultas de ayuda, configuración o modo de uso (Base de conocimiento del Manual)
  if (isHelpOrManualQuery(text)) {
    return {
      kind: 'answer',
      source: 'local',
      rawCommand: text,
      answer: buildManualAnswerOffline(text),
    };
  }

  // 1. Consultas rápidas ("cuanto vendi hoy", "resumen", "stock de...")
  if (/(cuanto|resumen|balance|caja|total|como vamos|cuantas ventas)/.test(norm)) {
    const isMonth = /(mes|mensual)/.test(norm);
    const filtered = ledger.filter((e) => (isMonth ? isSameMonth(e.timestamp) : isSameDay(e.timestamp)));
    const ingresos = filtered.filter((e) => e.direction === 'ingreso').reduce((acc, e) => acc + e.amount, 0);
    const egresos = filtered.filter((e) => e.direction === 'egreso').reduce((acc, e) => acc + e.amount, 0);
    const ventas = filtered.filter((e) => e.type === 'venta').length;
    const scopeLabel = isMonth ? 'este mes' : 'hoy';

    return {
      kind: 'answer',
      source: 'local',
      rawCommand: text,
      answer: `Resumen de ${scopeLabel}: ${ventas} venta(s) registrada(s). Ingresos: ${formatCurrency(
        ingresos
      )} · Egresos: ${formatCurrency(egresos)} · Balance neto: ${formatCurrency(ingresos - egresos)}.`,
    };
  }

  // 2. Alta rápida de producto ("agregar producto...", "nuevo producto...", "cargar stock...")
  if (/^(agregar|nuevo|cargar|crear|alta)\s+(producto|articulo|item|stock)/.test(norm)) {
    const amount = extractMoneyAmount(text) ?? 0;
    const qtyMatch = norm.match(/(?:stock|cantidad|unidades|u)\s*(?:de)?\s*(\d+)/);
    const stock = qtyMatch ? Number(qtyMatch[1]) : 1;
    const cleanName = text
      .replace(/^(agregar|nuevo|cargar|crear|alta)\s+(producto|articulo|item|stock)\s*/i, '')
      .replace(/\b(a|por|precio|stock|cantidad|unidades)\b.*$/i, '')
      .trim();

    return {
      kind: 'product',
      confidence: cleanName ? 'high' : 'medium',
      source: 'local',
      rawCommand: text,
      summary: `Alta de producto: ${cleanName || 'Nuevo producto'} (${stock} u. · ${formatCurrency(amount)})`,
      data: {
        name: cleanName || 'Nuevo producto',
        category: template.categories[0] || 'General',
        price: amount,
        stock,
        unit: 'u',
        description: text,
      },
    };
  }

  // 3. Movimientos de Libro Diario (venta, cambio, regalo, gasto, proveedor, devolución, retiro)
  const matchedProduct = findMatchingProduct(norm, products);
  const quantity = extractQuantity(norm);
  let amount = extractMoneyAmount(text);

  let type: MovementType = 'venta';
  let direction: MovementDirection = 'ingreso';
  let reason = template.movementReasons[0] || 'Venta';

  if (/(regale|regalo|cortesia|obsequi|muestra|degustacion|canje)/.test(norm)) {
    type = 'regalo';
    direction = 'neutro';
    reason = 'Regalo / cortesía';
    amount = 0;
  } else if (/(cambie|cambio|permuta|troque)/.test(norm)) {
    type = 'cambio';
    direction = amount && amount > 0 ? 'ingreso' : 'neutro';
    reason = 'Cambio de producto';
    amount = amount ?? 0;
  } else if (/(devolucion|devolvio|reintegro|reembolso)/.test(norm)) {
    type = 'devolucion';
    direction = 'egreso';
    reason = 'Devolución';
  } else if (/(proveedor|mayorista|distribuidor|reponer|reposicion|compre\s+mercaderia|compra\s+insumos)/.test(norm)) {
    type = 'proveedor';
    direction = 'egreso';
    reason = 'Compra a proveedor';
  } else if (/(retiro|retire|saque\s+de\s+caja)/.test(norm)) {
    type = 'retiro';
    direction = 'egreso';
    reason = 'Retiro de caja';
  } else if (/(gasto|gaste|pague|compre|alquiler|canon|bolsas|hielo|nafta|viatico|luz|envio|flete)/.test(norm)) {
    type = 'gasto_general';
    direction = 'egreso';
    reason = 'Gasto general';
  } else if (/(ingreso\s+extra|aporte|cambio\s+inicial|caja\s+inicial)/.test(norm)) {
    type = 'ingreso_extra';
    direction = 'ingreso';
    reason = 'Ingreso extra';
  }

  // Si fue venta/regalo con producto encontrado y no se dictó precio, usar precio de stock * cantidad
  if (amount === null && matchedProduct && (type === 'venta' || type === 'devolucion')) {
    amount = matchedProduct.price * quantity;
  }

  // Detectar si dijo "cada uno / c/u" para multiplicar por cantidad
  if (amount !== null && quantity > 1 && /(cada\s+un|c\/u|por\s+unidad)/.test(norm)) {
    amount = amount * quantity;
  }

  const finalAmount = amount ?? 0;
  const paymentMethod: PaymentMethod =
    type === 'regalo' || (type === 'cambio' && finalAmount === 0) ? 'sin_cargo' : detectPaymentMethod(norm);

  const supplierMatch = text.match(/(?:proveedor|distribuidor|a\s+don|a\s+lo\s+de)\s+([A-Za-zÁÉÍÓÚÑáéíóúñ0-9\s]{2,28})/i);
  const counterparty = supplierMatch ? supplierMatch[1].trim() : undefined;

  const summaryPrefix =
    type === 'venta'
      ? 'Venta'
      : type === 'regalo'
      ? 'Regalo / salida sin cargo'
      : type === 'cambio'
      ? 'Cambio'
      : type === 'proveedor'
      ? 'Pago a proveedor'
      : type === 'gasto_general'
      ? 'Gasto general'
      : 'Movimiento';

  return {
    kind: 'movement',
    confidence: finalAmount > 0 || type === 'regalo' || type === 'cambio' ? 'high' : 'medium',
    source: 'local',
    rawCommand: text,
    summary: `${summaryPrefix}: ${matchedProduct ? `${quantity}× ${matchedProduct.name}` : text} · ${formatCurrency(
      finalAmount
    )}`,
    data: {
      direction,
      type,
      reason,
      description: matchedProduct ? `${quantity}× ${matchedProduct.name}` : text,
      amount: finalAmount,
      paymentMethod,
      productId: matchedProduct?.id,
      productName: matchedProduct?.name,
      quantity: matchedProduct ? quantity : undefined,
      counterparty,
      notes: text,
    },
  };
}
