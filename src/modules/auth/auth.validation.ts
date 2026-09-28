import * as v from "valibot";

import { ROLES } from "../../config/constants.js";

// ============================================================
// QUERIES (Consultas / Lectura)
// ============================================================

/**
 * Esquema de respuesta para verificación de sesión
 */
export const verifySessionSchema = {
	response: v.pipe(
		v.object({
			token: v.string(),
			user: v.object({
				id: v.pipe(v.string(), v.uuid()),
				name: v.string(),
				username: v.string(),
				email: v.string(),
				role: v.picklist(ROLES),
			}),
		}),
		v.readonly(),
	),
};

export type VerifySessionResponseOutput = v.InferOutput<
	typeof verifySessionSchema.response
>;

// ============================================================
// COMMANDS (Mutaciones / Escritura)
// ============================================================

/**
 * Esquema para registro de nuevo usuario
 */
export const registerSchema = {
	body: v.object({
		name: v.pipe(
			v.string("El nombre ingresado no es válido."),
			v.trim(),
			v.minLength(1, "El nombre completo es obligatorio."),
			v.minLength(3, "El nombre completo debe tener al menos 3 letras."),
			v.description("Nombre completo del usuario."),
			v.examples(["Carlos Ramírez"]),
		),
		username: v.pipe(
			v.string("El usuario ingresado no es válido."),
			v.trim(),
			v.toLowerCase(),
			v.minLength(1, "El usuario es obligatorio."),
			v.minLength(3, "El usuario debe tener al menos 3 caracteres."),
			v.description("Nombre de usuario único (en minúsculas)."),
			v.examples(["carlos.ramirez"]),
		),
		email: v.pipe(
			v.string("El correo electrónico ingresado no es válido."),
			v.trim(),
			v.toLowerCase(),
			v.minLength(1, "El correo electrónico es obligatorio."),
			v.email(
				"Ingresa un correo electrónico válido (ejemplo: nombre@correo.com).",
			),
			v.description("Correo electrónico del usuario."),
			v.examples(["carlos@empresa.com"]),
		),
		password: v.pipe(
			v.string("La contraseña ingresada no es válida."),
			v.trim(),
			v.minLength(1, "La contraseña es obligatoria."),
			v.minLength(8, "La contraseña debe tener al menos 8 letras o números."),
			v.description("Contraseña (mínimo 8 caracteres)."),
			v.examples(["Segura@1234"]),
		),
	}),
};

export type RegisterBodyOutput = v.InferOutput<typeof registerSchema.body>;

/**
 * Esquema para inicio de sesión
 */
export const loginSchema = {
	body: v.object({
		username: v.pipe(
			v.string("El usuario ingresado no es válido."),
			v.trim(),
			v.toLowerCase(),
			v.minLength(1, "El usuario es obligatorio."),
			v.minLength(3, "El usuario debe tener al menos 3 caracteres."),
			v.description("Nombre de usuario registrado."),
			v.examples(["carlos.ramirez"]),
		),
		password: v.pipe(
			v.string("La contraseña ingresada no es válida."),
			v.minLength(1, "La contraseña es obligatoria."),
			v.minLength(8, "La contraseña debe tener al menos 8 letras o números."),
			v.description("Contraseña del usuario."),
			v.examples(["Segura@1234"]),
		),
	}),
	response: v.pipe(
		v.object({
			token: v.string(),
			user: v.object({
				id: v.pipe(v.string(), v.uuid()),
				name: v.string(),
				username: v.string(),
				email: v.string(),
				role: v.picklist(ROLES),
			}),
		}),
		v.readonly(),
	),
};

export type LoginBodyOutput = v.InferOutput<typeof loginSchema.body>;
export type LoginResponseOutput = v.InferOutput<typeof loginSchema.response>;
