/**
 * Constantes y Enums Maestros del Dominio.
 *
 * Este archivo es un "Nodo Hoja" (Leaf Node): no importa nada de ningún otro
 * módulo del proyecto, siendo inmune a dependencias circulares.
 *
 * Actúa como Fuente Única de Verdad (Single Source of Truth) para:
 * 1. Base de datos (Prisma contract)
 * 2. Validación de API (Valibot schemas)
 * 3. Tipos y Middlewares (TypeScript)
 */

// --- Roles de Usuario ---
export const ROLES = ["SUPERADMIN", "ADMIN", "USER", "VIEWER"] as const;
export type Role = (typeof ROLES)[number];

// --- Entornos de Ejecución ---
export const NODE_ENVS = ["development", "production"] as const;
export type NodeEnv = (typeof NODE_ENVS)[number];
