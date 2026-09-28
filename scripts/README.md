# 🛠️ Scripts de Mantenimiento y Migración de Datos

Directorio para scripts de ejecución puntual (_one-shot scripts_), mantenimiento,
transformación de registros existentes e importaciones de datos por consola.

---

## 🚀 Cómo Ejecutar un Script

Desde la raíz del proyecto, ejecuta el script cargando el archivo de entorno:

```bash
pnpm exec tsx --env-file=.env scripts/ejemplo_migracion.ts
```

---

## 📐 Estructura Estándar de un Script

Todo script debe seguir este patrón base para garantizar el cierre limpio de conexiones:

```ts
import { db } from "../src/prisma/db.js";

async function main() {
  console.log("Iniciando ejecución del script...");

  try {
    // 1. Lógica de consulta o transformación
    // const users = await db.orm.public.User.all();

    console.log("Script completado exitosamente.");
  } catch (error) {
    console.error("Error durante la ejecución del script:", error);
    process.exit(1);
  } finally {
    // Obligatorio: Cerrar el pool de conexiones de Prisma 8
    await db.close();
  }
}

void main();
```
