import { validator as openApiValidator } from "hono-openapi";
import * as v from "valibot";

/**
 * Middleware que ejecuta la validación de Valibot y documenta
 * los parámetros y cuerpos en OpenAPI.
 */
export const validator = <T extends v.GenericSchema>(
	target: Parameters<typeof openApiValidator>[0],
	schema: T,
) => {
	return openApiValidator(target, schema, (result, c) => {
		if (!result.success) {
			const errors: Record<string, string[]> = {};

			for (const issue of result.error) {
				let key: string | undefined;

				if (issue.path && issue.path.length > 0) {
					const segment = issue.path[0];
					if (typeof segment === "string" || typeof segment === "number") {
						key = String(segment);
					} else if (
						typeof segment === "object" &&
						segment !== null &&
						"key" in segment
					) {
						key = String((segment as { key: unknown }).key);
					}
				}

				if (!key) {
					continue;
				}

				const message = issue.message.startsWith("Invalid key:")
					? `El campo "${key}" es requerido`
					: issue.message;

				if (!(key in errors)) {
					errors[key] = [];
				}
				errors[key].push(message);
			}

			return c.json(
				{
					success: false,
					message: "Datos de entrada inválidos",
					code: "VALIDATION_ERROR",
					statusCode: 400,
					data: null,
					error: errors,
				},
				400,
			);
		}
	});
};

/**
 * Envoltura estándar de respuesta HTTP exitosa para OpenAPI/Valibot.
 */
export const envelopeSchema = <T extends v.GenericSchema>(dataSchema: T) =>
	v.object({
		success: v.literal(true),
		message: v.string(),
		code: v.string(),
		statusCode: v.number(),
		data: dataSchema,
		error: v.null(),
	});
