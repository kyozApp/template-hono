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

Edita los siguientes archivos para adaptar la plantilla al nombre de tu proyecto:

- **`package.json`**: actualiza `"name"` (`mi-api`).
- **`.env.example`**: configura `PORT`, `DATABASE_URL` y variables de PostgreSQL
  (`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`).
- **`compose.yaml`**: actualiza `container_name` (`mi_api_db`).
- **`src/app.ts`**: actualiza `title` con el nombre oficial de tu servicio API.
- **`docs/dev.md`**: actualiza la ruta del proyecto (`cd ~/proyectos/mi-api`).
- **`docs/prod.md`**:
  - Con el buscador (`Ctrl + F`) reemplaza en este archivo:
    - `mi-api` por el nombre de tu proyecto.
    - `mi-usuario` por tu usuario en el VPS.
    - `mi-servidor` por la IP o dominio de tu VPS.
  - Actualiza el campo `Description` de cada servicio en Systemd:
    - En `mi-api.service`: descripción de tu API (`Mi API REST Service`).
    - En `mi-api-worker.service`: descripción del worker de tu API (`Mi API Worker`).

### 3. Continuar en desarrollo local

Una vez renombrado el proyecto, abre la **[Guía de Desarrollo Local (docs/dev.md)](docs/dev.md)**
para instalar dependencias, conectar a los servicios de tus dotfiles, inicializar Prisma 8 y
arrancar el servidor.

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia [MIT](LICENSE).
