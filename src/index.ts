import { serve } from "@hono/node-server";

import { app } from "./app.js";
import { env } from "./config/env.js";
import { db } from "./prisma/db.js";

const server = serve(
	{
		fetch: app.fetch,
		port: env.PORT,
	},
	(info) => {
		console.log(`Servidor corriendo en http://localhost:${info.port}`);
	},
);

/**
 * Responsabilidad única: Cerrar el servidor HTTP y esperar a que las peticiones activas finalicen.
 */
const closeHttpServer = (): Promise<void> =>
	new Promise((resolve, reject) => {
		if (
			"closeIdleConnections" in server &&
			typeof server.closeIdleConnections === "function"
		) {
			server.closeIdleConnections();
		}
		server.close((err) => (err ? reject(err) : resolve()));
	});

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
 * Responsabilidad única: Coordinar la secuencia de apagado ordenado del servidor HTTP.
 */
const handleGracefulShutdown = async (signal: string): Promise<void> => {
	console.log(`\nServidor detenido vía ${signal}. Cerrando recursos...`);

	// Temporizador de emergencia: forzar salida si no termina en 10 segundos
	const forceTimeout = setTimeout(() => {
		console.error("Tiempo límite de apagado agotado. Forzando cierre...");
		process.exit(1);
	}, 10_000);
	forceTimeout.unref();

	try {
		await closeHttpServer();
		console.log("Servidor HTTP cerrado.");

		await closeDatabaseConnection();
	} catch (error) {
		console.error("Error durante el apagado del servidor:", error);
		process.exit(1);
	}

	process.exit(0);
};

/**
 * Responsabilidad única: Registrar los listeners de señales del sistema operativo.
 */
const setupShutdownHandlers = (): void => {
	process.on("SIGTERM", () => void handleGracefulShutdown("SIGTERM"));
	process.on("SIGINT", () => void handleGracefulShutdown("SIGINT"));
};

// 1. Registrar manejadores de cierre del proceso
setupShutdownHandlers();
