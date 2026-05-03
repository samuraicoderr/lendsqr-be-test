import { Router } from "express";
import {
  fundWalletHandler,
  getWalletHandler,
  transferWalletHandler,
  withdrawWalletHandler
} from "../controllers/wallet.controller";
import { registerRoute } from "../docs";
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

const walletRouter = Router();

walletRouter.post("/fund", fundWalletHandler);
walletRouter.post("/withdraw", withdrawWalletHandler);
walletRouter.post("/transfer", transferWalletHandler);
walletRouter.get("/:userId", getWalletHandler);

registerRoute({
  method: "post",
  path: "/api/wallets/fund",
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
  path: "/api/wallets/withdraw",
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
  path: "/api/wallets/transfer",
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
  path: "/api/wallets/{userId}",
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
