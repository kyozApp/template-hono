import argon2 from "argon2";

import { db } from "./db.js";

async function main() {
	console.info("🌱 Iniciando seed de la base de datos...");

	const superadminUsername = "superadmin";
	const superadminEmail = "superadmin@gmail.com";
	const defaultPassword = "superadmin123";

	// 1. Verificar si ya existe por username
	const existingUsername = await db.orm.public.User.first({
		username: superadminUsername,
	});

	if (existingUsername) {
		console.info(
			"ℹ️  El usuario SUPERADMIN ya existe. No se realizaron cambios.",
		);
		return;
	}

	// 2. Verificar si ya existe por email
	const existingEmail = await db.orm.public.User.first({
		email: superadminEmail,
	});

	if (existingEmail) {
		console.info(
			"ℹ️  El correo del SUPERADMIN ya está registrado. No se realizaron cambios.",
		);
		return;
	}

	// 2. Hashear la contraseña con Argon2
	const hashedPassword = await argon2.hash(defaultPassword);

	// 3. Crear el usuario SUPERADMIN
	const user = await db.orm.public.User.select(
		"id",
		"name",
		"username",
		"email",
		"role",
	).create({
		name: "Super Administrador",
		username: superadminUsername,
		email: superadminEmail,
		password: hashedPassword,
		role: "SUPERADMIN",
		isActive: true,
	});

	console.info("✅ Usuario SUPERADMIN creado exitosamente:");
	console.info({
		id: user.id,
		username: user.username,
		email: user.email,
		role: user.role,
	});
}

// Ejecución con manejo de ciclo de vida del proceso y cierre de pool
main()
	.catch((error) => {
		console.error("❌ Error ejecutando el seed:", error);
		process.exit(1);
	})
	.finally(async () => {
		// Importante en Prisma 8: cerrar el pool para que el script termine limpiamente
		await db.close();
	});
