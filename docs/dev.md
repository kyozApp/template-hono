# 🛠️ Desarrollo Local

Guía operativa para preparar y trabajar en el entorno local de la aplicación.

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

## 🚀 Primera Vez

<details>
<summary>📋 Ver procedimiento de arranque inicial (6 pasos)</summary>

> [!IMPORTANT]
> Requisito previo: tener activo un contenedor de PostgreSQL en Podman llamado `dev_pg` con el
> usuario `dev_user` (credenciales que coinciden con `DATABASE_URL` de `.env.example`).

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

## 🔄 Flujo Diario

<details>
<summary>📋 Ver flujo diario de desarrollo (esquema, commit y calidad de código)</summary>

### 1. Al cambiar el esquema (`src/prisma/contract.ts`)

Cuando agregues o modifiques modelos:

```bash
pnpm prisma contract emit
pnpm prisma db update
pnpm prisma db verify
pnpm dev
```

> [!TIP]
> ¿Vas a eliminar o renombrar valores de un Enum nativo? `db update` fallará. Sigue el
> procedimiento de la **[Guía de Base de Datos](database.md)**.

### 2. Antes de hacer commit

- **`pnpm fix`**: Limpia, formatea y corrige automáticamente todo el proyecto (atajo principal).
- **`pnpm build`**: Comprueba que TypeScript compile sin errores de tipos a `dist/`.

### 3. Solo lectura (Inspeccionar sin modificar ningún archivo)

- **`pnpm lint`**: Reporta advertencias y malas prácticas en terminal sin tocar archivos.
- **`pnpm format:check`**: Verifica si el código cumple las reglas de formato sin tocar archivos.

### 4. Comandos quirúrgicos (Uso puntual)

- **`pnpm format`**: Aplica únicamente reglas de espaciado y formato visual en disco.
- **`pnpm lint:fix`**: Aplica únicamente correcciones automáticas de linter en disco.

</details>

---

- ⬅️ [Volver al README](../README.md)
- 🗄️ [Guía de Base de Datos (database.md)](database.md)
- ⚙️ [Guía de Producción (prod.md)](prod.md) ➡️
