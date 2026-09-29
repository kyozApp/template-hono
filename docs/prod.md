# 🚀 Producción

Runbook de despliegue y operación para ejecutar **mi-api** en producción con
**Systemd**, **PostgreSQL** y el flujo operativo declarativo de **Prisma 8**.

---

## ✅ Requisitos Previos

- **Servidor Linux** Ubuntu con `systemd`.
- **Node.js**: `24.21.0`
- **pnpm**: `12.3.4`
- **Podman Compose** instalado en el servidor.
- Acceso SSH al host y permisos de `sudo` para administrar `/etc/systemd/system/`.

> [!TIP]
> **Runbook privado local:** Si prefieres tener un archivo con las IPs, usuarios y comandos
> exactos de tu VPS listos para copiar y pegar, puedes duplicar esta guía como `docs/prod.local.md`.
> Este archivo ya se encuentra en `.gitignore` para prevenir fugas accidentales a Git.

<details>
<summary>📋 Preparar un servidor VPS nuevo desde cero en Ubuntu</summary>

Si tu servidor VPS está recién creado, ejecuta estos pasos para instalar y configurar el entorno:

### 1. Actualizar el sistema operativo

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Instalar herramientas esenciales

```bash
sudo apt install -y curl unzip build-essential
```

### 3. Instalar pnpm y Node.js

```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
source ~/.bashrc
pnpm runtime set node lts -g
```

Verificar versiones:

```bash
node -v
pnpm -v
```

### 4. Instalar Podman Rootless con persistencia

```bash
sudo apt install -y podman podman-compose
systemctl --user enable --now podman.socket
systemctl --user enable --now podman-restart.service
loginctl enable-linger $USER
```

Verificar persistencia linger activa (`Linger=yes`):

```bash
loginctl show-user $USER | grep Linger
```

### 5. Probar y limpiar contenedor de prueba

```bash
podman run --rm docker.io/library/hello-world
podman rmi docker.io/library/hello-world
podman network prune -f
```

</details>

---

## 🚀 Despliegue Inicial (Primera Vez)

### 1. Sincronizar el código al servidor

Desde tu máquina local, transfiere el código mediante `rsync`:

```bash
rsync -avz -e 'ssh -p 22' --exclude '.env' --exclude 'node_modules/' --exclude 'dist/' --exclude 'migrations/' ./ mi-usuario@mi-servidor:~/proyectos/mi-api/
```

### 2. Conectarse al servidor VPS

Inicia sesión por SSH en tu servidor remoto:

```bash
ssh -p 22 mi-usuario@mi-servidor
```

Navega al directorio del proyecto:

```bash
cd ~/proyectos/mi-api
```

### 3. Configurar variables de entorno de producción

Copia la plantilla y edita las variables definitivas del servidor:

```bash
cp .env.example .env
nano .env
```

### 4. Levantar la base de datos (PostgreSQL 18)

Inicia el contenedor dedicado definido en `compose.yaml`:

```bash
podman-compose up -d
```

### 5. Instalar dependencias

```bash
pnpm i
```

### 6. Inicializar base de datos y crear Superadmin

```bash
pnpm prisma contract emit
pnpm prisma db init
pnpm prisma db verify
pnpm seed
```

### 7. Compilar la aplicación para producción

```bash
pnpm build
```

### 8. Crear y activar los servicios en Systemd

#### Servicio de la API REST (`mi-api.service`)

Crea el archivo de configuración del servicio web:

```bash
sudo nano /etc/systemd/system/mi-api.service
```

Pega la siguiente configuración:

```ini
[Unit]
Description=Mi API REST Service
After=network.target

[Service]
Type=simple
User=mi-usuario
WorkingDirectory=/home/mi-usuario/proyectos/mi-api
ExecStart=/home/mi-usuario/.local/share/pnpm/bin/node --env-file=.env dist/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

# Parada limpia y gestión de subprocesos
KillMode=control-group
TimeoutStopSec=15

# Protección de recursos (Cgroups v2)
MemoryMax=500M
MemoryHigh=400M

# Logs centralizados con Journald
StandardOutput=journal
StandardError=journal
SyslogIdentifier=mi-api

[Install]
WantedBy=multi-user.target
```

#### Servicio del Worker (`mi-api-worker.service`)

Crea el archivo de configuración del worker de tareas en segundo plano:

```bash
sudo nano /etc/systemd/system/mi-api-worker.service
```

Pega la siguiente configuración:

```ini
[Unit]
Description=Mi API Worker (Background Tasks)
After=network.target mi-api.service

[Service]
Type=simple
User=mi-usuario
WorkingDirectory=/home/mi-usuario/proyectos/mi-api
ExecStart=/home/mi-usuario/.local/share/pnpm/bin/node --env-file=.env dist/worker.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

# Parada limpia y gestión de subprocesos
KillMode=control-group
TimeoutStopSec=15

# Protección de recursos (Cgroups v2)
MemoryMax=300M
MemoryHigh=250M

# Logs centralizados con Journald
StandardOutput=journal
StandardError=journal
SyslogIdentifier=mi-api-worker

[Install]
WantedBy=multi-user.target
```

#### Activar e iniciar ambos servicios

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now mi-api mi-api-worker
sudo systemctl status mi-api mi-api-worker
```

---

## 🔄 Actualizaciones Posteriores

### 1. Transferir cambios desde tu máquina local

```bash
rsync -avz -e 'ssh -p 22' --exclude '.env' --exclude 'node_modules/' --exclude 'dist/' --exclude 'migrations/' ./ mi-usuario@mi-servidor:~/proyectos/mi-api/
```

### 2. Conectarse por SSH al servidor

```bash
ssh -p 22 mi-usuario@mi-servidor
```

### 3. En el servidor VPS: actualizar, compilar y reiniciar

Navega al directorio del proyecto:

```bash
cd ~/proyectos/mi-api
```

Pausar el worker (solo si modificaste la base de datos o tareas en segundo plano):

```bash
sudo systemctl stop mi-api-worker
```

Instalar dependencias:

```bash
pnpm i
```

Actualizar esquema de base de datos (solo si hubo cambios en `src/prisma/contract.ts`):

```bash
pnpm prisma contract emit
pnpm prisma db update
pnpm prisma db verify
```

Compilar la nueva versión:

```bash
pnpm build
```

Reiniciar la API y reanudar el worker:

```bash
# Reinicio instantáneo del servidor HTTP
sudo systemctl restart mi-api

# Volver a encender el worker con la nueva versión
sudo systemctl start mi-api-worker
```

---

## 📊 Monitoreo y Operación

### Inspeccionar estado y logs en tiempo real

```bash
# Ver estado de ambos servicios
sudo systemctl status mi-api mi-api-worker

# Ver logs en vivo de ambos servicios
journalctl -u mi-api -u mi-api-worker -f

# Ver últimas 100 líneas
journalctl -u mi-api -u mi-api-worker -n 100 --no-pager
```

### Filtrar errores y ventanas de tiempo en logs (Journald)

```bash
# Filtrar exclusivamente errores (sin ruido informativo)
journalctl -u mi-api -p err --no-pager
journalctl -u mi-api-worker -p err --no-pager

# Ver logs de una ventana de tiempo específica (ejemplo: últimos 15 minutos)
journalctl -u mi-api --since "15 minutes ago"

# Ver logs generados desde el último reinicio del servidor
journalctl -u mi-api -b

# Verificar uso de espacio en disco de los registros del sistema
journalctl --disk-usage
```

### Pausar, deshabilitar o reanudar servicios (Mantenimiento)

```bash
# Pausar temporalmente ambos servicios (solo en la sesión actual)
sudo systemctl stop mi-api mi-api-worker
sudo systemctl status mi-api mi-api-worker

# Evitar que arranquen automáticamente en reinicios del host
sudo systemctl disable mi-api mi-api-worker
sudo systemctl is-enabled mi-api mi-api-worker

# Volver a habilitar el arranque automático e iniciar ambos servicios de inmediato
sudo systemctl enable --now mi-api mi-api-worker
sudo systemctl status mi-api mi-api-worker
```

### Diagnóstico de red y salud de la API (Smoke Test)

```bash
# Probar respuesta HTTP real del endpoint de salud
curl -I http://localhost:3000/health

# Comprobar que el puerto esté activo y en escucha en el sistema
ss -tulpn | grep 3000
```

### Diagnóstico del contenedor de base de datos (Podman)

```bash
# Verificar estado y tiempo de actividad del contenedor de PostgreSQL
podman ps -f name=mi_api_db

# Ver logs del contenedor ante fallos de conexión o autenticación
podman logs mi_api_db

# Reiniciar el contenedor de base de datos de forma aislada
podman restart mi_api_db
```

---

## 📋 Referencia de Comandos (Producción)

| Comando             | Ejecuta internamente                     | Propósito                                               |
| :------------------ | :--------------------------------------- | :------------------------------------------------------ |
| `pnpm build`        | `tsc`                                    | Compila TypeScript a JavaScript optimizado en `dist/`.  |
| `pnpm seed`         | `tsx --env-file=.env src/prisma/seed.ts` | Inserta el superadmin inicial (solo primer despliegue). |
| `pnpm start`        | `node --env-file=.env dist/index.js`     | Inicia la API en producción con Node.js puro.           |
| `pnpm worker:start` | `node --env-file=.env dist/worker.js`    | Inicia el worker en producción con Node.js puro.        |

> [!NOTE]
> En un servidor de producción real, `pnpm start` y `pnpm worker:start` son gestionados
> automáticamente en segundo plano por los servicios de **Systemd** (`mi-api.service`
> y `mi-api-worker.service`).

---

- ⬅️ [Volver al README](../README.md)
- 📘 [Guía de Desarrollo (dev.md)](dev.md) ➡️
