import argon2 from "argon2";

import { db } from "../../prisma/db.js";
import { UserErrors } from "./user.error.js";
import type {
	CreateUserBodyOutput,
	DeleteUserParamsOutput,
	DetailUserParamsOutput,
	DetailUserResponseOutput,
	ListUserResponseOutput,
	ToggleUserStatusParamsOutput,
	UpdateUserBodyOutput,
	UpdateUserParamsOutput,
} from "./user.validation.js";

export const UserService = {
	// ============================================================
	// QUERIES (Consultas / Lectura)
	// ============================================================

	/**
	 * Listar todos los usuarios del sistema ordenados por fecha de creación descendente.
	 */
	async list(): Promise<ListUserResponseOutput> {
		const users = await db.orm.public.User.select(
			"id",
			"name",
			"username",
			"email",
			"role",
			"isActive",
			"createdAt",
			"updatedAt",
		)
			.orderBy((u) => u.createdAt.desc())
			.all();

		return users;
	},

	/**
	 * Obtener los detalles de un usuario por su ID.
	 */
	async findById(
		params: DetailUserParamsOutput,
	): Promise<DetailUserResponseOutput> {
		const user = await db.orm.public.User.where({ id: params.id })
			.select(
				"id",
				"name",
				"username",
				"email",
				"role",
				"isActive",
				"createdAt",
				"updatedAt",
			)
			.first();

		if (!user) {
			throw UserErrors.userNotFound();
		}

		return user;
	},

	// ============================================================
	// COMMANDS (Mutaciones / Escritura)
	// ============================================================

	/**
	 * Crear un nuevo usuario en el sistema con contraseña hasheada mediante Argon2.
	 */
	async create(data: CreateUserBodyOutput): Promise<void> {
		const { name, username, email, password, role, isActive } = data;

		// 1. Verificar unicidad de username
		const existingUsername = await db.orm.public.User.first({ username });
		if (existingUsername) {
			throw UserErrors.usernameAlreadyExists();
		}

		// 2. Verificar unicidad de email
		const existingEmail = await db.orm.public.User.first({ email });
		if (existingEmail) {
			throw UserErrors.emailAlreadyExists();
		}

		// 2. Hashear contraseña con Argon2
		const hashedPassword = await argon2.hash(password);

		// 3. Crear registro en PostgreSQL
		await db.orm.public.User.create({
			name,
			username,
			email,
			password: hashedPassword,
			role,
			isActive,
		});
	},

	/**
	 * Actualizar parcialmente los datos de un usuario existente.
	 */
	async update(
		params: UpdateUserParamsOutput,
		data: UpdateUserBodyOutput,
	): Promise<void> {
		// 1. Verificar existencia del usuario
		const existing = await this.findById(params);

		// 2. Si el username cambia, verificar unicidad
		if (data.username && data.username !== existing.username) {
			const usernameTaken = await db.orm.public.User.first({
				username: data.username,
			});
			if (usernameTaken) {
				throw UserErrors.usernameAlreadyExists();
			}
		}

		// 3. Si el email cambia, verificar unicidad
		if (data.email && data.email !== existing.email) {
			const emailTaken = await db.orm.public.User.first({
				email: data.email,
			});
			if (emailTaken) {
				throw UserErrors.emailAlreadyExists();
			}
		}

		// 4. Hashear contraseña si se incluye en la actualización
		let hashedPassword: string | undefined;
		if (data.password) {
			hashedPassword = await argon2.hash(data.password);
		}

		// 5. Si se desactiva la cuenta, cerrar sus sesiones activas
		if (data.isActive === false) {
			await db.orm.public.Session.where({ userId: params.id }).delete();
		}

		// 6. Aplicar cambios directamente en PostgreSQL
		await db.orm.public.User.where({ id: params.id }).update({
			name: data.name,
			username: data.username,
			email: data.email,
			password: hashedPassword,
			role: data.role,
			isActive: data.isActive,
		});
	},

	/**
	 * Eliminar un usuario y sus sesiones activas (evita auto-eliminación).
	 */
	async delete(
		params: DeleteUserParamsOutput,
		currentUserId?: string,
	): Promise<void> {
		// 1. Evitar auto-eliminación
		if (currentUserId && params.id === currentUserId) {
			throw UserErrors.cannotDeleteSelf();
		}

		// 2. Verificar existencia
		await this.findById(params);

		// 3. Eliminar sesiones asociadas primero (integridad referencial)
		await db.orm.public.Session.where({ userId: params.id }).delete();

		// 4. Eliminar el registro del usuario
		await db.orm.public.User.where({ id: params.id }).delete();
	},

	/**
	 * Alternar el estado activo/inactivo (isActive) de un usuario.
	 */
	async toggleStatus(params: ToggleUserStatusParamsOutput): Promise<void> {
		// 1. Verificar existencia del usuario
		const existing = await this.findById(params);

		// 2. Invertir estado actual
		const newIsActive = !existing.isActive;

		// 3. Si se desactiva la cuenta, cerrar sus sesiones activas
		if (!newIsActive) {
			await db.orm.public.Session.where({ userId: params.id }).delete();
		}

		// 4. Aplicar cambio de estado
		await db.orm.public.User.where({ id: params.id }).update({
			isActive: newIsActive,
		});
	},
};
