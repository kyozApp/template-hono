import { CronJob } from "cron";

import { runSessionCleanup } from "../tasks/sessionCleanup.task.js";

const jobs: CronJob[] = [];

/**
 * Inicializa todas las tareas programadas en segundo plano.
 */
export const initBackgroundTasks = (): void => {
	console.log("Iniciando tareas programadas en segundo plano...");

	// 1. Limpieza de Sesiones Expiradas - Cada 6 horas
	const cleanupJob = new CronJob("0 */6 * * *", () => {
		void runSessionCleanup();
	});
	jobs.push(cleanupJob);
	cleanupJob.start();

	// Ejecución inicial inmediata al arrancar el worker
	void runSessionCleanup();
};

/**
 * Detiene de forma ordenada todas las tareas en segundo plano.
 */
export const stopBackgroundTasks = (): void => {
	for (const job of jobs) {
		job.stop();
	}
	jobs.length = 0;
	console.log("Tareas en segundo plano detenidas.");
};
