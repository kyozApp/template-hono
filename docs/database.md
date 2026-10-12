# 🗄️ Base de Datos

Guía de operaciones de datos: consola, respaldos, migraciones y mantenimiento de PostgreSQL.

---

<details>
<summary>⚠️ Antes de empezar: Preparar tu copia privada (database.local.md)</summary>

Para no exponer credenciales de bases de datos remotas en Git, crea tu propia guía privada
(ya protegida en `.gitignore`):

```bash
cp docs/database.md docs/database.local.md
```

Abre `docs/database.local.md`, presiona `Ctrl + F` y reemplaza los datos reales:

- **`host_o_ip`**: Dirección IP o dominio del servidor MySQL legacy.
- **`usuario`**: Usuario con permisos de lectura en MySQL.
- **`password_legacy`**: Contraseña del usuario de MySQL.
- **`nombre_base_datos_legacy`**: Nombre de la base de datos MySQL a exportar.
- **`prod_user`**: Usuario de PostgreSQL de producción (`POSTGRES_USER` en tu `.env`).

</details>

---

## 🖥️ Consola Interactiva

<details>
<summary>📋 Ver comandos de conexión directa a psql</summary>

### Conexión a psql en desarrollo

```bash
podman exec -it dev_pg psql -U dev_user -d template_hono_db
```

### Conexión a psql en producción

Ejecutar dentro del servidor VPS:

```bash
podman exec -it template_hono_prod_db psql -U prod_user -d template_hono_db
```

</details>

---

## 💾 Respaldos (Desarrollo)

<details>
<summary>📋 Ver comandos de exportación e importación local</summary>

### 1. Exportar a archivo SQL desde PostgreSQL

```bash
podman exec -i dev_pg pg_dump -U dev_user --clean -d template_hono_db > backup_dev.sql
```

### 2. Restaurar desde archivo SQL

```bash
podman exec -i dev_pg psql -U dev_user -d template_hono_db < backup_dev.sql
```

</details>

---

## 🛡️ Respaldos y Disaster Recovery (Producción)

<details>
<summary>📋 Ver comandos de exportación y restauración en producción</summary>

Ejecutar dentro del servidor VPS.

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

## 🐬 Migración desde MySQL Legacy

<details>
<summary>📋 Ver comando de exportación desde un MySQL remoto</summary>

Reemplaza los siguientes valores con los datos de tu servidor MySQL remoto antes de ejecutar:

- **`host_o_ip`**: Dirección IP o dominio del servidor MySQL.
- **`usuario`**: Usuario con permisos de lectura en MySQL.
- **`password_legacy`**: Contraseña del usuario de MySQL.
- **`nombre_base_datos_legacy`**: Nombre de la base de datos a exportar.

```bash
podman run --rm docker.io/library/mysql:8 mysqldump -h host_o_ip -P 3306 -u usuario -p'password_legacy' --single-transaction --quick --complete-insert --default-character-set=utf8mb4 nombre_base_datos_legacy > backup_mysql_legacy.sql
```

> [!TIP]
> Para transformar o importar esos datos hacia PostgreSQL con Prisma 8, crea un script
> siguiendo la **[Guía de Scripts](../scripts/README.md)**.

</details>

---

## 🔧 Mantenimiento Avanzado de PostgreSQL

<details>
<summary>⚠️ Caso Especial: Modificar o renombrar Enums nativos</summary>

PostgreSQL no permite eliminar, renombrar ni reordenar valores de un `ENUM` nativo de forma
automática (solo permite añadir al final con `ADD VALUE`). Si eliminas o renombras opciones de un
enum en `contract.ts`, `pnpm prisma db update` fallará con un error de planificación.

**Procedimiento para solucionarlo:**

- **Paso 1:** Ejecuta este script SQL en la base de datos (ejemplo: reemplazar `VIEWER` por
  `MANAGER`; adapta los valores a los declarados en tu `contract.ts`):

```sql
-- 1. Crear el nuevo enum con los valores que declaraste en contract.ts
CREATE TYPE "Role_new" AS ENUM (
  'SUPERADMIN',
  'ADMIN',
  'MANAGER',
  'USER'
);

-- 2. Quitar temporalmente el valor default de la columna
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

-- 3. Mapear los valores viejos a los nuevos sin perder datos
ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "Role_new"
    USING (
      CASE "role"::text
        WHEN 'VIEWER' THEN 'USER'::"Role_new"
        ELSE "role"::text::"Role_new"
      END
    );

-- 4. Reasignar el valor por defecto declarado en tu contrato
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER'::"Role_new";

-- 5. Eliminar el enum viejo y renombrar el nuevo
DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";
```

- **Paso 2:** Re-emitir el contrato y sincronizar con Prisma:

```bash
pnpm prisma contract emit
pnpm prisma db update
pnpm prisma db verify
```

</details>

<details>
<summary>🧹 Limpiar archivos temporales en el contenedor</summary>

```bash
podman exec dev_pg sh -c "rm -f /tmp/*.sql /tmp/*.dump"
```

</details>

---

- ⬅️ [Volver al README](../README.md)
- 📘 [Guía de Desarrollo (dev.md)](dev.md)
- ⚙️ [Guía de Producción (prod.md)](prod.md)
