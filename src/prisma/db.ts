import postgres from "@prisma/orm-postgres/runtime";

import { env } from "../config/env.js";
import type { Contract } from "./contract.d.js";
import contractJson from "./contract.json" with { type: "json" };

/**
 * Cliente singleton de base de datos para PostgreSQL con Prisma 8.
 */
export const db = postgres<Contract>({
	contractJson,
	url: env.DATABASE_URL,
});
