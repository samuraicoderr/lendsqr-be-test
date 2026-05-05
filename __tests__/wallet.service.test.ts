type WalletRow = {
  id: string;
  user_id: string;
  account_number: string;
  balance: string;
  currency: string;
  created_at: Date;
  updated_at: Date;
};

type TransactionRow = {
  id: string;
  wallet_id: string;
  type: "credit" | "debit";
  amount: string;
  reference: string;
  status: "pending" | "success" | "failed";
  metadata: object | null;
  created_at: Date;
};

type TransferRow = {
  id: string;
  sender_wallet_id: string;
  receiver_wallet_id: string;
  amount: string;
  reference: string;
  status: "pending" | "success" | "failed";
  created_at: Date;
};

type UserRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

type TestDbState = {
  wallets: WalletRow[];
  transactions: TransactionRow[];
  transfers: TransferRow[];
  users: UserRow[];
};

let mockState: TestDbState;
let mockTransactionInsertFailureAt: number | null;
let mockTransactionInsertCount: number;

function cloneState(state: TestDbState): TestDbState {
  return {
    wallets: state.wallets.map((wallet) => ({ ...wallet })),
    transactions: state.transactions.map((transaction) => ({ ...transaction })),
    transfers: state.transfers.map((transfer) => ({ ...transfer })),
    users: state.users.map((user) => ({ ...user }))
  };
}

jest.mock("../src/db/knex", () => ({
  db: {
    transaction: jest.fn(async (callback: (trx: TestDbState) => Promise<unknown>) => {
      const transactionState = cloneState(mockState);
      const result = await callback(transactionState);
      mockState = transactionState;
      return result;
    })
  }
}));

jest.mock("../src/repositories/wallet.repository", () => ({
  findWalletByUserId: jest.fn(async (db: TestDbState, userId: string) =>
    db.wallets.find((wallet) => wallet.user_id === userId)
  ),
  findWalletByAccountNumber: jest.fn(async (db: TestDbState, accountNumber: string) =>
    db.wallets.find((wallet) => wallet.account_number === accountNumber)
  ),
  findWalletByUserIdForUpdate: jest.fn(async (db: TestDbState, userId: string) =>
    db.wallets.find((wallet) => wallet.user_id === userId)
  ),
  findWalletsByIdsForUpdate: jest.fn(async (db: TestDbState, walletIds: string[]) =>
    db.wallets
      .filter((wallet) => walletIds.includes(wallet.id))
      .sort((left, right) => left.id.localeCompare(right.id))
  ),
  updateWalletBalance: jest.fn(async (db: TestDbState, walletId: string, balance: string) => {
    const wallet = db.wallets.find((candidate) => candidate.id === walletId);
    if (!wallet) {
      throw new Error("Wallet not found");
    }
    wallet.balance = balance;
  })
}));

jest.mock("../src/repositories/transaction.repository", () => ({
  insertTransaction: jest.fn(async (db: TestDbState, transaction: Omit<TransactionRow, "created_at">) => {
    mockTransactionInsertCount += 1;
    if (mockTransactionInsertFailureAt === mockTransactionInsertCount) {
      throw new Error("Simulated transaction insert failure");
    }
    db.transactions.push({ ...transaction, created_at: new Date() });
  })
}));

jest.mock("../src/repositories/transfer.repository", () => ({
  insertTransfer: jest.fn(async (db: TestDbState, transfer: Omit<TransferRow, "created_at">) => {
    db.transfers.push({ ...transfer, created_at: new Date() });
  })
}));

jest.mock("../src/repositories/user.repository", () => ({
  findUserById: jest.fn(async (db: TestDbState, userId: string) =>
    db.users.find((user) => user.id === userId)
  )
}));

jest.mock("../src/services/notification.service", () => ({
  sendWalletFundedNotification: jest.fn(),
  sendWalletWithdrawnNotification: jest.fn(),
  sendTransferReceivedNotification: jest.fn()
}));

import { fundWallet, transferWallet, withdrawWallet } from "../src/services/wallet.service";

function seedState(overrides: Partial<TestDbState> = {}) {
  const createdAt = new Date("2026-01-01T00:00:00.000Z");

  mockState = {
    users: [
      { id: "sender-user", first_name: "Sender", last_name: "User", email: "sender@example.com" },
      { id: "receiver-user", first_name: "Receiver", last_name: "User", email: "receiver@example.com" }
    ],
    wallets: [
      {
        id: "sender-wallet",
        user_id: "sender-user",
        account_number: "11111111111",
        balance: "100.00",
        currency: "NGN",
        created_at: createdAt,
        updated_at: createdAt
      },
      {
        id: "receiver-wallet",
        user_id: "receiver-user",
        account_number: "22222222222",
        balance: "25.00",
        currency: "NGN",
        created_at: createdAt,
        updated_at: createdAt
      }
    ],
    transactions: [],
    transfers: [],
    ...overrides
  };
}

describe("wallet.service", () => {
  beforeEach(() => {
    seedState();
    mockTransactionInsertFailureAt = null;
    mockTransactionInsertCount = 0;
    jest.clearAllMocks();
  });

  describe("fundWallet", () => {
    it("increases the balance and creates a credit transaction", async () => {
      const result = await fundWallet({
        userId: "sender-user",
        email: "sender@example.com",
        firstName: "Sender",
        amount: "50.00"
      });

      expect(result.balance).toBe("150.00");
      expect(mockState.wallets.find((wallet) => wallet.id === "sender-wallet")?.balance).toBe("150.00");
      expect(mockState.transactions).toHaveLength(1);
      expect(mockState.transactions[0]).toMatchObject({
        wallet_id: "sender-wallet",
        type: "credit",
        amount: "50.00",
        status: "success"
      });
    });

    it("rejects invalid amounts without creating a transaction", async () => {
      await expect(
        fundWallet({
          userId: "sender-user",
          email: "sender@example.com",
          firstName: "Sender",
          amount: "-1.00"
        })
      ).rejects.toThrow("Amount must be greater than zero");

      expect(mockState.wallets.find((wallet) => wallet.id === "sender-wallet")?.balance).toBe("100.00");
      expect(mockState.transactions).toHaveLength(0);
    });
  });

  describe("withdrawWallet", () => {
    it("decreases the balance and creates a debit transaction", async () => {
      const result = await withdrawWallet({
        userId: "sender-user",
        email: "sender@example.com",
        firstName: "Sender",
        amount: "40.00"
      });

      expect(result.balance).toBe("60.00");
      expect(mockState.wallets.find((wallet) => wallet.id === "sender-wallet")?.balance).toBe("60.00");
      expect(mockState.transactions).toHaveLength(1);
      expect(mockState.transactions[0]).toMatchObject({
        wallet_id: "sender-wallet",
        type: "debit",
        amount: "40.00",
        status: "success"
      });
    });

    it("fails on insufficient funds and never creates a negative balance", async () => {
      await expect(
        withdrawWallet({
          userId: "sender-user",
          email: "sender@example.com",
          firstName: "Sender",
          amount: "101.00"
        })
      ).rejects.toThrow("Insufficient balance");

      expect(mockState.wallets.find((wallet) => wallet.id === "sender-wallet")?.balance).toBe("100.00");
      expect(Number(mockState.wallets.find((wallet) => wallet.id === "sender-wallet")?.balance)).toBeGreaterThanOrEqual(0);
      expect(mockState.transactions).toHaveLength(0);
    });
  });

  describe("transferWallet", () => {
    it("decreases sender balance, increases receiver balance, and records both sides atomically", async () => {
      const result = await transferWallet({
        senderUserId: "sender-user",
        senderFirstName: "Sender",
        senderLastName: "User",
        receiverAccountNumber: "22222222222",
        amount: "30.00"
      });

      expect(result.senderBalance).toBe("70.00");
      expect(result.receiverBalance).toBe("55.00");
      expect(mockState.wallets.find((wallet) => wallet.id === "sender-wallet")?.balance).toBe("70.00");
      expect(mockState.wallets.find((wallet) => wallet.id === "receiver-wallet")?.balance).toBe("55.00");
      expect(mockState.transfers).toHaveLength(1);
      expect(mockState.transactions).toEqual([
        expect.objectContaining({ wallet_id: "sender-wallet", type: "debit", amount: "30.00" }),
        expect.objectContaining({ wallet_id: "receiver-wallet", type: "credit", amount: "30.00" })
      ]);
    });

    it("rolls back both wallets when sender has insufficient balance", async () => {
      await expect(
        transferWallet({
          senderUserId: "sender-user",
          senderFirstName: "Sender",
          senderLastName: "User",
          receiverUserId: "receiver-user",
          amount: "150.00"
        })
      ).rejects.toThrow("Insufficient balance");

      expect(mockState.wallets.find((wallet) => wallet.id === "sender-wallet")?.balance).toBe("100.00");
      expect(mockState.wallets.find((wallet) => wallet.id === "receiver-wallet")?.balance).toBe("25.00");
      expect(mockState.transfers).toHaveLength(0);
      expect(mockState.transactions).toHaveLength(0);
    });

    it("rolls back when the receiver cannot be resolved", async () => {
      await expect(
        transferWallet({
          senderUserId: "sender-user",
          senderFirstName: "Sender",
          senderLastName: "User",
          receiverAccountNumber: "99999999999",
          amount: "10.00"
        })
      ).rejects.toThrow("Receiver wallet not found");

      expect(mockState.wallets.find((wallet) => wallet.id === "sender-wallet")?.balance).toBe("100.00");
      expect(mockState.wallets.find((wallet) => wallet.id === "receiver-wallet")?.balance).toBe("25.00");
      expect(mockState.transfers).toHaveLength(0);
      expect(mockState.transactions).toHaveLength(0);
    });

    it("rolls back transfer and transactions when the database fails mid-transaction", async () => {
      mockTransactionInsertFailureAt = 2;

      await expect(
        transferWallet({
          senderUserId: "sender-user",
          senderFirstName: "Sender",
          senderLastName: "User",
          receiverUserId: "receiver-user",
          amount: "30.00"
        })
      ).rejects.toThrow("Simulated transaction insert failure");

      expect(mockState.wallets.find((wallet) => wallet.id === "sender-wallet")?.balance).toBe("100.00");
      expect(mockState.wallets.find((wallet) => wallet.id === "receiver-wallet")?.balance).toBe("25.00");
      expect(mockState.transfers).toHaveLength(0);
      expect(mockState.transactions).toHaveLength(0);
    });
  });
});
