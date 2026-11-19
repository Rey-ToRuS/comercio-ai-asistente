# 📘 Manual Completo de Uso y Base de Conocimiento — ComercioAI

> **Propósito de este documento:** Guía operativa completa para comerciantes, feriantes y emprendedores, y **base de conocimiento oficial** que utiliza el Asistente por voz y texto (tanto offline como con IA) para responder consultas, dudas y configuraciones al instante.

---

## 1. Qué es ComercioAI y cómo funciona

**ComercioAI** es un asistente comercial **offline-first** comandado por **voz, texto y código de barras**, diseñado para llevar un control interno simple pero exhaustivo de un comercio, local chico o puesto de feria.

- **100% interno (cero ARCA/AFIP):** No emite comprobantes fiscales ni se conecta a organismos tributarios. Sirve exclusivamente para controlar tu mercadería, tu caja real del día/mes, tus gastos, proveedores, cambios y regalos.
- **Sin servidores externos ni n8n:** Toda tu información se guarda localmente en tu dispositivo (`IndexedDB`) y se sincroniza directamente con las herramientas que vos elijas conectar (tu propia cuenta de Google y el proveedor de IA que prefieras).
- **Aislamiento total:** Cada negocio maneja su propia base local, su propia carpeta de Drive y sus propias planillas.

### Barra Superior (Información en Tiempo Real sin Repeticiones)
En la parte superior verás siempre 4 controles compactos:
1. **Nombre del comercio y rubro activo.**
2. **Reloj y fecha exactos** actualizados segundo a segundo.
3. **Clima y ubicación (opcional):** Tocá para activar GPS y ver temperatura, condición climática y barrio/ciudad (vía Open-Meteo, gratis y sin clave). Este contexto se puede usar automáticamente en tus publicaciones de redes y registros del libro diario.
4. **Escáner rápido** (cámara o pistola USB/OTG) y **Estado Online/Offline + Sync** (muestra si tenés conexión y cuántos movimientos están pendientes de sincronizar).

---

## 2. Pestaña Asistente — Comandos por Voz, Texto y Botones Rápidos

La pantalla principal está diseñada para operar con una sola mano en mostrador o feria.

### A. Cómo usar comandos por Voz
1. Tocá el **botón verde del micrófono**. Cuando pasa a rojo, la app está escuchando en español (`es-AR`).
2. Hablá con naturalidad describiendo qué ocurrió.
3. La app interpreta tu comando (usando la IA configurada si hay internet, o el **Motor Local Offline** si estás sin señal) y muestra una **Tarjeta de Confirmación**.
4. Revisá (o editá rápidamente) el **monto** y el **medio de pago**, y tocá **Confirmar y guardar**.

### B. Ejemplos de frases que entiende por Voz o Texto

| Objetivo | Ejemplos de comandos |
| :--- | :--- |
| **Registrar una venta** | *"Vendí 2 mates a 12 mil en efectivo"* · *"Vendí una remera negra a 18000 por transferencia"* |
| **Registrar un gasto general** | *"Gasto 4500 bolsas y etiquetas en efectivo"* · *"Pagué 8000 alquiler del puesto por QR"* |
| **Pago a proveedor** | *"Pagué 35 mil al proveedor Juan por transferencia"* · *"Reposición distribuidor Norte 22000"* |
| **Cambio de producto** | *"Cambié remera M por L diferencia 3000 QR"* · *"Cambio de mate sin diferencia"* |
| **Regalo / Cortesía / Canje** | *"Regalé 1 llavero por cortesía"* · *"Degustación 2 empanadas"* |
| **Dar de alta un producto** | *"Agregar producto termo de acero a 25000 stock 5"* |
| **Consultar tu caja** | *"¿Cuánto vendí hoy?"* · *"¿Cómo vamos este mes?"* · *"Resumen de caja"* |
| **Consultar el Manual / Dudas** | *"¿Cómo conecto la pistola USB?"* · *"¿Cómo agrego una columna a mi planilla?"* · *"¿Cómo conecto Google Drive?"* |

> **Lectura en voz alta:** Cuando el Asistente responde una consulta de caja o una duda del manual, podés tocar el botón **Escuchar** para que lea la respuesta en voz alta sin tener que leer la pantalla.

### C. Botones rápidos de 1 toque (100% Offline)
Debajo del campo de comandos tenés 5 accesos directos para momentos de mucho ruido o cero señal:
- **Nueva Venta**
- **Gasto / Proveedor**
- **Cambio / Regalo**
- **Producto + Foto**
- **Escanear Código**

---

## 3. Escáner de Código de Barras (Cámara del Celular + Pistola USB / USB-C OTG)

La app integra lectura dual para agilizar kioscos, almacenes, ferias y comercios con etiquetas.

### Modo 1: Pistola Escáner USB / USB-C OTG
Probado con lectores USB conectados mediante adaptador **USB a USB-C (OTG)** en celulares Android (como Samsung A54 5G) y en computadoras:
1. Conectá la pistola escáner con el adaptador OTG al celular (o directo a un puerto USB en PC).
2. Verificá en **Planillas → Escáner y Respaldo** que esté activada la opción **“Escucha global de pistola USB / OTG activa en toda la app”**.
3. Con la app abierta en cualquier pantalla, apuntá a un código de barras y dispará:
   - La app detecta automáticamente la ráfaga rápida del lector HID sin interferir cuando escribís normalmente en un formulario.
   - Emite un **beep** de confirmación.
   - **Si el producto ya existe en tu Stock:** abre inmediatamente una tarjeta con el producto, su precio y stock actual, con botones para **Registrar Venta** o **Cambio / Regalo**.
   - **Si el código es nuevo:** ofrece el botón **Crear producto con este código** para darlo de alta con el código ya completado.

### Modo 2: Cámara del Celular
1. Tocá **Escáner listo** en la barra superior o **Escanear Código** en el Asistente/Stock.
2. Permití el acceso a la cámara (prioriza automáticamente la cámara trasera; si tenés varias, tocá **Cambiar cámara**).
3. Apuntá al código (**EAN-13, EAN-8, UPC, Code128 o QR**) dentro del recuadro guía.
4. Si necesitás ingresar un código manualmente o probar tu pistola en un campo dedicado, cambiá a la pestaña **Pistola USB / Manual** dentro del mismo modal.

---

## 4. Pestaña Libro Diario (Control Interno Detallado)

Es la única pantalla con totales financieros (evitando repetir datos en otras pestañas).

- **Períodos:** Alterná entre **Hoy**, **Mes** y **Todo** para ver **Ingresos**, **Egresos y Gastos**, **Balance Neto** y **Cantidad de movimientos**.
- **Tipos de movimiento soportados:**
  - *Ingresos (+):* Venta, Ingreso extra, Cambio con diferencia a favor.
  - *Egresos (-):* Gasto general, Proveedor, Devolución, Retiro de caja.
  - *Neutros (sin dinero):* Regalo / cortesía, Cambio directo sin diferencia (quedan registrados para trazabilidad de stock).
- **Medios de pago:** Efectivo, Transferencia, QR / Billetera, Tarjeta, **Mixto** (te deja dividir Parte 1 y Parte 2 y suma automáticamente el total), Cuenta corriente / Fiado y Sin cargo.
- **Vínculo automático con Stock:** Si elegís un producto al registrar un movimiento:
  - En *Venta* o *Regalo*, descuenta automáticamente la cantidad del stock.
  - En *Devolución* o *Proveedor*, suma la cantidad al stock.
- **Exportación:**
  - **CSV:** Descarga inmediata offline compatible con Excel y Google Sheets, incluyendo tus columnas personalizadas.
  - **Doc:** Genera un informe estructurado directamente en tu cuenta de **Google Docs** (si conectaste Google).

---

## 5. Pestaña Stock y Productos (Fotos Offline + Visión IA)

1. Tocá **Nuevo Producto** para abrir la ficha.
2. **Foto del producto:** Tocá **Sacar / Subir foto**. La app comprime la imagen en el dispositivo para que ocupe mínimo espacio en modo offline y la deja lista para subirse a tu Google Drive.
3. **Completar con IA (Visión):** Una vez sacada la foto, tocá **Completar con IA** (requiere Gemini, OpenAI o Llama Vision conectado y señal). La IA identifica el producto y completa **Nombre, Categoría y Descripción**.
4. **Campos dinámicos del rubro:** Los campos adicionales que ves en la ficha (ej. *Talle/Color* en Indumentaria, *Marca/Vencimiento* en Kiosco, *Material/Pieza única* en Feria) provienen de tu planilla editable.
5. **Control rápido en la grilla:**
   - Ajustá unidades con **−** y **+**.
   - El número de stock se marca en terracota si iguala o baja de tu **Aviso stock bajo**.
   - Tocá **Vender** en cualquier tarjeta para registrar su salida al instante.

---

## 6. Pestaña Planillas — Plantillas Editables por Tipo de Negocio

Ubicada en **Planillas → Planillas**. Trae **6 plantillas base configurables**, una por cada gran rubro:

| Rubro | Pestañas por defecto | Columnas destacadas incluidas |
| :--- | :--- | :--- |
| **Feria / Artesanías** | `Stock_Feria`, `Libro_Diario`, `Gastos_Proveedores` | Material/Técnica, Pieza única, Origen/Taller, Feria/Evento, Promo aplicada |
| **Kiosco / Almacén** | `Stock_Kiosco`, `Caja_Diaria`, `Proveedores_Gastos` | Marca, Vencimiento, Presentación, Distribuidor, Turno (Mañana/Tarde/Noche) |
| **Indumentaria / Calzado** | `Stock_Prendas`, `Libro_Ventas_Gastos`, `Proveedores_Taller` | Talle, Color, Temporada, Tela, Detalle de cambio, Canal (Mostrador/IG/WA) |
| **Gastronomía / Puesto** | `Menu_Insumos`, `Libro_Diario_Gastro`, `Compras_Insumos` | Porción, Fecha elaboración, Apto/Etiqueta (Sin TACC/Vegano), Franja horaria |
| **Servicios / Taller** | `Servicios_Repuestos`, `Libro_Trabajo_Caja`, `Repuestos_Gastos` | Tipo (Servicio/Repuesto), Duración estimada, Garantía, Detalle trabajo, Estado |
| **Comercio General** | `Stock`, `Libro_Diario`, `Gastos_Proveedores` | Variante/Detalle, Proveedor, Etiqueta interna |

### Cómo personalizar tu planilla paso a paso
1. Elegí tu **Nombre de comercio**, **Moneda** y la plantilla base de tu rubro.
2. Editá si querés los nombres de las 3 pestañas de Google Sheets.
3. En **Columnas adicionales de Stock** y **Libro Diario**:
   - Tildá o destildá la casilla izquierda para activar/desactivar una columna.
   - Editá el nombre directamente en la caja de texto.
   - Cambiá el tipo de dato (*Texto*, *Número*, *Fecha* o *Lista*).
   - Sumá nuevas columnas con el botón **Agregar columna**.
4. Personalizá las **Categorías de Stock** y los **Motivos frecuentes**.
5. Verificá el resultado al final en la **Vista previa de columnas en Google Sheets**.

---

## 7. Pestaña Redes — Contenido Automático con Stock, Clima y Ubicación

1. *(Recomendado)* Activá tu ubicación y clima desde la barra superior para sumar contexto real del día (*ej. "Hoy con 23°C y despejado en Palermo"*).
2. En **Redes**, seleccioná hasta **5 productos** reales de tu Stock.
3. Elegí el **Formato**:
   - **Post Instagram / Facebook**
   - **Guión Reel / TikTok (15 segundos con escenas y gancho)**
   - **Estado de WhatsApp**
   - **Aviso en vivo de Feria / Puesto**
4. Elegí el **Estilo** (*Cercano*, *Minimalista*, *Oferta* o *Informativo*) y agregá una nota opcional (horarios, descuento efectivo, dirección del puesto).
5. Tocá **Generar contenido automático**. Funciona con tu IA conectada o con plantillas inteligentes offline.
6. Tocá **Compartir (IG / WhatsApp / Meta)** para abrir el menú nativo de compartir de tu celular con la foto del producto y el texto listos en 1 toque, o **Copiar texto**.

---

## 8. Configuración de Proveedores de IA (Intercambiables)

En **Planillas → IA** podés cambiar de cerebro en cualquier momento:

- **Google Gemini (Recomendado):** Soporta voz/texto, Visión para fotos de productos y redes. Clave gratuita en `aistudio.google.com`.
- **Meta Llama (vía Groq):** Modelos de la familia Meta ultra rápidos con capa gratuita en `console.groq.com`.
- **OpenAI (GPT-4o / GPT-4o-mini):** Texto, visión y generación comercial en `platform.openai.com`.
- **Motor Local Offline (Sin API):** Funciona sin clave ni internet interpretando comandos comerciales y respondiendo dudas del manual.

Usá **Probar conexión de IA** para verificar que tu API Key esté activa. Tu clave jamás sale de tu dispositivo hacia servidores de terceros ajenos al proveedor elegido.

---

## 9. Conexión con Google (Drive, Sheets y Docs) Sin Servidor Propio

En **Planillas → Google / Redes**:
1. Creá un proyecto gratuito en **Google Cloud Console**, activá las APIs **Google Drive API**, **Google Sheets API** y **Google Docs API**, y creá un **ID de cliente OAuth (Aplicación Web)**.
2. Pegá el **Google OAuth Client ID** en la app y tocá **Conectar cuenta de Google**.
3. Al autorizar tu cuenta, la app crea automáticamente en tu Drive:
   - Carpeta aislada `ComercioAI - <Tu Comercio>`
   - Subcarpeta `Fotos Productos` (traslados atómicos sin duplicados y visualización directa `lh3`)
   - Planilla de Google Sheets con las 3 pestañas y columnas exactas de tu plantilla personalizada.
4. Tocá **Sincronizar ahora** (o **Sync** en la barra superior) cada vez que vuelvas a tener conexión para enviar la cola pendiente.

---

## 10. Modo Offline en Ferias y Respaldo Local (Backup JSON)

### En ferias sin señal
- Todo registro nuevo se guarda localmente y queda marcado con **Pendiente sync**.
- Podés seguir vendiendo, escaneando con pistola USB o cámara, sacando fotos, exportando CSV y consultando este manual sin internet.
- **Tip Android:** Para dictar por voz sin internet, descargá *Español (Argentina)* en *Ajustes de Google → Voz → Reconocimiento de voz sin conexión*.

### Respaldo JSON (100% tuyo)
En **Planillas → Escáner y Respaldo**:
- **Descargar respaldo JSON:** Guarda en un único archivo todo tu stock, libro diario y plantillas personalizadas (sin incluir tus API Keys por seguridad).
- **Restaurar desde JSON:** Recupera toda tu operación en segundos si cambiás de teléfono o navegador.

---

## 11. Solución Rápida de Problemas (FAQ)

- **“El micrófono no escucha”:** Verificá el permiso de micrófono del navegador (candado junto a la URL) y preferí Chrome o Edge.
- **“La cámara no abre”:** Confirmá permiso de cámara; en caso de restricción del navegador, usá la pestaña **Pistola USB / Manual** dentro del escáner.
- **“La pistola USB escribe pero no abre el producto”:** Confirmá que el cursor no esté dentro de un campo de texto común y verificá que esté activo el listener global en **Planillas → Escáner y Respaldo**.
- **“Google dice sesión vencida”:** Al funcionar sin backend propio, la sesión OAuth web dura ~1 hora. Tocá nuevamente **Conectar cuenta de Google** y luego **Sync**.
- **“¿Sirve para facturar en ARCA?”:** No. Es intencionalmente una herramienta de control interno rápido para saber exactamente qué entra y sale del puesto o local.
