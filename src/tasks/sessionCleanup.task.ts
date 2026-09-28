import { db } from "../prisma/db.js";

/**
 * Operación en base de datos: elimina de PostgreSQL las sesiones expiradas.
 */
const deleteExpiredSessions = async (
	beforeIsoDate: string,
): Promise<number> => {
	const deletedCount = await db.orm.public.Session.where((s) =>
		s.expiresAt.lt(beforeIsoDate),
	).deleteAndCount();

	return deletedCount;
};

/**
 * Tarea en segundo plano: ejecuta la limpieza periódica de sesiones vencidas.
 */
export const runSessionCleanup = async (): Promise<void> => {
	try {
		const now = new Date().toISOString();
		const deletedCount = await deleteExpiredSessions(now);

		if (deletedCount > 0) {
			console.log(
				`[Session Cleanup] Se eliminaron ${deletedCount} sesiones expiradas.`,
			);
		}
	} catch (error) {
		console.error(
			"[ERROR] [Session Cleanup]: Fallo al depurar sesiones:",
			error,
		);
	}
};
