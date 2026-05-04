import { Router } from "express";
import {
  fundWalletHandler,
  getWalletBalanceHandler,
  getWalletHandler,
  listWalletTransactionsHandler,
  transferWalletHandler,
  withdrawWalletHandler
} from "../controllers/wallet.controller";
import { registerRoute } from "../docs/registry";
import { userIdParamSchema } from "../validation/common.schema";
import { apiResponseSchema } from "../validation/response.schema";
import {
  fundWalletSchema,
  transferResponseSchema,
  transferWalletSchema,
  walletMutationResponseSchema,
  walletResponseSchema,
  withdrawWalletSchema
} from "../validation/wallet.schema";
import { transactionsResponseSchema } from "../validation/transaction.schema";
import { requireAuth } from "../middleware/auth.middleware";
import { requireAdmin, requireVerified } from "../middleware/permission.middleware";

const walletRouter = Router();

walletRouter.post("/fund", requireAuth, requireVerified, fundWalletHandler);
walletRouter.post("/withdraw", requireAuth, requireVerified, withdrawWalletHandler);
walletRouter.post("/transfer", requireAuth, requireVerified, transferWalletHandler);
walletRouter.get("/balance", requireAuth, requireVerified, getWalletBalanceHandler);
walletRouter.get("/transactions", requireAuth, requireVerified, listWalletTransactionsHandler);
walletRouter.get("/:userId", requireAuth, requireAdmin, getWalletHandler);

registerRoute({
  method: "post",
  path: "/api/v1/wallets/fund",
  summary: "Fund a wallet",
  tags: ["Wallets"],
  request: {
    body: fundWalletSchema
  },
  responses: {
    200: {
      description: "Wallet funded",
      schema: apiResponseSchema(walletMutationResponseSchema)
    }
  }
});

registerRoute({
  method: "post",
  path: "/api/v1/wallets/withdraw",
  summary: "Withdraw from a wallet",
  tags: ["Wallets"],
  request: {
    body: withdrawWalletSchema
  },
  responses: {
    200: {
      description: "Wallet withdrawal completed",
      schema: apiResponseSchema(walletMutationResponseSchema)
    }
  }
});

registerRoute({
  method: "post",
  path: "/api/v1/wallets/transfer",
  summary: "Transfer funds between wallets",
  tags: ["Wallets"],
  request: {
    body: transferWalletSchema
  },
  responses: {
    200: {
      description: "Transfer completed",
      schema: apiResponseSchema(transferResponseSchema)
    }
  }
});

registerRoute({
  method: "get",
  path: "/api/v1/wallets/balance",
  summary: "Get wallet balance",
  tags: ["Wallets"],
  responses: {
    200: {
      description: "Wallet fetched",
      schema: apiResponseSchema(walletResponseSchema)
    }
  }
});

registerRoute({
  method: "get",
  path: "/api/v1/wallets/transactions",
  summary: "Get wallet transactions",
  tags: ["Wallets"],
  responses: {
    200: {
      description: "Transactions fetched",
      schema: apiResponseSchema(transactionsResponseSchema)
    }
  }
});

registerRoute({
  method: "get",
  path: "/api/v1/wallets/{userId}",
  summary: "Get a wallet by user ID",
  tags: ["Wallets"],
  request: {
    params: userIdParamSchema
  },
  responses: {
    200: {
      description: "Wallet fetched",
      schema: apiResponseSchema(walletResponseSchema)
    }
  }
});

export default walletRouter;
