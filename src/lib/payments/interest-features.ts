export const PAYMENT_INTEREST_FEATURES = [
  "connects_payment",
  "beta_reward_funding",
] as const;

export type PaymentInterestFeature = (typeof PAYMENT_INTEREST_FEATURES)[number];

export const PAYMENT_INTEREST_FEATURE_SET = new Set<string>(PAYMENT_INTEREST_FEATURES);
