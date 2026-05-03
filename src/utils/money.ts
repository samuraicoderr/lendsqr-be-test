import Decimal from "decimal.js";
import { ApiError } from "./errors";

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export function parseAmount(value: string | number): string {
  const amount = new Decimal(value);

  if (!amount.isFinite()) {
    throw ApiError.badRequest("Amount must be a valid number");
  }

  if (amount.lte(0)) {
    throw ApiError.badRequest("Amount must be greater than zero");
  }

  if (amount.decimalPlaces() !== null && amount.decimalPlaces() > 2) {
    throw ApiError.badRequest("Amount must have at most 2 decimal places");
  }

  return amount.toDecimalPlaces(2).toFixed(2);
}

export function addAmounts(balance: string, amount: string): string {
  return new Decimal(balance).plus(amount).toFixed(2);
}

export function subtractAmounts(balance: string, amount: string): string {
  return new Decimal(balance).minus(amount).toFixed(2);
}

export function hasSufficientBalance(balance: string, amount: string): boolean {
  return new Decimal(balance).gte(amount);
}
