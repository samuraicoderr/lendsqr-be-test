import { Router } from "express";
import { listTransactionsHandler } from "../controllers/transaction.controller";
import { registerRoute } from "../docs";
import { userIdParamSchema } from "../validation/common.schema";
import { apiResponseSchema } from "../validation/response.schema";
import { transactionsResponseSchema } from "../validation/transaction.schema";

const transactionRouter = Router();

transactionRouter.get("/:userId", listTransactionsHandler);

registerRoute({
	method: "get",
	path: "/api/transactions/{userId}",
	summary: "List transactions for a user",
	tags: ["Transactions"],
	request: {
		params: userIdParamSchema
	},
	responses: {
		200: {
			description: "Transactions fetched",
			schema: apiResponseSchema(transactionsResponseSchema)
		}
	}
});

export default transactionRouter;
