# ⚡ Template Hono

Plantilla base de desarrollo rápido para APIs backend y microservicios modernos, construida
sobre **Hono**, **Node.js 24**, **Prisma 8 (Contract Builder)**, **PostgreSQL 18**, **Valibot**,
**OpenAPI 3.1**, **Scalar UI**, **Argon2** y **Biome**.

---

## 🚀 Cómo Usar Esta Plantilla

### 1. Clonar el proyecto con degit

Ejecuta el siguiente comando para descargar una copia limpia sin historial git:

```bash
pnpm dlx degit kyozApp/template-hono mi-api
cd mi-api
```

### 2. Personalizar la plantilla

1. En **`package.json`**, actualiza el campo `"name"` con el nombre de tu proyecto.
2. En tu editor, presiona `Ctrl + Shift + F` (búsqueda global) y reemplaza estos 2 valores:
   - **`mi-api`**: Nombre de la carpeta de tu proyecto.
   - **`template_hono_db`**: Nombre de tu base de datos en PostgreSQL.

### 3. Continuar en desarrollo local

Abre la **[Guía de Desarrollo Local](docs/dev.md)** para preparar tu entorno en desarrollo.

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia [MIT](LICENSE).
