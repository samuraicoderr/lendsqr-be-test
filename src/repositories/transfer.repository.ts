import { DbOrTrx } from "./user.repository";

export interface TransferRow {
  id: string;
  sender_wallet_id: string;
  receiver_wallet_id: string;
  amount: string;
  reference: string;
  status: "pending" | "success" | "failed";
  created_at: Date;
}

export async function findTransferByReference(
  db: DbOrTrx,
  reference: string
): Promise<TransferRow | undefined> {
  return db<TransferRow>("transfers").where({ reference }).first();
}

export async function insertTransfer(
  db: DbOrTrx,
  transfer: Omit<TransferRow, "created_at">
): Promise<void> {
  await db<TransferRow>("transfers").insert(transfer);
}
