import crypto from "crypto";
import { DbOrTrx } from "../repositories/user.repository";
import { findWalletByAccountNumber } from "../repositories/wallet.repository";

export function generateAccountNumber(): string {
  let accountNumber = "";

  for (let i = 0; i < 11; i += 1) {
    accountNumber += crypto.randomInt(0, 10).toString();
  }

  return accountNumber;
}

export async function generateUniqueAccountNumber(db: DbOrTrx): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const accountNumber = generateAccountNumber();
    const existing = await findWalletByAccountNumber(db, accountNumber);
    if (!existing) {
      return accountNumber;
    }
  }

  throw new Error("Unable to generate unique account number");
}
