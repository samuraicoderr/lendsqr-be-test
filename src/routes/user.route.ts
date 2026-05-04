import { Router } from "express";
import { getMeHandler, getUserByIdHandler, listUsersHandler } from "../controllers/user.controller";
import { registerRoute } from "../docs/registry";
import { apiResponseSchema } from "../validation/response.schema";
import { userIdParamSchema } from "../validation/common.schema";
import { userResponseSchema, usersResponseSchema } from "../validation/user.schema";
import { requireAdmin, requireVerified } from "../middleware/permission.middleware";
import { requireAuth } from "../middleware/auth.middleware";

const userRouter = Router();

userRouter.get("/me", requireAuth, requireVerified, getMeHandler);
userRouter.get("/", requireAuth, requireVerified, requireAdmin, listUsersHandler);
userRouter.get("/:userId", requireAuth, requireVerified, requireAdmin, getUserByIdHandler);

registerRoute({
	method: "get",
	path: "/api/v1/users/me",
	summary: "Get current user profile",
	tags: ["Users"],
	responses: {
		200: {
			description: "User profile",
			schema: apiResponseSchema(userResponseSchema)
		}
	}
});

registerRoute({
	method: "get",
	path: "/api/v1/users",
	summary: "List users",
	tags: ["Users"],
	responses: {
		200: {
			description: "Users fetched",
			schema: apiResponseSchema(usersResponseSchema)
		}
	}
});

registerRoute({
	method: "get",
	path: "/api/v1/users/{userId}",
	summary: "Get user by ID",
	tags: ["Users"],
	request: {
		params: userIdParamSchema
	},
	responses: {
		200: {
			description: "User fetched",
			schema: apiResponseSchema(userResponseSchema)
		}
	}
});

export default userRouter;
