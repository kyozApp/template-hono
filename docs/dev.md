# 🛠️ Desarrollo Local

Guía operativa para preparar el entorno local de la aplicación.

---

<details>
<summary>🛠️ Herramientas opcionales: Snippets para el editor Zed</summary>

Instala la extensión oficial **[Kyoz Snippets](https://github.com/kyozApp/kyoz-snippets)**
para el editor Zed (snippets de Valibot y Hono):

```bash
cd ~/proyectos
git clone https://github.com/kyozApp/kyoz-snippets.git
```

En Zed, presiona `F1`, escribe **`install dev extension`** y selecciona la carpeta clonada.

</details>

---

## 🚀 Puesta en Marcha Inicial

<details>
<summary>📋 Ver procedimiento de arranque inicial (6 pasos)</summary>

### 1. Crear la base de datos local en PostgreSQL

```bash
podman exec -i dev_pg psql -U dev_user -c "CREATE DATABASE template_hono_db;"
```

### 2. Crear archivo de entorno local

```bash
cd ~/proyectos/mi-api
cp .env.example .env
```

### 3. Instalar dependencias

```bash
pnpm i
```

### 4. Emitir contrato de Prisma 8, inicializar base y crear superadmin

```bash
pnpm prisma contract emit
pnpm prisma db init
pnpm prisma db verify
pnpm seed
```

### 5. Iniciar la API

```bash
pnpm dev
```

### 6. Iniciar el worker

```bash
pnpm worker:dev
```

</details>

---

## 🔄 Flujo Diario (Cambios en el Esquema)

<details>
<summary>📋 Ver flujo de Prisma y solución de Enums nativos</summary>

Cuando agregues o modifiques modelos en `src/prisma/contract.ts`:

```bash
pnpm prisma contract emit
pnpm prisma db update
pnpm prisma db verify
pnpm dev
```

<details>
<summary>⚠️ Caso Especial: Modificar o renombrar Enums nativos</summary>

PostgreSQL no permite eliminar, renombrar ni reordenar valores de un `ENUM` nativo de forma
automática (solo permite añadir al final con `ADD VALUE`). Si eliminas o renombras opciones de un
enum en `contract.ts`, `pnpm prisma db update` fallará con un error de planificación.

**Procedimiento para solucionarlo:**

- **Paso 1:** Ejecuta este script SQL en la base de datos:

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

</details>

---

## 🗄️ Operación de Base de Datos Local (Podman)

<details>
<summary>📋 Ver comandos de exportar (PG/MySQL), importar y psql</summary>

### 1. Exportar

#### Exportar a archivo SQL desde PostgreSQL

```bash
podman exec -i dev_pg pg_dump -U dev_user --clean -d template_hono_db > backup_dev.sql
```

#### Exportar a archivo SQL desde MySQL desde otra máquina

Reemplaza los siguientes valores con los datos de tu servidor MySQL remoto antes de ejecutar:

- **`host_o_ip`**: Dirección IP o dominio del servidor MySQL.
- **`usuario`**: Usuario con permisos de lectura en MySQL.
- **`password_legacy`**: Contraseña del usuario de MySQL.
- **`nombre_base_datos_legacy`**: Nombre de la base de datos a exportar.

```bash
podman run --rm docker.io/library/mysql:8 mysqldump -h host_o_ip -P 3306 -u usuario -p'password_legacy' --single-transaction --quick --complete-insert --default-character-set=utf8mb4 nombre_base_datos_legacy > backup_mysql_legacy.sql
```

### 2. Importar

#### Restaurar desde archivo SQL

```bash
podman exec -i dev_pg psql -U dev_user -d template_hono_db < backup_dev.sql
```

### 3. Consola Interactiva y Mantenimiento

#### Conexión interactiva directa a psql

```bash
podman exec -it dev_pg psql -U dev_user -d template_hono_db
```

#### Limpiar archivos temporales en el contenedor

```bash
podman exec dev_pg sh -c "rm -f /tmp/*.sql /tmp/*.dump"
```

</details>

---

## 💡 Guía Rápida por Momento de Uso

<details>
<summary>📋 Ver comandos de linter, tipos y compilación por momento de uso</summary>

### 1. Al terminar de programar (Flujo diario antes de commit)

- **`pnpm fix`**: Limpia, formatea y corrige automáticamente todo el proyecto (atajo principal).
- **`pnpm build`**: Comprueba que TypeScript compile sin errores de tipos a `dist/`.

### 2. Solo lectura (Inspeccionar sin modificar ningún archivo)

- **`pnpm lint`**: Reporta advertencias y malas prácticas en terminal sin tocar archivos.
- **`pnpm format:check`**: Verifica si el código cumple las reglas de formato sin tocar archivos.

### 3. Comandos quirúrgicos (Uso puntual)

- **`pnpm format`**: Aplica únicamente reglas de espaciado y formato visual en disco.
- **`pnpm lint:fix`**: Aplica únicamente correcciones automáticas de linter en disco.

</details>

---

- ⬅️ [Volver al README](../README.md)
- ⚙️ [Guía de Producción](prod.md) ➡️
