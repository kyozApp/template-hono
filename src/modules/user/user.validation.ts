import * as v from "valibot";

import { ROLES } from "../../config/constants.js";

// ============================================================
// QUERIES (Consultas / Lectura)
// ============================================================

/**
 * Listar usuarios
 */
export const listUserSchema = {
	response: v.array(
		v.pipe(
			v.object({
				id: v.pipe(v.string(), v.uuid()),
				name: v.string(),
				username: v.string(),
				email: v.string(),
				role: v.picklist(ROLES),
				isActive: v.boolean(),
				createdAt: v.string(),
				updatedAt: v.string(),
			}),
			v.readonly(),
		),
	),
};

export type ListUserResponseOutput = v.InferOutput<
	typeof listUserSchema.response
>;

/**
 * Detalles de usuario por ID
 */
export const detailUserSchema = {
	params: v.object({
		id: v.pipe(
			v.string(),
			v.uuid("El ID de usuario no es válido."),
			v.description("UUID del usuario a consultar."),
			v.examples(["019557a2-7b81-7f83-99b8-17a412b3c4d5"]),
		),
	}),
	response: v.pipe(
		v.object({
			id: v.pipe(v.string(), v.uuid()),
			name: v.string(),
			username: v.string(),
			email: v.string(),
			role: v.picklist(ROLES),
			isActive: v.boolean(),
			createdAt: v.string(),
			updatedAt: v.string(),
		}),
		v.readonly(),
	),
};

export type DetailUserParamsOutput = v.InferOutput<
	typeof detailUserSchema.params
>;
export type DetailUserResponseOutput = v.InferOutput<
	typeof detailUserSchema.response
>;

// ============================================================
// COMMANDS (Mutaciones / Escritura)
// ============================================================

/**
 * Crear usuario
 */
export const createUserSchema = {
	body: v.object({
		name: v.pipe(
			v.string("El nombre ingresado no es válido."),
			v.trim(),
			v.minLength(1, "El nombre completo es obligatorio."),
			v.minLength(3, "El nombre completo debe tener al menos 3 letras."),
			v.description("Nombre completo del usuario."),
			v.examples(["Carlos Ramírez López"]),
		),
		username: v.pipe(
			v.string("El usuario ingresado no es válido."),
			v.trim(),
			v.toLowerCase(),
			v.minLength(1, "El usuario es obligatorio."),
			v.minLength(3, "El usuario debe tener al menos 3 caracteres."),
			v.description("Nombre de usuario único."),
			v.examples(["carlos.ramirez"]),
		),
		email: v.pipe(
			v.string("El correo ingresado no es válido."),
			v.trim(),
			v.toLowerCase(),
			v.minLength(1, "El correo electrónico es obligatorio."),
			v.email("Ingresa un correo electrónico válido."),
			v.description("Correo electrónico del usuario."),
			v.examples(["carlos@empresa.com"]),
		),
		password: v.pipe(
			v.string("La contraseña ingresada no es válida."),
			v.trim(),
			v.minLength(1, "La contraseña es obligatoria."),
			v.minLength(8, "La contraseña debe tener al menos 8 letras o números."),
			v.description("Contraseña del usuario (mínimo 8 caracteres)."),
			v.examples(["Segura@1234"]),
		),
		role: v.optional(
			v.pipe(
				v.picklist(ROLES, "El rol especificado no es válido."),
				v.description("Rol asignado al usuario."),
			),
			"USER",
		),
		isActive: v.optional(
			v.pipe(
				v.boolean("isActive debe ser un booleano."),
				v.description("Estado activo/inactivo de la cuenta."),
			),
			true,
		),
	}),
};

export type CreateUserBodyOutput = v.InferOutput<typeof createUserSchema.body>;

/**
 * Actualizar usuario (PATCH parcial)
 */
export const updateUserSchema = {
	params: v.object({
		id: v.pipe(
			v.string(),
			v.uuid("El ID de usuario no es válido."),
			v.description("UUID del usuario a actualizar."),
			v.examples(["019557a2-7b81-7f83-99b8-17a412b3c4d5"]),
		),
	}),
	body: v.object({
		name: v.optional(
			v.pipe(
				v.string("El nombre ingresado no es válido."),
				v.trim(),
				v.minLength(1, "El nombre completo no puede estar vacío."),
				v.minLength(3, "El nombre completo debe tener al menos 3 letras."),
				v.description("Nombre completo del usuario."),
				v.examples(["Carlos Ramírez López"]),
			),
		),
		username: v.optional(
			v.pipe(
				v.string("El usuario ingresado no es válido."),
				v.trim(),
				v.toLowerCase(),
				v.minLength(1, "El usuario no puede estar vacío."),
				v.minLength(3, "El usuario debe tener al menos 3 caracteres."),
				v.description("Nombre de usuario único."),
				v.examples(["carlos.ramirez"]),
			),
		),
		email: v.optional(
			v.pipe(
				v.string("El correo ingresado no es válido."),
				v.trim(),
				v.toLowerCase(),
				v.email("Ingresa un correo electrónico válido."),
				v.description("Correo electrónico del usuario."),
				v.examples(["carlos@empresa.com"]),
			),
		),
		password: v.optional(
			v.pipe(
				v.string("La contraseña no es válida."),
				v.trim(),
				v.minLength(8, "La contraseña debe tener al menos 8 caracteres."),
				v.description("Nueva contraseña del usuario (opcional)."),
				v.examples(["NuevaClave@1234"]),
			),
		),
		role: v.optional(
			v.pipe(
				v.picklist(ROLES, "El rol especificado no es válido."),
				v.description("Rol asignado al usuario."),
			),
		),
		isActive: v.optional(
			v.pipe(
				v.boolean("isActive debe ser un booleano."),
				v.description("Estado activo/inactivo de la cuenta."),
			),
		),
	}),
};

export type UpdateUserParamsOutput = v.InferOutput<
	typeof updateUserSchema.params
>;
export type UpdateUserBodyOutput = v.InferOutput<typeof updateUserSchema.body>;

/**
 * Eliminar usuario
 */
export const deleteUserSchema = {
	params: v.object({
		id: v.pipe(
			v.string(),
			v.uuid("El ID de usuario no es válido."),
			v.description("UUID del usuario a eliminar."),
			v.examples(["019557a2-7b81-7f83-99b8-17a412b3c4d5"]),
		),
	}),
};

export type DeleteUserParamsOutput = v.InferOutput<
	typeof deleteUserSchema.params
>;

/**
 * Cambiar estado de usuario
 */
export const toggleUserStatusSchema = {
	params: v.object({
		id: v.pipe(
			v.string(),
			v.uuid("El ID de usuario no es válido."),
			v.description("UUID del usuario a cambiar estado."),
			v.examples(["019557a2-7b81-7f83-99b8-17a412b3c4d5"]),
		),
	}),
};

export type ToggleUserStatusParamsOutput = v.InferOutput<
	typeof toggleUserStatusSchema.params
>;
