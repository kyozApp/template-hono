import { serveStatic } from "@hono/node-server/serve-static";
import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";

import { openAPIRouteHandler } from "hono-openapi";

import { errorHandler, notFoundHandler } from "./middlewares/handlers.js";
import { registerMiddlewares } from "./middlewares/index.js";
import { router } from "./routes/index.js";

export const app = new Hono();

// 1. Middlewares globales
registerMiddlewares(app);

// 2. Archivos estáticos locales
app.use("/assets/*", serveStatic({ root: "./static" }));

// 3. Rutas de nivel servidor (no son lógica de negocio)
app.get("/", (c) => c.text("Hello Hono!"));
app.get("/health", (c) =>
	c.json({
		status: "ok",
		uptime: process.uptime(),
		timestamp: new Date().toISOString(),
	}),
);

// 4. Módulos de negocio bajo /api/v1
app.route("/api/v1", router);

// 5. Especificación OpenAPI 3.1 en formato JSON
//    openAPIRouteHandler recibe `app` para ver TODAS las rutas registradas
app.get(
	"/openapi.json",
	openAPIRouteHandler(app, {
		documentation: {
			info: {
				title: "API Backend Hono",
				version: "1.0.0",
				description:
					"API REST base con Hono, Prisma, Valibot y autenticación por sesión",
			},
			servers: [
				{
					url: "/",
					description: "Servidor Principal (Adaptable a cualquier IP u origen)",
				},
			],
			components: {
				securitySchemes: {
					bearerAuth: {
						type: "http",
						scheme: "bearer",
						description:
							"Ingrese el Token de Sesión obtenido al iniciar sesión. Formato: Bearer {token}",
					},
				},
			},
		},
	}),
);

// 6. Interfaz visual interactiva con Scalar UI en /docs
app.get(
	"/docs",
	Scalar({
		url: "/openapi.json",
		theme: "none",
		customCss: `
      /* --- TEMA PERSONALIZADO ERGONÓMICO --- */

      /* Modo Claro (Soft Light) */
      .light-mode {
        --scalar-color-1: #0f172a;           /* Texto principal (Slate 900) */
        --scalar-color-2: #475569;           /* Texto secundario (Slate 600) */
        --scalar-color-3: #64748b;           /* Texto terciario (Slate 500) */
        --scalar-color-accent: #2563eb;       /* Color de marca / Azul Royal */
        --scalar-background-1: #f8fafc;       /* Fondo principal suave (Slate 50) */
        --scalar-background-2: #f1f5f9;       /* Fondo secundario / Paneles (Slate 100) */
        --scalar-background-3: #e2e8f0;       /* Fondo terciario (Slate 200) */
        --scalar-border-color: #e2e8f0;       /* Color de bordes */
      }

      /* Modo Oscuro (Muted Dark) */
      .dark-mode {
        --scalar-color-1: #f1f5f9;           /* Texto principal (Slate 100) */
        --scalar-color-2: #94a3b8;           /* Texto secundario (Slate 400) */
        --scalar-color-3: #64748b;           /* Texto terciario (Slate 500) */
        --scalar-color-accent: #3b82f6;       /* Color de marca / Azul de Enlace */
        --scalar-background-1: #0f172a;       /* Fondo principal oscuro (Slate 900) */
        --scalar-background-2: #1e293b;       /* Fondo secundario / Paneles (Slate 800) */
        --scalar-background-3: #334155;       /* Fondo terciario (Slate 700) */
        --scalar-border-color: #1e293b;       /* Color de bordes */
      }

      /* --- MEJORAS EXTRA DE DISEÑO --- */
      .scalar-card {
        border-radius: 12px !important;       /* Bordes suaves */
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03) !important;
      }
      .sidebar {
        font-size: 14px !important;
        font-weight: 500 !important;
      }
      /* Suavizado de tipografías */
      body {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
    `,
	}),
);

// 7. Manejadores globales de errores (al final del ciclo)
app.notFound(notFoundHandler);
app.onError(errorHandler);
