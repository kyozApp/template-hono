import { createMiddleware } from "hono/factory";

import type { Role } from "../config/constants.js";
import type { AppVariables } from "../config/types.js";
import { db } from "../prisma/db.js";
import { AppException } from "./handlers.js";

export const requireRole = (allowedRoles: Role[]) =>
	createMiddleware<AppVariables>(async (c, next) => {
		// 1. Obtener la cabecera Authorization
		const authHeader = c.req.header("Authorization");

		if (!authHeader?.startsWith("Bearer ")) {
			throw new AppException(401, {
				message: "No autorizado. Token no proporcionado.",
				code: "UNAUTHORIZED",
			});
		}

		const token = authHeader.split(" ")[1];

		// 2. Buscar la sesión y el usuario en base de datos con una sola consulta (JOIN)
		const session = await db.orm.public.Session.where({ id: token })
			.include("user")
			.first();

		if (!session?.user) {
			throw new AppException(401, {
				message: "Sesión no válida o inexistente.",
				code: "INVALID_SESSION",
			});
		}

		const user = session.user;

		// 3. Comprobar si la sesión ha expirado
		if (new Date() > new Date(session.expiresAt)) {
			await db.orm.public.Session.where({ id: token })
				.delete()
				.catch(() => {});
			throw new AppException(401, {
				message: "La sesión ha expirado. Inicia sesión nuevamente.",
				code: "EXPIRED_SESSION",
			});
		}

		// 4. Comprobar si el usuario continúa activo
		if (!user.isActive) {
			await db.orm.public.Session.where({ id: token })
				.delete()
				.catch(() => {});
			throw new AppException(401, {
				message: "El usuario está inactivo.",
				code: "INACTIVE_USER",
			});
		}

		// 5. Control de Acceso Basado en Roles (RBAC) con bypass de SUPERADMIN
		if (user.role !== "SUPERADMIN" && !allowedRoles.includes(user.role)) {
			throw new AppException(403, {
				message: "No tiene permisos para acceder a este recurso.",
				code: "FORBIDDEN",
			});
		}

		// 6. Inyectar sessionId y user al contexto de Hono
		c.set("sessionId", token);
		c.set("user", {
			id: user.id,
			name: user.name,
			username: user.username,
			email: user.email,
			role: user.role,
		});

		await next();
	});
