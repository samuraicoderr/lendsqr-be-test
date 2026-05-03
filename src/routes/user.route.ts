import { Router } from "express";
import { createUserHandler } from "../controllers/user.controller";
import { registerRoute } from "../docs/registry";
import { apiResponseSchema } from "../validation/response.schema";
import { createUserResponseSchema, createUserSchema } from "../validation/user.schema";

const userRouter = Router();

userRouter.post("/", createUserHandler);

registerRoute({
	method: "post",
	path: "/api/users",
	summary: "Create a user",
	tags: ["Users"],
	request: {
		body: createUserSchema
	},
	responses: {
		201: {
			description: "User created",
			schema: apiResponseSchema(createUserResponseSchema)
		}
	}
});

export default userRouter;
