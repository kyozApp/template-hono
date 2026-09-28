import * as v from "valibot";

/**
 * Esquema de validación y tipado para las variables de entorno del sistema.
 * Centraliza la configuración, aplica valores por defecto y garantiza un inicio seguro.
 */
const EnvSchema = v.object({
	/**
	 * Puerto de escucha del servidor HTTP.
	 * @default "3000"
	 */
	PORT: v.optional(
		v.pipe(
			v.string(),
			v.trim(),
			v.toNumber(),
			v.integer("PORT debe ser un número entero válido"),
		),
		"3000",
	),

	/**
	 * Orígenes permitidos para políticas de CORS.
	 * Admite comodín '*' o una lista de dominios separados por coma.
	 * @default "*"
	 */
	CORS_ORIGIN: v.optional(
		v.pipe(
			v.string(),
			v.trim(),
			v.transform((val) =>
				val === "*"
					? "*"
					: val
							.split(",")
							.map((item) => item.trim())
							.filter(Boolean),
			),
		),
		"*",
	),

	/**
	 * Cadena de conexión a PostgreSQL utilizada por Prisma ORM.
	 * Requerida estrictamente para el funcionamiento de la base de datos.
	 */
	DATABASE_URL: v.pipe(
		v.string(),
		v.trim(),
		v.nonEmpty("DATABASE_URL es requerida y no puede estar vacía"),
	),
});

// Validación temprana al arranque (Fail-Fast): detiene el proceso si la configuración es inválida
const result = v.safeParse(EnvSchema, process.env);

if (!result.success) {
	const { nested } = v.flatten(result.issues);

	console.error("\n❌ Error en las variables de entorno:");
	for (const [variable, messages] of Object.entries(nested ?? {})) {
		// Traduce el mensaje genérico de clave faltante de Valibot a un texto claro
		const cleanMessages = messages?.map((msg) =>
			msg.includes("Invalid key:")
				? "Variable requerida no definida en el archivo .env"
				: msg,
		);
		console.error(`• [${variable}]: ${cleanMessages?.join(", ")}`);
	}
	console.error("");
	process.exit(1);
}

/**
 * Objeto de configuración validado e inmutable listo para consumir en toda la aplicación.
 */
export const env = result.output;

/**
 * Tipo inferido de la configuración para autocompletado y verificación de tipos en TypeScript.
 */
export type Config = v.InferOutput<typeof EnvSchema>;
