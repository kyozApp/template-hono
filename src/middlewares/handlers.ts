import type { ErrorHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

/**
 * Excepción personalizada de aplicación que añade un código de negocio semántico y detalles opcionales.
 */
export class AppException extends HTTPException {
	readonly code: string;
	readonly details?: Record<string, string[]>;

	constructor(
		status: ContentfulStatusCode,
		options: {
			message: string;
			code: string;
			details?: Record<string, string[]>;
		},
	) {
		super(status, { message: options.message });
		this.code = options.code;
		this.details = options.details;
	}
}

/**
 * Captura solicitudes a rutas no existentes (404).
 */
export const notFoundHandler: NotFoundHandler = (c) => {
	return c.json(
		{
			success: false,
			message: "Recurso no encontrado",
			code: "NOT_FOUND",
			statusCode: 404,
			data: null,
			error: `La ruta ${c.req.path} no existe`,
		},
		404,
	);
};

/**
 * Intercepta excepciones HTTP y errores imprevistos (500).
 */
export const errorHandler: ErrorHandler = (err, c) => {
	if (err instanceof HTTPException) {
		const code = err instanceof AppException ? err.code : "HTTP_EXCEPTION";

		return c.json(
			{
				success: false,
				message: err.message,
				code,
				statusCode: err.status,
				data: null,
				error: err instanceof AppException ? (err.details ?? null) : null,
			},
			err.status,
		);
	}

	console.error(`[ERROR DEL SERVIDOR]: ${err.message}`);

	return c.json(
		{
			success: false,
			message: "Error interno del servidor",
			code: "INTERNAL_SERVER_ERROR",
			statusCode: 500,
			data: null,
			error: "Ups, algo salió mal",
		},
		500,
	);
};
