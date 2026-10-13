import { db } from "../src/prisma/db.js";

async function main() {
	console.info(
		"🚀 [Script] Iniciando auditoría y normalización de usuarios...",
	);
	const startTime = Date.now();

	try {
		// 1. Obtener todos los usuarios registrados
		const users = await db.orm.public.User.select(
			"id",
			"username",
			"email",
			"role",
			"isActive",
		).all();

		console.info(`📊 Total de usuarios encontrados: ${users.length}`);

		let normalizedCount = 0;
		let activeCount = 0;

		// 2. Procesar y auditar cada registro
		for (const user of users) {
			if (user.isActive) {
				activeCount++;
			}

			const normalizedEmail = user.email.toLowerCase().trim();

			// Si el email tiene mayúsculas o espacios accidentales, normalizarlo
			if (user.email !== normalizedEmail) {
				console.info(
					`✏️  Normalizando email para usuario '${user.username}': "${user.email}" -> "${normalizedEmail}"`,
				);

				await db.orm.public.User.where({ id: user.id }).update({
					email: normalizedEmail,
				});

				normalizedCount++;
			}
		}

		// 3. Resumen final de ejecución
		const elapsedMs = Date.now() - startTime;
		console.info("\n✅ [Script] Ejecución completada con éxito.");
		console.info("--------------------------------------------------");
		console.info(`• Usuarios auditados:    ${users.length}`);
		console.info(`• Usuarios activos:      ${activeCount}`);
		console.info(`• Usuarios normalizados: ${normalizedCount}`);
		console.info(`• Tiempo transcurrido:   ${elapsedMs}ms`);
		console.info("--------------------------------------------------");
	} catch (error) {
		console.error("❌ [Script] Error crítico durante la ejecución:", error);
		process.exit(1);
	} finally {
		// 4. Obligatorio: Cerrar el pool de conexiones de Prisma 8 para liberar recursos
		await db.close();
		console.info(
			"🔌 [Script] Conexión a la base de datos cerrada limpiamente.",
		);
	}
}

// Ejecutar script
void main();
