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
[███████████████████████████████░░░░░░░░░] 78% Completado
```

| Módulo / Etapa | Estado | Porcentaje |
| :--- | :---: | :---: |
| **Etapa 1: Arquitectura Offline-First y Persistencia Local** | 🟢 Completado | 100% |
| **Etapa 2: Motor de Planillas, Stock y Libro Diario** | 🟢 Completado | 100% |
| **Etapa 3: Onboarding, Login Local y Sistema de Roles** | 🟢 Completado | 95% |
| **Etapa 4: Hub de Redes Sociales (1 Toque + Previsualización)** | 🟢 Completado | 90% |
| **Etapa 5: Accesibilidad y Modo Senior (Interfaz Ultra-Simple)** | 🟡 En Progreso | 65% |
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

### 🟢 Etapa 3: Hub de Redes Sociales Automatizado (1 Toque)
- 🟢 **Generador inteligente con stock real:** Redacción de publicaciones tomando productos reales, precios, stock y clima.
- 🟢 **Panel de Conexión a Redes Sociales:**
  ~~<span style="color:#e11d48">Conexiones pendientes</span>~~ **<span style="color:#16a34a">Implementado: Botones de 1 clic para activar/vincular Meta (Instagram/Facebook), TikTok, X (Twitter) y WhatsApp.</span>**
- 🟢 **Flujo de 1 toque con previsualización interactiva:**
  ~~<span style="color:#e11d48">Generación de texto simple con botón de copiar al portapapeles</span>~~ **<span style="color:#16a34a">Implementado: Botón gigante de 1 toque ('⚡ TOCAR PARA ARMAR PUBLICACIÓN AUTOMÁTICA EN 1 CLIC'), selector de mockups reales de feed (Instagram, TikTok, X, WhatsApp), badge de precio/stock sobre la foto y botón de 'CONFIRMAR Y PUBLICAR AUTOMÁTICAMENTE' con soporte Web Share nativo y fallbacks directos.</span>**

### 🟡 Etapa 4: Interfaz Minimalista para Adultos Mayores (Modo Senior)
- 🟢 **Acciones en 2 toques:** Botón de 1 toque para redes y accesos directos principales en pantalla de inicio.
- 🟢 **Comando por voz prioritario:** Micrófono grande con reconocimiento de voz en español argentino (`es-AR`) y lectura de respuesta en voz alta.
- 🟡 **Diseño de alta legibilidad:** Tipografías grandes, tarjetas con alto contraste y sin jerga técnica.

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
- **2026-11-19 (Redes Sociales):**
  ~~<span style="color:#e11d48">Generación de texto simple con botón de copiar al portapapeles</span>~~ **<span style="color:#16a34a">Se implementó el panel con vinculación a Meta, TikTok, X y WhatsApp, botón de 1 toque con stock real, previsualización interactiva con mockup realista y confirmación de publicación automática.</span>**
- **2026-11-19 (Operatividad y Prueba en Vivo):**
  ~~<span style="color:#e11d48">Aplicación requería build y hosting externo para ser visualizada</span>~~ **<span style="color:#16a34a">Servidor de previsualización local activo en puerto 5173 para probar de forma interactiva el onboarding, los roles y la operativa offline en tiempo real.</span>**
