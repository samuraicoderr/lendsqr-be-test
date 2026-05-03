import { Router } from "express";
import {
  fundWalletHandler,
  getWalletHandler,
  transferWalletHandler,
  withdrawWalletHandler
} from "../controllers/wallet.controller";

const walletRouter = Router();

walletRouter.post("/fund", fundWalletHandler);
walletRouter.post("/withdraw", withdrawWalletHandler);
walletRouter.post("/transfer", transferWalletHandler);
walletRouter.get("/:userId", getWalletHandler);

export default walletRouter;
