import argon2 from "argon2";

import { db } from "../../prisma/db.js";
import { AuthErrors } from "./auth.error.js";
import type {
	LoginBodyOutput,
	LoginResponseOutput,
	RegisterBodyOutput,
	VerifySessionResponseOutput,
} from "./auth.validation.js";

export const AuthService = {
	// ============================================================
	// QUERIES (Consultas / Lectura)
	// ============================================================

	/**
	 * Obtener los datos de sesión activa del usuario autenticado.
	 */
	async verifySession(
		sessionId: string,
		user: VerifySessionResponseOutput["user"],
	): Promise<VerifySessionResponseOutput> {
		const session = {
			token: sessionId,
			user,
		};

		return session;
	},

	// ============================================================
	// COMMANDS (Mutaciones / Escritura)
	// ============================================================

	/**
	 * Registrar un nuevo usuario con rol USER por defecto y contraseña protegida por Argon2.
	 */
	async register(data: RegisterBodyOutput): Promise<void> {
		const { name, username, email, password } = data;

		// 1. Verificar unicidad de username
		const existingUsername = await db.orm.public.User.first({ username });
		if (existingUsername) {
			throw AuthErrors.usernameAlreadyExists();
		}

		// 2. Verificar unicidad de email
		const existingEmail = await db.orm.public.User.first({ email });
		if (existingEmail) {
			throw AuthErrors.emailAlreadyExists();
		}

		// 2. Hashear contraseña con Argon2
		const hashedPassword = await argon2.hash(password);

		// 3. Crear usuario en PostgreSQL con rol USER por defecto
		await db.orm.public.User.create({
			name,
			username,
			email,
			password: hashedPassword,
			role: "USER",
			isActive: true,
		});
	},

	/**
	 * Autenticar credenciales de usuario y crear una sesión activa persistente en PostgreSQL.
	 */
	async login(data: LoginBodyOutput): Promise<LoginResponseOutput> {
		const { username, password } = data;

		// 1. Buscar usuario registrado
		const user = await db.orm.public.User.first({ username });
		if (!user) {
			throw AuthErrors.userNotFound();
		}

		// 2. Verificar estado de la cuenta
		if (!user.isActive) {
			throw AuthErrors.inactiveAccount();
		}

		// 3. Verificar contraseña provista
		const isPasswordValid = await argon2.verify(user.password, password);
		if (!isPasswordValid) {
			throw AuthErrors.invalidCredentials();
		}

		// 4. Crear sesión activa válida por 12 horas
		const expirationDate = new Date(Date.now() + 1000 * 60 * 60 * 12);

		const session = await db.orm.public.Session.create({
			userId: user.id,
			expiresAt: expirationDate.toISOString(),
		});

		// 5. Retornar token y perfil del usuario autenticado
		const authData = {
			token: session.id,
			user: {
				id: user.id,
				name: user.name,
				username: user.username,
				email: user.email,
				role: user.role,
			},
		};

		return authData;
	},

	/**
	 * Cerrar sesión activa eliminando el token de sesión de la base de datos.
	 */
	async logout(token: string): Promise<void> {
		await db.orm.public.Session.where({ id: token }).delete();
	},
};
