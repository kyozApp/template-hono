import {
	defineContract,
	nativeEnum,
	pg,
} from "@prisma/orm-postgres/contract-builder";

export const contract = defineContract({}, ({ field, model, rel }) => {
	// 1. Enum nativo de PostgreSQL para Roles
	const Role = nativeEnum("Role", "SUPERADMIN", "ADMIN", "USER", "VIEWER");

	// 2. Modelo de Usuario
	const User = model("User", {
		fields: {
			id: field.id.uuidv7Native(),
			name: field.text(),
			username: field.text().unique(),
			email: field.text().unique(),
			password: field.text(),
			role: field.column(pg.enum(Role)).default("USER"),
			isActive: field.boolean().default(true),
			createdAt: field.temporal.createdAtString(),
			updatedAt: field.temporal.updatedAtString(),
		},
	});

	// 3. Modelo de Sesión activa
	const Session = model("Session", {
		fields: {
			id: field.id.uuidv7Native(),
			userId: field.uuidNative(),
			expiresAt: field.temporal.timestamptzString(),
			createdAt: field.temporal.createdAtString(),
			updatedAt: field.temporal.updatedAtString(),
		},
	});

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
