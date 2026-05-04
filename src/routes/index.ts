import { Router } from "express";
import authRouter from "./auth.route";
import userRouter from "./user.route";
import walletRouter from "./wallet.route";

const router = Router();

router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/wallets", walletRouter);

export default router;
