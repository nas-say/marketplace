import assert from "node:assert/strict";
import test from "node:test";
import { INR_CONNECT_BUNDLES, getInrBundleByConnects } from "../src/lib/payments/razorpay";

test("INR bundles map valid connects values", () => {
  assert.deepEqual(getInrBundleByConnects(10), { connects: 10, amountInPaise: 20000 });
  assert.deepEqual(getInrBundleByConnects(25), { connects: 25, amountInPaise: 38000 });
  assert.deepEqual(getInrBundleByConnects(60), { connects: 60, amountInPaise: 82000 });
});

test("INR bundles reject unknown connects values", () => {
  assert.equal(getInrBundleByConnects(0), null);
  assert.equal(getInrBundleByConnects(999), null);
});

test("INR bundles are unique and positive", () => {
  const connectsSet = new Set(INR_CONNECT_BUNDLES.map((bundle) => bundle.connects));
  assert.equal(connectsSet.size, INR_CONNECT_BUNDLES.length);
  for (const bundle of INR_CONNECT_BUNDLES) {
    assert.ok(bundle.connects > 0);
    assert.ok(bundle.amountInPaise > 0);
  }
});
