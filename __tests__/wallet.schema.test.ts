import { fundWalletSchema, transferWalletSchema, withdrawWalletSchema } from "../src/validation/wallet.schema";
import { randomUUID } from "crypto";

describe("wallet schemas", () => {
  it("fund and withdraw only accept an amount", () => {
    expect(fundWalletSchema.parse({ amount: "100.00" })).toEqual({ amount: "100.00" });
    expect(withdrawWalletSchema.parse({ amount: 25 })).toEqual({ amount: 25 });

    expect(fundWalletSchema.safeParse({ userId: randomUUID(), amount: "100.00" }).success).toBe(false);
  });

  it("requires exactly one transfer receiver identifier", () => {
    expect(
      transferWalletSchema.safeParse({
        receiverAccountNumber: "12345678901",
        amount: "100.00"
      }).success
    ).toBe(true);

    expect(
      transferWalletSchema.safeParse({
        receiverUserId: randomUUID(),
        amount: "100.00"
      }).success
    ).toBe(true);

    expect(transferWalletSchema.safeParse({ amount: "100.00" }).success).toBe(false);

    expect(
      transferWalletSchema.safeParse({
        receiverAccountNumber: "12345678901",
        receiverUserId: randomUUID(),
        amount: "100.00"
      }).success
    ).toBe(false);
  });
});
