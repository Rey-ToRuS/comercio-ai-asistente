# 📊 Roadmap de Desarrollo y Seguimiento de Avance — ComercioAI

> **Norma estricta de actualización:** Nunca se borra lo que se realizó o planificó previamente. Cuando algo se modifica o corrige, el texto previo se tacha en rojo (`~~<span style="color:#e11d48">texto</span>~~`) y a continuación se agrega la corrección en color verde (`**<span style="color:#16a34a">corrección</span>**`).

---

## 🚦 Sistema de Colores Universal (Semáforo)
- 🟢 **VERDE:** Completado, probado y 100% operativo.
- 🟡 **AMARILLO:** En desarrollo activo o en fase de optimización.
- 🔴 **ROJO:** Planificado / Pendiente de inicio o requiere atención.

---

## 📈 Gráfico de Porcentaje de Avance General

```text
[████████████████████████████████████████] 99% Completado
```

| Módulo / Etapa | Estado | Porcentaje |
| :--- | :---: | :---: |
| **Etapa 1: Arquitectura Offline-First y Persistencia Local** | 🟢 Completado | 100% |
| **Etapa 2: Motor de Planillas, Stock y Libro Diario** | 🟢 Completado | 100% |
| **Etapa 3: Onboarding, Login Local y Sistema de Roles** | 🟢 Completado | 100% |
| **Etapa 4: Hub de Redes Sociales con Lógica Contextual** | 🟢 Completado | 100% |
| **Etapa 5: Accesibilidad, Audio en Español y Modo Senior** | 🟢 Completado | 100% |
| **Etapa 6: Pizarra de Divisas en Vivo (Dólar, Euro, Real) & POS Pro** | 🟢 Completado | 100% |
| **Etapa 7: Autonomía Total (PWA instalable + APK Android con Capacitor)** | 🟢 Completado | 95% |

---

## 🗓️ Desglose Detallado por Etapas

### 🟢 Etapa 1: Núcleo Autónomo Offline-First (Base del Sistema)
- 🟢 **IndexedDB local (Dexie.js):** Almacenamiento seguro en el dispositivo sin requerir servidor central.
- 🟢 **Cero ARCA / Cero Servidores ajenos:** La información del comerciante no viaja a ninguna base pública obligatoria.
- 🟢 **Escáner dual:** Soporte para cámara del dispositivo y pistolas lectoras USB / OTG.
- 🟢 **Comandos por voz y texto:** Asistente integrado con procesamiento local offline y respaldo con IA.
- 🟢 **Contexto climático y ubicación:** Integración automática mediante Open-Meteo (sin API key paga).

### 🟢 Etapa 2: Onboarding Inicial, Autonomía y Gestión de Roles
- 🟢 **Selección de 6 tipos de negocio:** Feria, Kiosco, Indumentaria, Gastronomía, Servicios y Comercio General con carga de plantillas automáticas.
- 🟢 **Asistente de primer inicio (Onboarding Wizard):**
  ~~<span style="color:#e11d48">Asistente de primer inicio pendiente de desarrollo</span>~~ **<span style="color:#16a34a">Implementado (`OnboardingModal.tsx`): 4 pasos guiados para Email de identificación local, Vinculación de IA (Local, Gemini, Groq, OpenAI), Selección de Tipo de Negocio y Rol inicial.</span>**
- 🟢 **Sistema de 3 Roles de Usuario:**
  - 🛡️ **Administrador:** Acceso completo a caja, configuración de costos, edición de plantillas y borrado.
  - 🏷️ **Vendedor:** Interfaz de mostrador ultra-simplificada (vender, escanear, consultar stock y registrar ventas).
  - 📑 **Administrativo:** Carga de gastos, facturas de proveedores, reposición de mercadería y balances.
- 🟢 **Conmutador rápido en TopBar y PIN de Administrador:**
  ~~<span style="color:#e11d48">Bloqueo / Conmutador rápido por PIN simple pendiente</span>~~ **<span style="color:#16a34a">Implementado: selector de roles en la barra superior con validación de PIN de 4 dígitos para regresar al rol de Administrador.</span>**

### 🟢 Etapa 3: Hub de Redes Sociales con Lógica Contextual Inteligente
- 🟢 **Generador inteligente con stock real:** Redacción de publicaciones tomando productos reales, precios, stock y clima.
- 🟢 **Motor Contextual de Clima, Hora y Rubro (`contextEngine.ts`):**
  ~~<span style="color:#e11d48">Publicaciones solo tomaban primeros productos sin lógica climática o situacional</span>~~ **<span style="color:#16a34a">Implementado: Detección de temperatura (ej: calor sofocante >30°C en Kiosco/Almacén prioriza automáticamente bebidas frías, gaseosas, hielo y helados del stock real, con ganchos y copys adaptados al momento).</span>**
- 🟢 **Panel de Conexión a Redes Sociales:**
  ~~<span style="color:#e11d48">Conexiones pendientes</span>~~ **<span style="color:#16a34a">Implementado: Botones de 1 clic para activar/vincular Meta (Instagram/Facebook), TikTok, X (Twitter) y WhatsApp.</span>**
- 🟢 **Flujo de 1 toque con previsualización interactiva:**
  ~~<span style="color:#e11d48">Generación de texto simple con botón de copiar al portapapeles</span>~~ **<span style="color:#16a34a">Implementado: Botón gigante de 1 toque ('⚡ TOCAR PARA ARMAR PUBLICACIÓN SEGÚN CLIMA Y STOCK'), mockup realista de feed, badge de precio/stock sobre la foto y botón de 'CONFIRMAR Y PUBLICAR AUTOMÁTICAMENTE' con soporte Web Share nativo.</span>**

### 🟢 Etapa 4: Accesibilidad, Audio en Español Nítido y Modo Senior
- 🟢 **Síntesis de Voz en Español Argentino / Latinoamericano (`speechService.ts`):**
  ~~<span style="color:#e11d48">El audio salía con acento inglés fonético incomprensible</span>~~ **<span style="color:#16a34a">Implementado: Detección y selección automática de voces en español argentino (`es-AR`) y latinoamericano (`es-419`, `es-MX`, `es-US`). En Windows, se evita forzar a Microsoft David y se añade banner con recomendación de 1 clic para Microsoft Edge (voces naturales de Tomás y Salomé sin instalar nada) o agregar el paquete en Windows.</span>**
- 🟢 **Modo Senior / Alta Accesibilidad y Letra Grande:**
  ~~<span style="color:#e11d48">Interfaz en tamaño estándar sin ajuste para adultos mayores</span>~~ **<span style="color:#16a34a">Implementado: Botón en barra superior 'Modo Fácil' con tipografía ampliada (17.5px+), botones táctiles de mínimo 48px y alto contraste para personas grandes con poca experiencia tecnológica.</span>**
- 🟢 **Acciones en 2 toques:** Botón de 1 toque para redes y accesos directos principales en pantalla de inicio.
- 🟢 **Comando por voz y texto prioritario:** Micrófono grande con reconocimiento de voz en español argentino (`es-AR`), campo de texto para consultas escritas y lectura de respuesta en voz alta clara.

### 🟢 Etapa 5: Pizarra de Divisas en Vivo (Dólar, Euro, Real) & Diseño Terminal POS Pro
- 🟢 **Pizarra de Cotizaciones en Vivo (`currencyService.ts` & `CurrencyTab.tsx`):**
  ~~<span style="color:#e11d48">La aplicación no contaba con cotizaciones de divisas extranjeras</span>~~ **<span style="color:#16a34a">Implementado: Pizarra de cambios en vivo estilo Dólar Hoy / Dolarito conectada a DolarApi con Dólar Blue, Oficial, MEP, Tarjeta, Euro y Real Brasileño (BRL), con guardado en caché local para operar 100% offline.</span>**
- 🟢 **Calculadora Rápida para Cobro en Mostrador:**
  ~~<span style="color:#e11d48">Conversión manual en calculadora externa</span>~~ **<span style="color:#16a34a">Implementado: Conversor bidireccional rápido (ARS, USD, EUR, BRL) con selección de tipo de cambio, inversión de monedas con 1 toque y botón para registrar la venta directamente en el Libro Diario.</span>**
- 🟢 **Ticker de Cotizaciones en Barra Superior:**
  ~~<span style="color:#e11d48">Sin visibilidad de cotizaciones desde otras pestañas</span>~~ **<span style="color:#16a34a">Implementado: Botón en TopBar mostrando Dólar Blue y Real Brasileño con acceso directo a la Pizarra en 1 clic.</span>**

### 🟢 Etapa 6: Empaquetado y Autonomía de Distribución
- 🟢 **PWA (Progressive Web App):** Manifiesto y Service Worker preparados para instalar como aplicación en el celular o PC.
- 🟢 **Capacitor Configurado:** Base lista para compilar como archivo `.apk` de Android instalable directamente por cable USB o descarga directa.
- 🟢 **Aclaración de Infraestructura:**
  ~~<span style="color:#e11d48">Despliegue obligatorio y permanente en servidor público Vercel</span>~~ **<span style="color:#16a34a">Vercel es 100% opcional (solo sirve de descarga inicial web). La app terminada funciona de forma autónoma instalada en el dispositivo (PWA o APK) sin requerir conexión a Vercel ni a servidores externos.</span>**

---

## 📝 Historial de Correcciones y Evolución (Regla de No Borrado)

- **2026-11-19 (Inicio):** Restauración del código fuente original desde `comercio-ai.bundle`.
- **2026-11-19 (Infraestructura):**
  ~~<span style="color:#e11d48">Se consideraba que la app requería una cuenta activa y conexión continua con Vercel para funcionar</span>~~ **<span style="color:#16a34a">Se define arquitectura de Autonomía Total: la aplicación es una PWA / APK que se instala en el dispositivo del usuario, almacena todo en IndexedDB local y no depende de servidores de terceros para operar día a día.</span>**
- **2026-11-19 (Funcionalidades Clave):**
  ~~<span style="color:#e11d48">Configuración dispersa en pestaña de ajustes</span>~~ **<span style="color:#16a34a">Se implementó el Wizard de Onboarding Inicial en primer inicio con Email + Vinculación de IA + Tipo de Negocio + Asignación de Roles (Admin, Vendedor, Administrativo) y PIN de seguridad.</span>**
- **2026-11-19 (Redes Sociales y Lógica Contextual):**
  ~~<span style="color:#e11d48">Generación de texto simple con botón de copiar al portapapeles</span>~~ **<span style="color:#16a34a">Se implementó el panel con vinculación a Meta, TikTok, X y WhatsApp, botón de 1 toque con stock real, previsualización interactiva con mockup realista y confirmación de publicación automática.</span>**
  ~~<span style="color:#e11d48">Publicaciones sin noción de temperatura u oportunidad comercial</span>~~ **<span style="color:#16a34a">Se incorporó `contextEngine.ts` para que si hace 34°C en la ciudad se prioricen automáticamente bebidas frías, helados y hielo del stock real, adaptándose de inmediato al rubro.</span>**
- **2026-11-19 (Corrección de Audio e Idioma):**
  ~~<span style="color:#e11d48">Audio con voz en inglés por defecto que no se entendía</span>~~ **<span style="color:#16a34a">Se implementó `speechService.ts` forzando voces nativas en español argentino (es-AR) o latinoamericano con dicción limpia y velocidad calibrada.</span>**
- **2026-11-19 (Entrada de Texto y Consultas en Asistente):**
  ~~<span style="color:#e11d48">Asistente en vista previa interactiva solo permitía pulsar el micrófono o chips fijos</span>~~ **<span style="color:#16a34a">Se incorporó campo de texto dedicado con botón de envío y procesamiento en tiempo real (extracciones de montos, medios de pago QR/transferencia/efectivo, gastos, ventas y consultas de balance en caja).</span>**
- **2026-11-19 (Diagnóstico de Voz en PC con Windows & Modo Senior):**
  ~~<span style="color:#e11d48">En PC Windows sin paquete de idioma español instalado se forzaba la voz inglesa Microsoft David</span>~~ **<span style="color:#16a34a">Se incorporó diagnóstico reactivo de voz: auto-selección de voces en español disponibles, prevención de fonética inglesa y guía de 1 clic para abrir en Microsoft Edge (que ya incluye voces argentinas y latinas ultra-naturales) o agregar el paquete en Windows. Se sumó además el 'Modo Fácil / Senior' en la barra superior con tipografía grande y alta visibilidad para personas mayores.</span>**
- **2026-11-19 (Pizarra de Cotizaciones en Vivo & Terminal Táctil POS Pro):**
  ~~<span style="color:#e11d48">Sin sección de cotizaciones de moneda extranjera para atención de mostrador</span>~~ **<span style="color:#16a34a">Se implementó la 'Pizarra de Divisas' estilo Terminal Táctil POS Pro: integración en vivo con DolarApi para Dólar (Blue, Oficial, MEP, Tarjeta), Euro y Real Brasileño con compra/venta, ticker en barra superior y Calculadora de Conversión para cobro a turistas/clientes con registro directo en Libro Diario.</span>**

