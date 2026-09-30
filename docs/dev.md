# 🛠️ Desarrollo Local

Guía operativa para preparar el entorno local, inicializar la base de datos y arrancar la API.

---

## 🛠️ Herramientas de Desarrollo (Snippets)

Instala la extensión oficial **[Kyoz Snippets](https://github.com/kyozApp/kyoz-snippets)**
para el editor Zed (snippets de Valibot y Hono):

### 1. Clona el repositorio

```bash
cd ~/proyectos
git clone https://github.com/kyozApp/kyoz-snippets.git
```

### 2. Instalar en Zed

En Zed, presiona `F1`, escribe **`install dev extension`** y selecciona la carpeta clonada.

---

## ✅ Requisitos Previos

- **Node.js**: `24.21.0`
- **pnpm**: `12.3.4`
- **PostgreSQL 18** accesible en el puerto `5432` (stack central de `~/proyectos/services`).

---

## 🚀 Puesta en Marcha Inicial

### 1. Crear archivo de entorno local

```bash
cd ~/proyectos/mi-api
cp .env.example .env
```

### 2. Instalar dependencias

```bash
pnpm i
```

### 3. Emitir contrato de Prisma 8, inicializar base y crear superadmin

```bash
pnpm prisma contract emit
pnpm prisma db init
pnpm prisma db verify
pnpm seed
```

### 4. Iniciar la API

```bash
pnpm dev
```

### 5. Iniciar el worker

```bash
pnpm worker:dev
```

---

## 🔄 Flujo Diario (Cambios en el Esquema)

Cuando agregues o modifiques modelos en `src/prisma/contract.ts`:

```bash
pnpm prisma contract emit
pnpm prisma db update
pnpm prisma db verify
pnpm dev
```

### ⚠️ Modificación de Enums Nativos (`MIGRATION.PLANNING_FAILED`)

PostgreSQL no permite eliminar, renombrar ni reordenar valores de un `ENUM` nativo de forma
automática (solo permite añadir al final con `ADD VALUE`). Si eliminas o renombras opciones de un
enum en `src/prisma/contract.ts`, `pnpm prisma db update` fallará con un error de planificación.

#### Procedimiento para solucionarlo

##### 1. Ejecutar el script SQL en la base de datos (vía DBeaver, TablePlus o `psql`)

Por ejemplo, si necesitas cambiar los roles de tu sistema reemplazando `VIEWER` por nuevos roles:

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

##### 2. Re-emitir el contrato y sincronizar con Prisma

```bash
pnpm prisma contract emit
pnpm prisma db update
pnpm prisma db verify
```

---

## 📋 Referencia de Comandos (Desarrollo)

| Comando             | Ejecuta internamente                      | Propósito                                                 |
| :------------------ | :---------------------------------------- | :-------------------------------------------------------- |
| `pnpm dev`          | `tsx watch --env-file=.env src/index.ts`  | Inicia la API con recarga en caliente.                    |
| `pnpm worker:dev`   | `tsx watch --env-file=.env src/worker.ts` | Inicia el worker con recarga en caliente.                 |
| `pnpm seed`         | `tsx --env-file=.env src/prisma/seed.ts`  | Inserta el superadmin inicial en desarrollo.              |
| `pnpm fix`          | `biome check --write .`                   | Revisa y corrige formato, linter e imports (Biome).       |
| `pnpm format`       | `biome format --write .`                  | Formatea el código aplicando las reglas de estilo.        |
| `pnpm format:check` | `biome format .`                          | Verifica el formato sin modificar archivos.               |
| `pnpm lint`         | `biome lint .`                            | Inspecciona el código en busca de advertencias y errores. |
| `pnpm lint:fix`     | `biome lint --write .`                    | Aplica soluciones automáticas sugeridas por el linter.    |
| `pnpm build`        | `tsc`                                     | Verifica los tipos y compila el proyecto a `dist/`.       |

### 💡 Guía Rápida por Momento de Uso

#### 1. Al terminar de programar (Flujo diario antes de commit)

- **`pnpm fix`**: Limpia, formatea y corrige automáticamente todo el proyecto (atajo principal).
- **`pnpm build`**: Comprueba que TypeScript compile sin errores de tipos a `dist/`.

#### 2. Solo lectura (Inspeccionar sin modificar ningún archivo)

- **`pnpm lint`**: Reporta advertencias y malas prácticas en terminal sin tocar archivos.
- **`pnpm format:check`**: Verifica si el código cumple las reglas de formato sin tocar archivos.

#### 3. Comandos quirúrgicos (Uso puntual)

- **`pnpm format`**: Aplica únicamente reglas de espaciado y formato visual en disco.
- **`pnpm lint:fix`**: Aplica únicamente correcciones automáticas de linter en disco.

---

- ⬅️ [Volver al README](../README.md)
- ⚙️ [Guía de Producción](prod.md) ➡️
