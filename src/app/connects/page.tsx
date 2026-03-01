import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getConnectsBalance, getConnectsTransactions } from "@/lib/db/connects";
import { getVisitorCurrency } from "@/lib/geo";
import { ConnectsClient } from "./connects-client";

export default async function ConnectsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [balance, transactions, currency] = await Promise.all([
    getConnectsBalance(userId),
    getConnectsTransactions(userId),
    getVisitorCurrency(),
  ]);

  return <ConnectsClient balance={balance} transactions={transactions} currency={currency} />;
}
