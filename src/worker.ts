import { initBackgroundTasks, stopBackgroundTasks } from "./config/cron.js";
import { db } from "./prisma/db.js";

/**
 * Responsabilidad única: Desconectar y liberar el pool de conexiones de Prisma 8.
 */
const closeDatabaseConnection = async (): Promise<void> => {
	try {
		await db.close();
		console.log("Conexión con la base de datos cerrada.");
	} catch (error) {
		console.error("Error cerrando conexión con la base de datos:", error);
	}
};

/**
 * Responsabilidad única: Coordinar la secuencia de apagado ordenado del worker.
 */
const handleGracefulShutdown = async (signal: string): Promise<void> => {
	console.log(`\nWorker detenido vía ${signal}. Cerrando recursos...`);
	stopBackgroundTasks();
	await closeDatabaseConnection();
	process.exit(0);
};

/**
 * Responsabilidad única: Registrar los listeners de señales del sistema operativo.
 */
const setupShutdownHandlers = (): void => {
	process.on("SIGTERM", () => void handleGracefulShutdown("SIGTERM"));
	process.on("SIGINT", () => void handleGracefulShutdown("SIGINT"));
};

// 1. Iniciar tareas en segundo plano
initBackgroundTasks();

// 2. Registrar manejadores de cierre del proceso
setupShutdownHandlers();
