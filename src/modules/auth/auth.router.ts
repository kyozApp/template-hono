import { Hono } from "hono";
import { timeout } from "hono/timeout";

import { describeRoute, resolver } from "hono-openapi";
import * as v from "valibot";

import type { AppVariables } from "../../config/types.js";
import { requireRole } from "../../middlewares/auth.middleware.js";
import { customTimeoutException } from "../../middlewares/timeoutException.js";
import {
	envelopeSchema,
	validator,
} from "../../middlewares/validationHelper.js";
import { AuthService } from "./auth.service.js";
import {
	loginSchema,
	registerSchema,
	verifySessionSchema,
} from "./auth.validation.js";

export const authRouter = new Hono<AppVariables>();

// Tiempo de espera de 10s máximo para las rutas
authRouter.use("*", timeout(10_000, customTimeoutException));

// ============================================================
// QUERIES (Consultas / Lectura)
// ============================================================

authRouter.get(
	"/verificar-sesion",
	requireRole(["SUPERADMIN", "ADMIN", "USER", "VIEWER"]),
	describeRoute({
		description: "Verifica si la sesión actual está activa y es válida.",
		tags: ["Autenticación"],
		security: [{ bearerAuth: [] }],
		responses: {
			200: {
				description: "Sesión activa",
				content: {
					"application/json": {
						schema: resolver(envelopeSchema(verifySessionSchema.response)),
					},
				},
			},
			401: { description: "No autenticado. Token inválido o expirado." },
		},
	}),
	async (c) => {
		const sessionId = c.get("sessionId");
		const user = c.get("user");
		const session = await AuthService.verifySession(sessionId, user);
		return c.json(
			{
				success: true,
				message: "Sesión activa",
				code: "SESSION_ACTIVE",
				statusCode: 200,
				data: session,
				error: null,
			},
			200,
		);
	},
);

// ============================================================
// COMMANDS (Mutaciones / Escritura)
// ============================================================

authRouter.post(
	"/registrar-usuario",
	describeRoute({
		description: "Registra un nuevo usuario en el sistema.",
		tags: ["Autenticación"],
		responses: {
			201: {
				description: "Usuario registrado exitosamente",
				content: {
					"application/json": {
						schema: resolver(envelopeSchema(v.null())),
					},
				},
			},
			400: { description: "Datos de entrada inválidos." },
			409: { description: "Conflicto. El usuario o correo ya existen." },
		},
	}),
	validator("json", registerSchema.body),
	async (c) => {
		const data = c.req.valid("json");
		await AuthService.register(data);
		return c.json(
			{
				success: true,
				message: "Registro de usuario realizado exitosamente",
				code: "REGISTER",
				statusCode: 201,
				data: null,
				error: null,
			},
			201,
		);
	},
);

authRouter.post(
	"/iniciar-sesion",
	describeRoute({
		description: "Inicia sesión y genera un token de acceso.",
		tags: ["Autenticación"],
		responses: {
			200: {
				description: "Inicio de sesión exitoso",
				content: {
					"application/json": {
						schema: resolver(envelopeSchema(loginSchema.response)),
					},
				},
			},
			400: { description: "Datos de entrada inválidos." },
			401: { description: "Credenciales inválidas." },
		},
	}),
	validator("json", loginSchema.body),
	async (c) => {
		const data = c.req.valid("json");
		const authData = await AuthService.login(data);
		return c.json(
			{
				success: true,
				message: "Inicio de sesión exitosamente",
				code: "LOGIN",
				statusCode: 200,
				data: authData,
				error: null,
			},
			200,
		);
	},
);

authRouter.post(
	"/cerrar-sesion",
	requireRole(["SUPERADMIN", "ADMIN", "USER", "VIEWER"]),
	describeRoute({
		description: "Cierra la sesión activa invalidando el token.",
		tags: ["Autenticación"],
		security: [{ bearerAuth: [] }],
		responses: {
			200: {
				description: "Cierre de sesión exitoso",
				content: {
					"application/json": {
						schema: resolver(envelopeSchema(v.null())),
					},
				},
			},
			401: { description: "No autenticado. Token inválido o expirado." },
		},
	}),
	async (c) => {
		const sessionId = c.get("sessionId");
		await AuthService.logout(sessionId);
		return c.json(
			{
				success: true,
				message: "Cerrar sesión exitosamente",
				code: "LOGOUT",
				statusCode: 200,
				data: null,
				error: null,
			},
			200,
		);
	},
);
