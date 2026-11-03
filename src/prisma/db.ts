import postgres from "@prisma/orm-postgres/runtime";
import { contractFromJson } from "@prisma/orm-postgres/static";

import { env } from "../config/env.js";
import type { Contract } from "./contract.d.js";
import contractJson from "./contract.json" with { type: "json" };

export const contract = contractFromJson<Contract>(contractJson);

/**
 * Cliente singleton de base de datos para PostgreSQL con Prisma 8.
 */
export const db = postgres({
	contract,
	url: env.DATABASE_URL,
});
