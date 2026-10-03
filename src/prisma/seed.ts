import argon2 from "argon2";

import { db } from "./db.js";

// ─── Constantes Declarativas Base ───────────────────────────────────────────

const INITIAL_USERS = [
	{
		name: "Super Administrador",
		username: "superadmin",
		email: "superadmin@gmail.com",
		passwordRaw: "superadmin123",
		role: "SUPERADMIN" as const,
	},
	{
		name: "Administrador",
		username: "admin",
		email: "admin@gmail.com",
		passwordRaw: "admin123",
		role: "ADMIN" as const,
	},
	{
		name: "User",
		username: "user",
		email: "user@gmail.com",
		passwordRaw: "user1234",
		role: "USER" as const,
	},
	{
		name: "Auditor Visitante",
		username: "visitante",
		email: "visitante@gmail.com",
		passwordRaw: "visitante123",
		role: "VIEWER" as const,
	},
];

// ─── Función Principal de Ejecución ─────────────────────────────────────────

const main = async () => {
	console.info(
		"🌱 Iniciando seed de la base de datos (Catálogos y Pruebas)...\n",
	);

	// 1. Usuarios Base por Rol (SUPERADMIN, ADMIN, USER, VIEWER)
	// Se verifica primero la existencia para evitar hashear innecesariamente con Argon2 en ejecuciones repetidas
	for (const u of INITIAL_USERS) {
		const existingUser = await db.orm.public.User.first({
			username: u.username,
		});

		if (!existingUser) {
			const user = await db.orm.public.User.create({
				name: u.name,
				username: u.username,
				email: u.email,
				password: await argon2.hash(u.passwordRaw),
				role: u.role,
				isActive: true,
				isDeleted: false,
			});
			console.info(
				`✅ Usuario ${u.role} (${user.username}) creado exitosamente.`,
			);
		} else {
			console.info(
				`ℹ️  Usuario ${u.role} (${u.username}) ya asegurado en la base de datos.`,
			);
		}
	}

	console.info("\n🌱 Seed finalizado con éxito.");
};

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
