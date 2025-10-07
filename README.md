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
```

Puedes modificarlas en tu `.env` para personalizar el acceso de la demo.

## Despliegue en cPanel

1. Sube el contenido del proyecto a tu cuenta (idealmente en una carpeta fuera de `public_html`).
2. En `public_html`, apunta un enlace simbólico o copia el contenido de `public/` del proyecto.
3. Configura PHP 8.2+ y habilita las extensiones requeridas en tu hosting.
4. Ejecuta `composer install --optimize-autoloader --no-dev` y `php artisan key:generate` desde la raíz del proyecto.
5. Compila los assets con `npm run build` (o hazlo en local y sube la carpeta `public/build`).
6. Ajusta el archivo `.env` con la URL (`APP_URL`) y las credenciales demo.

## ¿Cómo funciona el simulador?

- **Estado de la bomba**: se guarda en sesión mediante `PumpSimulationService`. El tiempo operativo acumulado se actualiza cada vez que la bomba cambia de estado y continúa incrementando mientras está encendida.
- **Métricas**: JavaScript genera valores pseudoaleatorios alrededor de un valor base para voltaje, corriente y batería y los refleja en gráficas Chart.js.
- **Control ON/OFF**: un endpoint (`POST /pump/toggle`) simula el cambio de estado y devuelve la nueva telemetría base. Está protegido por middleware de sesión.
- **Centro de configuración**: desde el dashboard abre el botón `Configuración` (ruta `/settings`) para ajustar credenciales demo y parámetros del ESP32. Los cambios se almacenan en `storage/app/settings.json` y se aplican inmediatamente.

## Próximos pasos sugeridos

1. Conectar el botón ON/OFF a un endpoint real que invoque el ESP32 (HTTP o MQTT).
2. Reemplazar la generación aleatoria de métricas por valores provenientes del hardware.
3. Guardar los históricos en base de datos y generar reportes en PDF/Excel.
4. Añadir notificaciones (correo/WhatsApp) cuando la telemetría salga de rangos seguros.

## Créditos

Desarrollado como prototipo académico / empresarial para **Proyecto Bisonbyte**. Basado en Laravel 12, Vite y Tailwind CSS v4.
