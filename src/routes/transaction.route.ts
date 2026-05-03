import { Router } from "express";
import { listTransactionsHandler } from "../controllers/transaction.controller";

const transactionRouter = Router();

transactionRouter.get("/:userId", listTransactionsHandler);

export default transactionRouter;
