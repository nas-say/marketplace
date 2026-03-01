import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  getConnectsBalance,
  getConnectsTransactions,
  hasClaimedSignupGift,
  SIGNUP_GIFT_CONNECTS,
} from "@/lib/db/connects";
import { getVisitorCurrency } from "@/lib/geo";
import { ConnectsClient } from "./connects-client";

export default async function ConnectsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [balance, transactions, currency, hasClaimedGift] = await Promise.all([
    getConnectsBalance(userId),
    getConnectsTransactions(userId),
    getVisitorCurrency(),
    hasClaimedSignupGift(userId).catch(() => false),
  ]);

  return (
    <ConnectsClient
      balance={balance}
      transactions={transactions}
      currency={currency}
      signupGiftAmount={SIGNUP_GIFT_CONNECTS}
      hasClaimedGift={hasClaimedGift}
    />
  );
}
