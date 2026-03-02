import assert from "node:assert/strict";
import test from "node:test";
import { calculateCashBetaPayout } from "../src/lib/payments/beta-payouts";

test("calculateCashBetaPayout computes 5% fee with ceil rounding", () => {
  const result = calculateCashBetaPayout(25_000);
  assert.equal(result.grossMinor, 25_000);
  assert.equal(result.feeMinor, 1_250);
  assert.equal(result.netMinor, 23_750);
});

test("calculateCashBetaPayout protects net from going negative", () => {
  const result = calculateCashBetaPayout(1);
  assert.equal(result.feeMinor, 1);
  assert.equal(result.netMinor, 0);
});

test("calculateCashBetaPayout sanitizes invalid inputs", () => {
  assert.deepEqual(calculateCashBetaPayout(-500), {
    grossMinor: 0,
    feeMinor: 0,
    netMinor: 0,
  });
  assert.deepEqual(calculateCashBetaPayout(Number.NaN), {
    grossMinor: 0,
    feeMinor: 0,
    netMinor: 0,
  });
});
