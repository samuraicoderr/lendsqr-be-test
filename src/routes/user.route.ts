import { Router } from "express";
import { createUserHandler } from "../controllers/user.controller";

const userRouter = Router();

userRouter.post("/", createUserHandler);

export default userRouter;
