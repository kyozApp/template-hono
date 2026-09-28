import { Hono } from "hono";

import { describeRoute, resolver } from "hono-openapi";
import * as v from "valibot";

import type { AppVariables } from "../../config/types.js";
import { requireRole } from "../../middlewares/auth.middleware.js";
import {
	envelopeSchema,
	validator,
} from "../../middlewares/validationHelper.js";
import { UserService } from "./user.service.js";
import {
	createUserSchema,
	deleteUserSchema,
	detailUserSchema,
	listUserSchema,
	toggleUserStatusSchema,
	updateUserSchema,
} from "./user.validation.js";

export const userRouter = new Hono<AppVariables>();

userRouter.use("*", requireRole(["SUPERADMIN", "ADMIN"]));

// ============================================================
// QUERIES (Consultas / Lectura)
// ============================================================

userRouter.get(
	"/",
	describeRoute({
		description:
			"Obtiene la lista completa de usuarios registrados sin exponer contraseñas.",
		tags: ["Usuarios"],
		security: [{ bearerAuth: [] }],
		responses: {
			200: {
				description: "Lista de usuarios obtenida exitosamente",
				content: {
					"application/json": {
						schema: resolver(envelopeSchema(listUserSchema.response)),
					},
				},
			},
			401: { description: "No autenticado. Token no válido o expirado." },
			403: {
				description: "Acceso denegado. Se requiere rol de administrador.",
			},
		},
	}),
	async (c) => {
		const users = await UserService.list();
		return c.json(
			{
				success: true,
				message: "Lista de usuarios",
				code: "LIST_USERS",
				statusCode: 200,
				data: users,
				error: null,
			},
			200,
		);
	},
);

userRouter.get(
	"/:id",
	describeRoute({
		description: "Obtiene los datos detallados de un usuario por su UUID.",
		tags: ["Usuarios"],
		security: [{ bearerAuth: [] }],
		responses: {
			200: {
				description: "Detalles del usuario obtenidos exitosamente",
				content: {
					"application/json": {
						schema: resolver(envelopeSchema(detailUserSchema.response)),
					},
				},
			},
			400: { description: "ID de usuario inválido." },
			401: { description: "No autenticado." },
			403: { description: "Acceso denegado." },
			404: { description: "Usuario no encontrado." },
		},
	}),
	validator("param", detailUserSchema.params),
	async (c) => {
		const params = c.req.valid("param");
		const user = await UserService.findById(params);
		return c.json(
			{
				success: true,
				message: "Detalles del usuario",
				code: "GET_USER_DETAILS",
				statusCode: 200,
				data: user,
				error: null,
			},
			200,
		);
	},
);

// ============================================================
// COMMANDS (Mutaciones / Escritura)
// ============================================================

userRouter.post(
	"/",
	describeRoute({
		description: "Crea un nuevo usuario en el sistema con contraseña hasheada.",
		tags: ["Usuarios"],
		security: [{ bearerAuth: [] }],
		responses: {
			201: {
				description: "Usuario creado exitosamente",
				content: {
					"application/json": {
						schema: resolver(envelopeSchema(v.null())),
					},
				},
			},
			400: { description: "Datos de entrada inválidos." },
			401: { description: "No autenticado." },
			403: { description: "Acceso denegado." },
			409: { description: "El nombre de usuario o correo ya existen." },
		},
	}),
	validator("json", createUserSchema.body),
	async (c) => {
		const data = c.req.valid("json");
		await UserService.create(data);
		return c.json(
			{
				success: true,
				message: "Usuario creado exitosamente",
				code: "CREATE_USER",
				statusCode: 201,
				data: null,
				error: null,
			},
			201,
		);
	},
);

userRouter.patch(
	"/:id",
	describeRoute({
		description: "Actualiza los datos de un usuario existente.",
		tags: ["Usuarios"],
		security: [{ bearerAuth: [] }],
		responses: {
			200: {
				description: "Usuario actualizado exitosamente",
				content: {
					"application/json": {
						schema: resolver(envelopeSchema(v.null())),
					},
				},
			},
			400: { description: "Datos de entrada inválidos." },
			401: { description: "No autenticado." },
			403: { description: "Acceso denegado." },
			404: { description: "Usuario no encontrado." },
			409: { description: "El nombre de usuario o correo ya existen." },
		},
	}),
	validator("param", updateUserSchema.params),
	validator("json", updateUserSchema.body),
	async (c) => {
		const params = c.req.valid("param");
		const data = c.req.valid("json");
		await UserService.update(params, data);
		return c.json(
			{
				success: true,
				message: "Usuario actualizado exitosamente",
				code: "UPDATE_USER",
				statusCode: 200,
				data: null,
				error: null,
			},
			200,
		);
	},
);

userRouter.delete(
	"/:id",
	describeRoute({
		description:
			"Elimina un usuario y revoca todas sus sesiones activas (no permite auto-eliminación).",
		tags: ["Usuarios"],
		security: [{ bearerAuth: [] }],
		responses: {
			200: {
				description: "Usuario eliminado exitosamente",
				content: {
					"application/json": {
						schema: resolver(envelopeSchema(v.null())),
					},
				},
			},
			400: { description: "ID inválido o intento de auto-eliminación." },
			401: { description: "No autenticado." },
			403: { description: "Acceso denegado." },
			404: { description: "Usuario no encontrado." },
		},
	}),
	validator("param", deleteUserSchema.params),
	async (c) => {
		const params = c.req.valid("param");
		const currentUser = c.get("user");
		await UserService.delete(params, currentUser.id);
		return c.json(
			{
				success: true,
				message: "Usuario eliminado exitosamente",
				code: "DELETE_USER",
				statusCode: 200,
				data: null,
				error: null,
			},
			200,
		);
	},
);

userRouter.post(
	"/toggle-status/:id",
	describeRoute({
		description:
			"Cambia el estado activo/inactivo de un usuario invirtiendo su valor actual.",
		tags: ["Usuarios"],
		security: [{ bearerAuth: [] }],
		responses: {
			200: {
				description: "Estado de usuario actualizado exitosamente",
				content: {
					"application/json": {
						schema: resolver(envelopeSchema(v.null())),
					},
				},
			},
			400: { description: "ID de usuario inválido." },
			401: { description: "No autenticado." },
			403: { description: "Acceso denegado." },
			404: { description: "Usuario no encontrado." },
		},
	}),
	validator("param", toggleUserStatusSchema.params),
	async (c) => {
		const params = c.req.valid("param");
		await UserService.toggleStatus(params);
		return c.json(
			{
				success: true,
				message: "Estado de usuario actualizado exitosamente",
				code: "TOGGLE_USER_STATUS",
				statusCode: 200,
				data: null,
				error: null,
			},
			200,
		);
	},
);
