import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getConnectsBalance, getConnectsTransactions } from "@/lib/db/connects";
import { ConnectsClient } from "./connects-client";

export default async function ConnectsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [balance, transactions] = await Promise.all([
    getConnectsBalance(userId),
    getConnectsTransactions(userId),
  ]);

  return <ConnectsClient balance={balance} transactions={transactions} />;
}
