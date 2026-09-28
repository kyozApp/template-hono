import type { Role } from "./constants.js";

/**
 * Representación del usuario autenticado en la sesión
 */
export interface SessionUser {
	id: string;
	name: string;
	username: string;
	email: string;
	role: Role;
}

/**
 * Variables inyectadas en el contexto de Hono para rutas protegidas
 */
export interface AppVariables {
	Variables: {
		sessionId: string;
		user: SessionUser;
	};
}
