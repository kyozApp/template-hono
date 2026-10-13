import argon2 from "argon2";

import { db } from "./db.js";

// ─── Constantes Declarativas Base ───────────────────────────────────────────

const INITIAL_USERS = [
	{
		name: "Administrador",
		username: "admin",
		email: "admin@gmail.com",
		passwordRaw: "123456789",
		role: "ADMIN",
		isActive: true,
	},
];

// ─── Función Principal de Ejecución ─────────────────────────────────────────

const main = async () => {
	console.info("🌱 Iniciando seed de la base de datos...\n");

	// Crear usuarios
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
				isActive: u.isActive,
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
