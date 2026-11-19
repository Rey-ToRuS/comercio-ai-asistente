# ComercioAI — Asistente Comercial Offline-First & IA

Asistente automatizado comandado por **voz, texto y código de barras** (cámara del celular + pistola USB/OTG) para comerciantes, puestos y ferias.

- **100% Offline-First:** Persistencia local en `IndexedDB` + cola automática de sincronización.
- **Cero ARCA / Cero servidores propios:** Control interno exhaustivo (Libro Diario, Stock, Gastos, Proveedores, Cambios, Regalos, Pagos Mixtos).
- **6 Planillas editables por tipo de negocio:** Feria/Artesanías, Kiosco/Almacén, Indumentaria/Calzado, Gastronomía/Puesto, Servicios/Taller y Comercio General.
- **IA y Nube intercambiables:** Google Gemini, Meta Llama (Groq), OpenAI o Motor Local Offline + integración directa con Google Drive, Sheets y Docs.
- **Contenido automático para redes:** Usa fotos reales del stock + hora, clima y ubicación (Open-Meteo) + compartir en 1 toque.
- **Manual integrado:** Consultable offline y por voz/texto directo en el Asistente (ver [`MANUAL_DE_USO.md`](./MANUAL_DE_USO.md)).

## Despliegue rápido en Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/import?s=https://github.com/Rey-ToRuS/comercio-ai-asistente)

## Desarrollo local

```bash
npm install
npm run dev
```

## Build de producción

```bash
npm run build
```
