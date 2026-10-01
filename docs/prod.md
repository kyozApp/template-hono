# 🚀 Producción

Guía operativa para preparar el entorno de producción de la aplicación.

---

<details>
<summary>⚠️ Antes de empezar: Preparar tu copia privada (prod.local.md)</summary>

Para no exponer la IP ni las credenciales SSH de tu servidor en Git, crea tu propia guía
privada (ya protegida en `.gitignore`):

```bash
cp docs/prod.md docs/prod.local.md
```

Abre `docs/prod.local.md`, presiona `Ctrl + F` y reemplaza los datos de tu servidor VPS:

- **`mi-servidor`**: Dirección IP o dominio de tu servidor VPS.
- **`mi-usuario`**: Tu usuario Linux en el VPS (usado en SSH, rsync y Systemd).
- **`-p 22`**: Tu puerto SSH si utilizas uno personalizado.
- **`prod_user`**: Usuario de PostgreSQL que asignarás en tu `.env` y se llamará `POSTGRES_USER`.
- **`8001`**: Puerto de la aplicación web que asignarás en tu `.env` y se llamará `PORT`.

</details>

---

## 🚀 Despliegue Inicial (Primera Vez)

<details>
<summary>📋 Ver procedimiento de despliegue inicial (9 pasos)</summary>

### 1. Sincronizar el código al servidor

Desde tu máquina local, transfiere el código mediante `rsync`:

```bash
rsync -avz -e 'ssh -p 22' --exclude 'node_modules/' --exclude '.git/' --exclude 'dist/' --exclude '.env' ~/proyectos/mi-api/ mi-usuario@mi-servidor:~/proyectos/mi-api/
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

Copia la plantilla y abre el editor:

```bash
cp .env.example .env
nano .env
```

**Modifica las variables base existentes:**

- **`PORT`**: Puerto interno donde correrá la API (ej. `8001`).
- **`CORS_ORIGIN`**: Orígenes permitidos para peticiones CORS (ej. `https://mi-dominio.com` o `*`).
- **`DATABASE_URL`**: Cadena de conexión de PostgreSQL para Prisma 8 en producción.

**Agrega al final del archivo las variables requeridas por `compose.yaml`:**

- **`POSTGRES_PORT`**: Puerto expuesto para PostgreSQL en `compose.yaml`.
- **`POSTGRES_DB`**: Nombre de la base de datos de producción en `compose.yaml`.
- **`POSTGRES_USER`**: Usuario administrador de PostgreSQL en `compose.yaml`.
- **`POSTGRES_PASSWORD`**: Contraseña del usuario de PostgreSQL en `compose.yaml`.

> [!NOTE]
> Los campos `POSTGRES_*` son utilizados por `compose.yaml` para inicializar el contenedor
> y deben coincidir con las credenciales declaradas dentro de `DATABASE_URL`.

### 4. Instalar dependencias

```bash
pnpm i
```

### 5. Iniciar contenedores de base de datos

```bash
podman-compose up -d
```

### 6. Inicializar base de datos y crear superadministrador

```bash
pnpm prisma contract emit
pnpm prisma db init
pnpm prisma db verify
pnpm seed
```

### 7. Compilar la aplicación y el worker para producción

```bash
pnpm build
```

### 8. Crear los servicios en Systemd

La arquitectura desacopla el tráfico web de los procesos cron en dos unidades independientes:

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

### 9. Registrar e iniciar ambos servicios

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now mi-api mi-api-worker
sudo systemctl status mi-api mi-api-worker
```

</details>

---

## 🔄 Actualizaciones Posteriores

<details>
<summary>📋 Ver procedimiento de actualización (3 pasos)</summary>

### 1. Transferir cambios desde tu máquina local

```bash
rsync -avz -e 'ssh -p 22' --exclude 'node_modules/' --exclude '.git/' --exclude 'dist/' --exclude '.env' ~/proyectos/mi-api/ mi-usuario@mi-servidor:~/proyectos/mi-api/
```

### 2. Conectarse por SSH al servidor

```bash
ssh -p 22 mi-usuario@mi-servidor
cd ~/proyectos/mi-api
```

### 3. En el servidor VPS: actualizar, compilar y reiniciar

Instalar dependencias:

```bash
pnpm i
```

Actualizar base de datos (solo si hubo modificaciones en `src/prisma/contract.ts`):

```bash
pnpm prisma contract emit
pnpm prisma db update
pnpm prisma db verify
```

Compilar la nueva versión:

```bash
pnpm build
```

Reiniciar ambos servicios en Systemd:

```bash
sudo systemctl restart mi-api mi-api-worker
```

</details>

---

## 🗄️ Base de Datos y Disaster Recovery (Producción)

<details>
<summary>📋 Ver comandos de exportación y restauración</summary>

### 1. Exportar (Copia de seguridad completa)

```bash
mkdir -p ~/backups/mi-api
podman exec -i template_hono_prod_db pg_dump -U prod_user -Fc -d template_hono_db > ~/backups/mi-api/backup-$(date +%F-%H%M%S).dump
```

### 2. Importar (Restaurar copia ante fallos)

```bash
podman exec -i template_hono_prod_db pg_restore -U prod_user -d template_hono_db --clean --if-exists < ~/backups/mi-api/backup_a_restaurar.dump
```

</details>

---

## 📊 Monitoreo y Operación

<details>
<summary>📋 Ver comandos de logs, estado y diagnóstico</summary>

### Inspeccionar estado y logs en tiempo real

```bash
# Ver estado de ambos servicios
sudo systemctl status mi-api mi-api-worker

# Ver logs en vivo de la API
journalctl -u mi-api -f

# Ver logs en vivo del worker de segundo plano
journalctl -u mi-api-worker -f

# Ver últimas 100 líneas combinadas
journalctl -u mi-api -u mi-api-worker -n 100 --no-pager
```

### Filtrar errores y ventanas de tiempo en logs (Journald)

```bash
# Filtrar exclusivamente errores (sin ruido informativo)
journalctl -u mi-api -u mi-api-worker -p err --no-pager

# Ver logs de una ventana de tiempo específica (ejemplo: últimos 15 minutos)
journalctl -u mi-api --since "15 minutes ago"

# Ver logs generados desde el último reinicio del servidor
journalctl -u mi-api -u mi-api-worker -b

# Verificar uso de espacio en disco de los registros del sistema
journalctl --disk-usage
```

### Pausar, deshabilitar o reanudar servicios (Mantenimiento)

```bash
# Pausar temporalmente ambos servicios
sudo systemctl stop mi-api mi-api-worker

# Evitar que arranquen automáticamente en reinicios del host
sudo systemctl disable mi-api mi-api-worker

# Volver a habilitar el arranque automático e iniciarlos de inmediato
sudo systemctl enable --now mi-api mi-api-worker
sudo systemctl status mi-api mi-api-worker
```

### Diagnóstico de red y salud de la aplicación (Smoke Test)

```bash
# Probar respuesta HTTP real del endpoint de salud
curl -I http://localhost:8001/health

# Comprobar que el puerto esté activo y en escucha en el sistema
ss -tulpn | grep 8001
```

</details>

---

- ⬅️ [Volver al README](../README.md)
- 📘 [Guía de Desarrollo (dev.md)](dev.md) ➡️
