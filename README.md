# Panel IoT para sistema de bombeo (demo en Laravel)

Aplicación web desarrollada en Laravel 12 que simula el control integral de una bomba de fluidos. Incluye autenticación demo, panel administrativo con animaciones, control ON/OFF y métricas eléctricas generadas por software con vistas a integrar un ESP32 en la siguiente fase.

## Características principales

- Acceso de demostración con credenciales fijas (`demo / demo`).
- Interfaz profesional con gradientes, transiciones y estado en tiempo real de la bomba.
- Botón ON/OFF que conmuta el estado en el simulador y actualiza el tiempo operativo acumulado.
- Gráficas dinámicas (Chart.js) para voltaje, corriente y nivel de batería/UPS.
- Sidebar con resumen del sistema, conectividad prevista y plan de evolución.
- Sección de configuración donde se centraliza el estado y credenciales del ESP32/relé.
- Arquitectura lista para enlazarse a un ESP32 por REST o MQTT sin romper la interfaz.

## Requisitos

- PHP 8.2+
- Extensiones típicas de Laravel (OpenSSL, PDO, Mbstring, etc.).
- Composer
- Node.js 20+ y npm (para compilar los assets con Vite/Tailwind v4).

## Puesta en marcha local

```bash
# 1. Instalar dependencias PHP
composer install

# 2. Copiar variables de entorno (ya creado por create-project)
cp .env.example .env  # si no existe .env

# 3. Generar key de aplicación
php artisan key:generate

# 4. Instalar dependencias front-end
npm install

# 5. Compilar assets en modo desarrollo
npm run dev

# 6. Levantar el servidor de Laravel
php artisan serve
```

Accede a `http://localhost:8000` y usa las credenciales `demo / demo`.

## Variables de entorno relevantes

```env
DEMO_USERNAME=demo
DEMO_PASSWORD=demo
ESP32_ENABLED=false
ESP32_DEVICE_ID=BB-ESP32-01
ESP32_FIRMWARE_VERSION=1.0.0
ESP32_ACTIVATION_MODE=http
ESP32_HTTP_ENDPOINT=https://api.ejemplo.com/esp32/activate
ESP32_MQTT_TOPIC=iot/bisonbyte/pump/control
ESP32_ACTIVATION_KEY=CLAVE-DEMO-1234
ESP32_HTTP_STATE_ENDPOINT="${APP_URL}/api/pump/state"
ESP32_HTTP_SET_ENDPOINT="${APP_URL}/api/pump/set"
ESP32_HTTP_TELEMETRY_ENDPOINT="${APP_URL}/api/telemetry"
PIPE_DIAMETER_M=0.032
PIPE_LENGTH_M=12
PIPE_ROUGHNESS_M=0.000045
```

Puedes modificarlas en tu `.env` para personalizar el acceso de la demo.

## Despliegue en cPanel

1. Sube el contenido del proyecto a tu cuenta (idealmente en una carpeta fuera de `public_html`).
2. En `public_html`, apunta un enlace simbólico o copia el contenido de `public/` del proyecto.
3. Configura PHP 8.2+ y habilita las extensiones requeridas en tu hosting.
4. Ejecuta `composer install --optimize-autoloader --no-dev` y `php artisan key:generate` desde la raíz del proyecto.
5. Compila los assets con `npm run build` (o hazlo en local y sube la carpeta `public/build`).
6. Ajusta el archivo `.env` con la URL (`APP_URL`) y las credenciales demo.

## ¿Cómo funciona la sincronización?

- **Registro automático**: el ESP32 envía su MAC en `POST /api/devices/register`, obtiene `device_id` y `token`, y queda disponible para control remoto.
- **Comandos HTTP push/pull**: cada 2&nbsp;s el firmware consulta `GET /api/pump/state?device_id&token` para conocer la orden vigente. Laravel actualiza ese objetivo cuando el usuario pulsa el switch (o mediante `POST /api/pump/set`).
- **Telemetría en el dashboard**: el dispositivo reporta métricas con `POST /api/telemetry`. El frontend deja de generar números aleatorios y consume en tiempo real la última muestra (con fallback simulado si no hay hardware).
- **Centro de configuración**: en `/settings` puedes revisar el listado de dispositivos registrados, su último ping, telemetría y los parámetros editables; la información persiste en `storage/app/settings.json`.

## Persistencia de telemetría y eventos

- `devices` almacena identidad, firmware, caducidad del token y tipo de conexión (`http` o `mqtt`).
- Cada `POST /api/telemetry` genera un registro en `measurements` con caudal, presión, temperatura, potencia hidráulica y el resultado completo de los cálculos de fluidos.
- Cuando el ESP32 informa cambios de estado (`is_on`), se registra una entrada en `pump_events` para auditar encendidos/apagados.
- El procesamiento ocurre en segundo plano mediante el job `ProcessTelemetry`. En entornos productivos ejecuta `php artisan queue:work` o configura el worker correspondiente.

## Flujo de cálculo automático

- `FluidCalculationService` toma el caudal reportado, la geometría de la tubería (`PIPE_*` en `.env`) y las propiedades del fluido seleccionado para estimar régimen (Re), factor de fricción, ΔP, carga y potencia hidráulica.
- Los resultados se persisten junto a la medición y se muestran en el dashboard como tarjetas dinámicas para el operador.
- Ajusta los valores base en `config/hydraulics.php` o sobreescríbelos vía variables de entorno.

## Streaming en vivo (SSE)

- El dashboard abre una conexión `EventSource` contra `GET /telemetry/stream` (autenticado por sesión) y recibe eventos `telemetry.updated` sin refrescar la página.
- Si el navegador no soporta SSE o la conexión falla, se activa un polling de respaldo cada 5&nbsp;s.
- Los endpoints críticos están protegidos por tokens únicos por dispositivo y por Laravel Sanctum (`auth:sanctum` + middleware `role:admin`).

## Próximos pasos sugeridos

1. Conectar el botón ON/OFF a un endpoint real que invoque el ESP32 (HTTP o MQTT).
2. Reemplazar la generación aleatoria de métricas por valores provenientes del hardware.
3. Guardar los históricos en base de datos y generar reportes en PDF/Excel.
4. Añadir notificaciones (correo/WhatsApp) cuando la telemetría salga de rangos seguros.

## Créditos

Desarrollado como prototipo académico / empresarial para **Proyecto Bisonbyte**. Basado en Laravel 12, Vite y Tailwind CSS v4.
