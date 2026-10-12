import {
	defineContract,
	nativeEnum,
	pg,
} from "@prisma/orm-postgres/contract-builder";

export const contract = defineContract({}, ({ field, model, rel }) => {
	// ─── 1. Enums Nativos (PostgreSQL) ───────────────────────────────────────────

	const Role = nativeEnum("Role", "SUPERADMIN", "ADMIN", "USER", "VIEWER");

	// ─── 2. Modelos Core ─────────────────────────────────────────────────────────

	// Usuario (Autenticación y Perfil)
	const User = model("User", {
		fields: {
			id: field.id.uuidv7Native(),
			name: field.text(),
			username: field.text().unique(),
			email: field.text().unique(),
			password: field.text(),
			role: field.column(pg.enum(Role)).default("USER"),
			isActive: field.boolean().default(true),
			isDeleted: field.boolean().default(false),
			deletedAt: field.temporal.timestamptzString().optional(),
			createdAt: field.temporal.createdAtString(),
			updatedAt: field.temporal.updatedAtString(),
		},
	});

	// Sesión (Persistencia con TTL)
	const Session = model("Session", {
		fields: {
			id: field.id.uuidv7Native(),
			userId: field.uuidNative(),
			expiresAt: field.temporal.timestamptzString(),
			createdAt: field.temporal.createdAtString(),
			updatedAt: field.temporal.updatedAtString(),
		},
	});

	// ─── 3. Relaciones del Dominio ───────────────────────────────────────────────

	return {
		models: {
			User: User.relations({
				sessions: rel.hasMany(Session, { by: "userId" }),
			}),
			Session: Session.relations({
				user: rel.belongsTo(User, { from: "userId", to: "id" }),
			}),
		},
	};
});
