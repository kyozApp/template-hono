import { defineContract } from "@prisma/orm-postgres/contract-builder";

export const contract = defineContract(
	{},
	({ field, model, rel, gen, type }) => {
		// ─── 1. Modelos Core ─────────────────────────────────────────────────────────

		// Usuario (Autenticación y Perfil)
		const User = model("User", {
			fields: {
				id: field.column(type.Uuid()).id().onCreate(gen.uuid(7)),
				name: field.column(type.String()),
				username: field.column(type.String()).unique(),
				email: field.column(type.String()).unique(),
				password: field.column(type.String()),
				role: field.column(type.String()),
				isActive: field.column(type.Boolean()),
				isDeleted: field.column(type.Boolean()).default(false),
				deletedAt: field.column(type.DateTime({ as: "string" })).optional(),
				createdAt: field
					.column(type.DateTime({ as: "string" }))
					.onCreate(gen.now()),
				updatedAt: field
					.column(type.DateTime({ as: "string" }))
					.onCreate(gen.now())
					.onUpdate(gen.now()),
			},
		});

		// Sesión (Persistencia con TTL)
		const Session = model("Session", {
			fields: {
				id: field.column(type.Uuid()).id().onCreate(gen.uuid(7)),
				userId: field.column(type.Uuid()),
				expiresAt: field.column(type.DateTime({ as: "string" })),
				createdAt: field
					.column(type.DateTime({ as: "string" }))
					.onCreate(gen.now()),
				updatedAt: field
					.column(type.DateTime({ as: "string" }))
					.onCreate(gen.now())
					.onUpdate(gen.now()),
			},
		});

		// ─── 2. Relaciones del Dominio ───────────────────────────────────────────────

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
	},
);
