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

  const [balance, transactionWindow, currency, hasClaimedGift] = await Promise.all([
    getConnectsBalance(userId).catch(() => 0),
    getConnectsTransactions(userId, { limit: 21, offset: 0 }).catch(() => []),
    getVisitorCurrency().catch(() => "USD" as const),
    hasClaimedSignupGift(userId).catch(() => false),
  ]);
  const hasMoreTransactions = transactionWindow.length > 20;
  const transactions = transactionWindow.slice(0, 20);

  return (
    <ConnectsClient
      balance={balance}
      transactions={transactions}
      hasMoreTransactions={hasMoreTransactions}
      currency={currency}
      signupGiftAmount={SIGNUP_GIFT_CONNECTS}
      hasClaimedGift={hasClaimedGift}
    />
  );
}
