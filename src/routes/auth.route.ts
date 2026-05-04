import { Router } from "express";
import {
  loginHandler,
  registerHandler,
  resendVerificationHandler,
  verifyEmailHandler
} from "../controllers/auth.controller";
import { registerRoute } from "../docs/registry";
import { apiResponseSchema } from "../validation/response.schema";
import {
  authResponseSchema,
  loginSchema,
  registerResponseSchema,
  registerSchema,
  resendVerificationResponseSchema,
  resendVerificationSchema,
  verifyEmailSchema
} from "../validation/auth.schema";

const authRouter = Router();

authRouter.post("/register", registerHandler);
authRouter.post("/login", loginHandler);
authRouter.post("/resend-verification", resendVerificationHandler);
authRouter.get("/verify", verifyEmailHandler);

registerRoute({
  method: "post",
  path: "/api/v1/auth/register",
  summary: "Register a new user",
  tags: ["Auth"],
  request: {
    body: registerSchema
  },
  responses: {
    201: {
      description: "User registered",
      schema: apiResponseSchema(registerResponseSchema)
    }
  },
  secured: false
});

registerRoute({
  method: "post",
  path: "/api/v1/auth/login",
  summary: "Login",
  tags: ["Auth"],
  request: {
    body: loginSchema
  },
  responses: {
    200: {
      description: "Authenticated",
      schema: apiResponseSchema(authResponseSchema)
    }
  },
  secured: false
});

registerRoute({
  method: "post",
  path: "/api/v1/auth/resend-verification",
  summary: "Resend email verification",
  tags: ["Auth"],
  request: {
    body: resendVerificationSchema
  },
  responses: {
    200: {
      description: "Verification email sent",
      schema: apiResponseSchema(resendVerificationResponseSchema)
    }
  },
  secured: false
});

registerRoute({
  method: "get",
  path: "/api/v1/auth/verify",
  summary: "Verify email",
  tags: ["Auth"],
  request: {
    query: verifyEmailSchema
  },
  responses: {
    200: {
      description: "Email verified",
      schema: apiResponseSchema(authResponseSchema.shape.user)
    }
  },
  secured: false
});

export default authRouter;
