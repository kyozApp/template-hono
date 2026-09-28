import { Hono } from "hono";

import { authRouter } from "../modules/auth/auth.router.js";
import { userRouter } from "../modules/user/user.router.js";

export const router = new Hono();

router.route("/auth", authRouter);
router.route("/users", userRouter);
