import type { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";

import { env } from "../config/env.js";

/**
 * Registra los middlewares transversales sobre la instancia de Hono.
 */
export const registerMiddlewares = (app: Hono) => {
	// 1. Trazabilidad: identificador único de 21 caracteres por petición
	app.use("*", requestId({ limitLength: 21 }));

	// 2. Políticas de CORS utilizando las variables de entorno validadas
	app.use(
		"*",
		cors({
			origin: env.CORS_ORIGIN,
			allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
			allowHeaders: ["Content-Type", "Authorization"],
			credentials: true,
		}),
	);
};
