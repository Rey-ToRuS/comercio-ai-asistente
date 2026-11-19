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
[███████████████████████████████████░░░░░] 88% Completado
```

| Módulo / Etapa | Estado | Porcentaje |
| :--- | :---: | :---: |
| **Etapa 1: Arquitectura Offline-First y Persistencia Local** | 🟢 Completado | 100% |
| **Etapa 2: Motor de Planillas, Stock y Libro Diario** | 🟢 Completado | 100% |
| **Etapa 3: Onboarding, Login Local y Sistema de Roles** | 🟢 Completado | 100% |
| **Etapa 4: Hub de Redes Sociales con Lógica Contextual** | 🟢 Completado | 95% |
| **Etapa 5: Accesibilidad, Audio en Español y Modo Senior** | 🟢 Completado | 90% |
| **Etapa 6: Autonomía Total (PWA instalable + APK Android con Capacitor)** | 🟡 En Progreso | 60% |

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
  ~~<span style="color:#e11d48">El audio salía con acento inglés fonético incomprensible</span>~~ **<span style="color:#16a34a">Implementado: Selección forzada y prioritaria de voces nativas en español argentino (`es-AR`) o latinoamericano (`es-419`), con cadencia pausada (rate: 0.94) y nitidez total sin fonética inglesa.</span>**
- 🟢 **Acciones en 2 toques:** Botón de 1 toque para redes y accesos directos principales en pantalla de inicio.
- 🟢 **Comando por voz prioritario:** Micrófono grande con reconocimiento de voz en español argentino (`es-AR`) y lectura de respuesta en voz alta clara.

### 🟡 Etapa 5: Empaquetado y Autonomía de Distribución
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
