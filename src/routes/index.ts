import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import userRouter from "./user.route";
import walletRouter from "./wallet.route";
import transactionRouter from "./transaction.route";

const router = Router();

router.use(authMiddleware);
router.use("/users", userRouter);
router.use("/wallets", walletRouter);
router.use("/transactions", transactionRouter);

export default router;
